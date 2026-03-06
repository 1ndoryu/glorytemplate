<?php

/**
 * SamplesModificacionController — Actualizar y eliminar samples.
 *
 * Extraído de SamplesController (A04 SOLID split).
 *
 * Endpoints:
 *   PUT    /samples/{slug} — Actualizar metadatos
 *   DELETE /samples/{slug} — Eliminar sample
 *
 * @package Kamples
 */

namespace App\Kamples\Api\Controladores;

use App\Kamples\Auth\AuthMiddleware;
use App\Kamples\Api\Helpers\NormalizadorSample;
use App\Kamples\Api\Helpers\UsuarioHelper;
use App\Kamples\KamplesLogger;
use App\Kamples\Services\ServicioNotificaciones;
use App\Config\Schema\_generated\SamplesCols;
use App\Config\Schema\_generated\SamplesEnums;
use App\Kamples\Services\MotorRecomendacion;
use App\Kamples\Database\Repositories\SamplesRepository;

class SamplesModificacionController
{
    public static function registrarRutas(string $namespace): void
    {
        /*
         * PUT + DELETE en la ruta slug. WP REST API merges handlers
         * cuando se registra la misma ruta+namespace múltiples veces.
         */
        \register_rest_route($namespace, '/samples/(?P<slug>[a-zA-Z0-9_-]+)', [
            [
                'methods'             => 'DELETE',
                'callback'            => [self::class, 'eliminar'],
                'permission_callback' => [AuthMiddleware::class, 'requerirAuth'],
                'args'                => [
                    'slug' => ['required' => true, 'type' => 'string'],
                ],
            ],
            [
                'methods'             => 'PUT',
                'callback'            => [self::class, 'actualizar'],
                'permission_callback' => [AuthMiddleware::class, 'requerirAuth'],
                'args'                => [
                    'slug' => ['required' => true, 'type' => 'string'],
                ],
            ],
        ]);
    }

