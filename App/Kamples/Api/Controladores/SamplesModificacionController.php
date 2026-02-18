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
            $campos[] = 'titulo = :titulo';
            $params['titulo'] = $titulo;
        }

        if (isset($body['descripcion'])) {
            $campos[] = 'descripcion = :descripcion';
            $params['descripcion'] = \sanitize_textarea_field($body['descripcion']);
        }

        if (isset($body['tags'])) {
            $tags = \is_array($body['tags']) ? $body['tags'] : [];
            $tags = \array_map('\sanitize_text_field', $tags);
            if (\count($tags) < 2) {
                return new \WP_REST_Response(['code' => 'tags_insuficientes', 'message' => 'Se requieren al menos 2 tags'], 400);
            }
            $campos[] = 'tags = :tags';
            $params['tags'] = NormalizadorSample::phpArrayToPg($tags);
        }

        if (isset($body['tipo'])) {
            $tiposValidos = [
                SamplesEnums::TIPO_LOOP,
                SamplesEnums::TIPO_ONESHOT,
                SamplesEnums::TIPO_FX,
                SamplesEnums::TIPO_VOCAL,
                SamplesEnums::TIPO_STEM,
                SamplesEnums::TIPO_OTRO,
            ];
            if (!\in_array($body['tipo'], $tiposValidos, true)) {
                return new \WP_REST_Response(['code' => 'tipo_invalido'], 400);
            }
            $campos[] = 'tipo = :tipo';
            $params['tipo'] = $body['tipo'];
        }

        if (isset($body['esPremium'])) {
            $campos[] = 'es_premium = :esPremium';
            $params['esPremium'] = ((bool) $body['esPremium']) ? 'true' : 'false';
        }

        if (isset($body['precio'])) {
            $campos[] = 'precio = :precio';
            $params['precio'] = $body['precio'] !== null ? (float) $body['precio'] : null;
        }

        if (isset($body['permitirDescarga'])) {
            $campos[] = 'permitir_descarga = :descarga';
            $params['descarga'] = ((bool) $body['permitirDescarga']) ? 'true' : 'false';
        }

        if (isset($body['licenciaLibre'])) {
            $campos[] = 'licencia_libre = :licencia';
            $params['licencia'] = ((bool) $body['licenciaLibre']) ? 'true' : 'false';
        }

        /* C220: Toggle de visibilidad en comunidad */
        if (isset($body['mostrarEnComunidad'])) {
            $campos[] = 'mostrar_en_comunidad = :comunidad';
            $params['comunidad'] = ((bool) $body['mostrarEnComunidad']) ? 'true' : 'false';
        }

        if (isset($body['imagenUrl'])) {
            $campos[] = 'imagen_url = :imagenUrl';
            $params['imagenUrl'] = \esc_url_raw($body['imagenUrl']);
        }

        /* Solo admin puede verificar/desverificar */
        if (isset($body['verificado']) && $esAdmin) {
            $campos[] = 'verificado = :verificado';
            $params['verificado'] = ((bool) $body['verificado']) ? 'true' : 'false';

            /* C266: Notificar al creador si se verifica el sample */
            if ((bool) $body['verificado']) {
                ServicioNotificaciones::sampleVerificado(
                    (int) $sample[SamplesCols::CREADOR_ID],
                    $sampleId,
                    $sample[SamplesCols::TITULO] ?? '',
                    $sample[SamplesCols::SLUG] ?? null
                );
            }
        }

        /* Solo admin puede cambiar el estado */
        if (isset($body['estado']) && $esAdmin) {
            $estadosValidos = [
                SamplesEnums::ESTADO_ACTIVO,
                SamplesEnums::ESTADO_INACTIVO,
                SamplesEnums::ESTADO_PROCESANDO,
            ];
            if (\in_array($body['estado'], $estadosValidos, true)) {
                $campos[] = 'estado = :estado';
                $params['estado'] = $body['estado'];
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
    }

    /**
     * DELETE /samples/{id} — Eliminar sample.
     * Solo el propietario o un admin pueden borrar.
     * Elimina archivos físicos y registros relacionados.
     */
    public static function eliminar(\WP_REST_Request $request): \WP_REST_Response
    {
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
                    @\unlink($rutaCompleta);
                }
            }
        }

        /* Eliminar waveform JSON derivado */
        $rutaBase = $sample[SamplesCols::RUTA_ORIGINAL] ?? '';
        if ($rutaBase) {
            $rutaWaveform = \preg_replace('/\.[^.]+$/', '.json', $rutaBase);
            if ($rutaWaveform && \file_exists($rutaWaveform)) {
                @\unlink($rutaWaveform);
            }
            $rutaAbsWaveform = $baseDir . '/' . \ltrim($rutaWaveform, '/');
            if (\file_exists($rutaAbsWaveform)) {
                @\unlink($rutaAbsWaveform);
            }
        }

        /* Eliminar registros relacionados en cascada + sample */
        SamplesRepository::eliminarConCascada($sampleId);

        KamplesLogger::info('Sample eliminado', [
            'sampleId' => $sampleId,
            'titulo'   => $sample[SamplesCols::TITULO] ?? '',
            'por'      => $esAdmin && (int) $sample[SamplesCols::CREADOR_ID] !== $usuarioId ? 'admin' : 'propietario',
        ]);

        return new \WP_REST_Response(['ok' => true, 'eliminado' => true], 200);
    }
}