    /**
     * PUT /samples/{id} — Actualizar metadatos de un sample.
     * Solo el propietario o un admin pueden editar.
     */
    public static function actualizar(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
        $sampleId = (int) $request->get_param('slug');
        $usuarioId = UsuarioHelper::obtenerIdPg();
        $esAdmin = UsuarioHelper::esAdmin();

        if (!$usuarioId) {
            return UsuarioHelper::respuestaNoEncontrado();
        }

        $sample = SamplesRepository::buscarParaModificacion($sampleId);

        if (!$sample) {
            return new \WP_REST_Response(['code' => 'sample_no_encontrado'], 404);
        }

        if ((int) $sample[SamplesCols::CREADOR_ID] !== $usuarioId && !$esAdmin) {
            return new \WP_REST_Response(['code' => 'sin_permisos', 'message' => 'No tienes permiso para editar este sample'], 403);
        }

        $body = $request->get_json_params();
        $campos = [];
        $params = ['id' => $sampleId];

        if (isset($body['titulo'])) {
            $titulo = \sanitize_text_field($body['titulo']);
            if (\strlen($titulo) < 1 || \strlen($titulo) > 200) {
                return new \WP_REST_Response(['code' => 'titulo_invalido', 'message' => 'El título debe tener entre 1 y 200 caracteres'], 400);
            }
            $campos[] = SamplesCols::TITULO . ' = :' . SamplesCols::TITULO;
            $params[SamplesCols::TITULO] = $titulo;
        }

        if (isset($body['descripcion'])) {
            $campos[] = SamplesCols::DESCRIPCION . ' = :' . SamplesCols::DESCRIPCION;
            $params[SamplesCols::DESCRIPCION] = \sanitize_textarea_field($body['descripcion']);
        }

        if (isset($body['tags'])) {
            $tags = \is_array($body['tags']) ? $body['tags'] : [];
            $tags = \array_map('\sanitize_text_field', $tags);
            if (\count($tags) < 2) {
                return new \WP_REST_Response(['code' => 'tags_insuficientes', 'message' => 'Se requieren al menos 2 tags'], 400);
            }
            /* Normalizar tags: lowercase + trim + dedup — consistencia con upload y ConstructorSenales */
            $tags = NormalizadorSample::normalizarTags($tags);
            $campos[] = SamplesCols::TAGS . ' = :' . SamplesCols::TAGS;
            $params[SamplesCols::TAGS] = NormalizadorSample::phpArrayToPg($tags);
        }

        if (isset($body['tipo'])) {
            $tiposValidos = [
                SamplesEnums::TIPO_LOOP,
                SamplesEnums::TIPO_ONESHOT,
            ];
            if (!\in_array($body['tipo'], $tiposValidos, true)) {
                return new \WP_REST_Response(['code' => 'tipo_invalido'], 400);
            }
            $campos[] = SamplesCols::TIPO . ' = :tipo';
            $params['tipo'] = $body['tipo'];
        }

        if (isset($body['esPremium'])) {
            $campos[] = SamplesCols::ES_PREMIUM . ' = :esPremium';
            $params['esPremium'] = ((bool) $body['esPremium']) ? 'true' : 'false';
        }

        if (isset($body['precio'])) {
            $campos[] = SamplesCols::PRECIO . ' = :' . SamplesCols::PRECIO;
            $params[SamplesCols::PRECIO] = $body['precio'] !== null ? (float) $body['precio'] : null;
        }

        if (isset($body['permitirDescarga'])) {
            $campos[] = SamplesCols::PERMITIR_DESCARGA . ' = :descarga';
            $params['descarga'] = ((bool) $body['permitirDescarga']) ? 'true' : 'false';
        }

        if (isset($body['licenciaLibre'])) {
            $campos[] = SamplesCols::LICENCIA_LIBRE . ' = :licencia';
            $params['licencia'] = ((bool) $body['licenciaLibre']) ? 'true' : 'false';
        }

        /* C220: Toggle de visibilidad en comunidad */
        if (isset($body['mostrarEnComunidad'])) {
            $campos[] = SamplesCols::MOSTRAR_EN_COMUNIDAD . ' = :comunidad';
            $params['comunidad'] = ((bool) $body['mostrarEnComunidad']) ? 'true' : 'false';
        }

        if (isset($body['imagenUrl'])) {
            $campos[] = SamplesCols::IMAGEN_URL . ' = :imagenUrl';
            $params['imagenUrl'] = \esc_url_raw($body['imagenUrl']);
        }

        /* Solo admin puede verificar/desverificar */
        if (isset($body['verificado']) && $esAdmin) {
            $campos[] = SamplesCols::VERIFICADO . ' = :' . SamplesCols::VERIFICADO;
            $params[SamplesCols::VERIFICADO] = ((bool) $body['verificado']) ? 'true' : 'false';

            /* C266: Notificar al creador si se verifica el sample */
            if ((bool) $body['verificado']) {
                ServicioNotificaciones::sampleVerificado(
                    (int) $sample[SamplesCols::CREADOR_ID],
                    $sampleId,
                    $sample[SamplesCols::TITULO] ?? '',
                    $sample[SamplesCols::SLUG] ?? null
                );
            }

            /* Invalidar cache feed: el badge verificado debe reflejarse inmediatamente */
            MotorRecomendacion::invalidarCacheGlobal();
        }

        /* Solo admin puede cambiar el estado */
        if (isset($body['estado']) && $esAdmin) {
            $estadosValidos = [
                SamplesEnums::ESTADO_ACTIVO,
                SamplesEnums::ESTADO_INACTIVO,
                SamplesEnums::ESTADO_PROCESANDO,
            ];
            if (\in_array($body['estado'], $estadosValidos, true)) {
                $campos[] = SamplesCols::ESTADO . ' = :estado';
                $params['estado'] = $body['estado'];

                /* Cambio de estado afecta feeds globales */
                MotorRecomendacion::invalidarCacheGlobal();
            }
        }

        if (empty($campos)) {
            return new \WP_REST_Response(['code' => 'sin_cambios', 'message' => 'No se recibieron campos para actualizar'], 400);
        }

        SamplesRepository::actualizarCampos($sampleId, $campos, $params);

        KamplesLogger::info('Sample actualizado', [
            'sampleId' => $sampleId,
            'campos' => \array_keys(\array_diff_key($params, ['id' => 1])),
            'por' => $esAdmin && (int) $sample[SamplesCols::CREADOR_ID] !== $usuarioId ? 'admin' : 'propietario',
        ]);

        /* Devolver sample actualizado */
        $sampleActualizado = SamplesRepository::buscarNormalizadoPorId($sampleId, $usuarioId);

        if ($sampleActualizado) {
            return new \WP_REST_Response(['data' => NormalizadorSample::normalizar($sampleActualizado)], 200);
        }

        return new \WP_REST_Response(['ok' => true], 200);
        } catch (\Throwable $e) {
            KamplesLogger::error('SamplesModificacionController::actualizar error', ['error' => $e->getMessage()]);
            return new \WP_REST_Response(['code' => 'error_interno', 'message' => 'Error interno del servidor'], 500);
        }
    }

    /**
     * DELETE /samples/{id} — Eliminar sample.
     * Solo el propietario o un admin pueden borrar.
     * Elimina archivos físicos y registros relacionados.
     */
    public static function eliminar(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
        $sampleId = (int) $request->get_param('slug');
        $usuarioId = UsuarioHelper::obtenerIdPg();
        $esAdmin = UsuarioHelper::esAdmin();

        if (!$usuarioId) {
            return UsuarioHelper::respuestaNoEncontrado();
        }

        $sample = SamplesRepository::buscarParaEliminar($sampleId);

        if (!$sample) {
            return new \WP_REST_Response(['code' => 'sample_no_encontrado'], 404);
        }

        if ((int) $sample[SamplesCols::CREADOR_ID] !== $usuarioId && !$esAdmin) {
            return new \WP_REST_Response(['code' => 'sin_permisos', 'message' => 'No tienes permiso para eliminar este sample'], 403);
        }

        /* Eliminar archivos físicos del disco */
        self::eliminarArchivosFisicos($sample);

        /* Eliminar registros relacionados en cascada + sample */
        SamplesRepository::eliminarConCascada($sampleId);

        KamplesLogger::info('Sample eliminado', [
            'sampleId' => $sampleId,
            'titulo'   => $sample[SamplesCols::TITULO] ?? '',
            'por'      => $esAdmin && (int) $sample[SamplesCols::CREADOR_ID] !== $usuarioId ? 'admin' : 'propietario',
        ]);

        return new \WP_REST_Response(['ok' => true, 'eliminado' => true], 200);
        } catch (\Throwable $e) {
            KamplesLogger::error('SamplesModificacionController::eliminar error', ['error' => $e->getMessage()]);
            return new \WP_REST_Response(['code' => 'error_interno', 'message' => 'Error interno del servidor'], 500);
        }
    }

    /**
     * Elimina los archivos físicos (audio, waveform, preview) de un sample.
     * Expuesto como public para permitir reutilización en operaciones masivas de admin.
     * $sample debe provenir de SamplesRepository::buscarParaEliminar().
     */
    public static function eliminarArchivosFisicos(array $sample): void
    {
        try {
            $uploadDir = \wp_upload_dir();
            $baseDir = $uploadDir['basedir'];
            $rutasAEliminar = [SamplesCols::RUTA_ORIGINAL, SamplesCols::RUTA_OPTIMIZADA, SamplesCols::RUTA_PREVIEW, SamplesCols::RUTA_WAVEFORM];

            foreach ($rutasAEliminar as $campo) {
                if (!empty($sample[$campo])) {
                    $rutaCompleta = $sample[$campo];
                    if (!\file_exists($rutaCompleta)) {
                        $rutaCompleta = $baseDir . '/' . \ltrim($sample[$campo], '/');
                    }
                    if (\file_exists($rutaCompleta)) {
                        self::eliminarArchivoSiExiste($rutaCompleta, 'archivo principal de sample');
                    }
                }
            }

            /* Eliminar waveform JSON derivado */
            $rutaBase = $sample[SamplesCols::RUTA_ORIGINAL] ?? '';
            if ($rutaBase) {
                $rutaWaveform = \preg_replace('/\.[^.]+$/', '.json', $rutaBase);
                if ($rutaWaveform && \file_exists($rutaWaveform)) {
                    self::eliminarArchivoSiExiste($rutaWaveform, 'waveform derivado');
                }
                $rutaAbsWaveform = $baseDir . '/' . \ltrim((string) $rutaWaveform, '/');
                if (\file_exists($rutaAbsWaveform)) {
                    self::eliminarArchivoSiExiste($rutaAbsWaveform, 'waveform absoluto derivado');
                }
            }
        } catch (\Throwable $e) {
            KamplesLogger::error('eliminarArchivosFisicos error inesperado', [
                'sampleId' => $sample[SamplesCols::ID] ?? 'desconocido',
                'error' => $e->getMessage(),
            ]);
        }
    }

    private static function eliminarArchivoSiExiste(string $ruta, string $contexto): void
    {
        if (!\file_exists($ruta)) {
            return;
        }

        try {
            if (!\unlink($ruta)) {
                KamplesLogger::warning('No se pudo eliminar archivo al borrar sample', [
                    'ruta' => $ruta,
                    'contexto' => $contexto,
                ]);
            }
        } catch (\Throwable $e) {
            KamplesLogger::warning('Error eliminando archivo al borrar sample', [
                'ruta' => $ruta,
                'contexto' => $contexto,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
