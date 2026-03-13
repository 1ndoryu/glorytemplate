<?php
/* sentinel-disable-file limite-lineas — controlador update/delete cohesivo, sobre limite por C800 corregir-ia */

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
use App\Kamples\Api\ServicioIA;
use App\Kamples\KamplesLogger;
use App\Kamples\Services\ServicioNotificaciones;
use App\Config\Schema\_generated\SamplesCols;
use App\Config\Schema\_generated\SamplesEnums;
use App\Kamples\Services\MotorRecomendacion;
use App\Kamples\Database\Repositories\SamplesRepository;
use App\Helpers\JsonHelper;
use App\Kamples\Servicios\ServicioPapelera;
use App\Kamples\Servicios\ServicioMedia;

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

        /* D8: Subir/reemplazar imagen de portada de un sample */
        \register_rest_route($namespace, '/samples/(?P<id>\d+)/imagen', [
            'methods'             => 'POST',
            'callback'            => [self::class, 'subirImagen'],
            'permission_callback' => [AuthMiddleware::class, 'requerirAuth'],
        ]);

        /* C800: Corregir metadata IA de un sample (admin only) */
        \register_rest_route($namespace, '/samples/(?P<id>\d+)/corregir-ia', [
            'methods'             => 'POST',
            'callback'            => [self::class, 'corregirIA'],
            'permission_callback' => [AuthMiddleware::class, 'requerirAdmin'],
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

        /* QQ71: Verificar ban + suspensión */
        $cuentaResp = AuthMiddleware::verificarCuentaActiva($usuarioId);
        if ($cuentaResp) return $cuentaResp;

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
     * POST /samples/{id}/imagen — Subir/reemplazar imagen de portada.
     * Solo el propietario o admin puede cambiar la imagen.
     * Patrón idéntico a ColeccionesCrudController::subirImagen.
     */
    public static function subirImagen(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            $usuarioId = UsuarioHelper::obtenerIdPg();
            if (!$usuarioId) {
                return UsuarioHelper::respuestaNoEncontrado();
            }

            /* QQ71: Verificar ban + suspensión */
            $cuentaResp = AuthMiddleware::verificarCuentaActiva($usuarioId);
            if ($cuentaResp) return $cuentaResp;

            $sampleId = (int) $request->get_param('id');
            $esAdmin = UsuarioHelper::esAdmin();

            $sample = SamplesRepository::buscarParaModificacion($sampleId);
            if (!$sample) {
                return new \WP_REST_Response(['code' => 'sample_no_encontrado'], 404);
            }

            if ((int) $sample[SamplesCols::CREADOR_ID] !== $usuarioId && !$esAdmin) {
                return new \WP_REST_Response(['code' => 'sin_permisos', 'message' => 'No tienes permiso para editar este sample'], 403);
            }

            $files = $request->get_file_params();
            if (empty($files['imagen']) || $files['imagen']['error'] !== UPLOAD_ERR_OK) {
                return new \WP_REST_Response(['code' => 'imagen_requerida', 'message' => 'Se requiere un archivo de imagen'], 400);
            }

            $archivo = $files['imagen'];

            /* Validar tipo MIME real (no confiar en Content-Type del cliente) */
            $tiposPermitidos = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
            $finfo = \finfo_open(FILEINFO_MIME_TYPE);
            $tipoReal = \finfo_file($finfo, $archivo['tmp_name']);
            \finfo_close($finfo);

            if (!\in_array($tipoReal, $tiposPermitidos, true)) {
                return new \WP_REST_Response(['code' => 'tipo_no_permitido', 'message' => 'Solo se permiten imágenes JPG, PNG, WebP o GIF'], 400);
            }

            if ($archivo['size'] > 5 * 1024 * 1024) {
                return new \WP_REST_Response(['code' => 'archivo_muy_grande', 'message' => 'La imagen no puede superar 5MB'], 400);
            }

            $uploadDir = \wp_upload_dir();
            $carpeta = $uploadDir['basedir'] . '/kamples/samples/' . $usuarioId;
            if (!\file_exists($carpeta)) {
                $creada = \wp_mkdir_p($carpeta);
                if ($creada === false) {
                    KamplesLogger::error('No se pudo crear carpeta de imágenes sample', ['carpeta' => $carpeta]);
                    return new \WP_REST_Response(['code' => 'error_directorio', 'message' => 'Error al preparar almacenamiento'], 500);
                }
            }

            $ext = match ($tipoReal) {
                'image/jpeg' => 'jpg',
                'image/png'  => 'png',
                'image/webp' => 'webp',
                'image/gif'  => 'gif',
                default      => 'jpg',
            };

            $nombreArchivo = 'smp_' . \bin2hex(\random_bytes(8)) . '.' . $ext;
            $rutaDestino = $carpeta . '/' . $nombreArchivo;

            if (!move_uploaded_file($archivo['tmp_name'], $rutaDestino)) {
                return new \WP_REST_Response(['code' => 'error_guardado', 'message' => 'Error al guardar la imagen'], 500);
            }

            $url = \esc_url_raw($uploadDir['baseurl'] . '/kamples/samples/' . $usuarioId . '/' . $nombreArchivo);

            /* Persistir la URL en imagen_url */
            SamplesRepository::actualizarCampos(
                $sampleId,
                [SamplesCols::IMAGEN_URL . ' = :imagenUrl'],
                ['imagenUrl' => $url]
            );

            KamplesLogger::info('Imagen de sample actualizada', ['sampleId' => $sampleId, 'url' => $url]);

            return new \WP_REST_Response(['imagenUrl' => $url], 200);
        } catch (\Throwable $e) {
            KamplesLogger::error('SamplesModificacionController::subirImagen error', ['error' => $e->getMessage()]);
            return new \WP_REST_Response(['code' => 'error_interno', 'message' => 'Error interno del servidor'], 500);
        }
    }

    /**
     * DELETE /samples/{id} — Eliminar sample.
     * Propietario: soft-delete via papelera (30 días de retención, archivos en disco).
     * Admin: hard-delete irreversible con limpieza completa de archivos.
     * Las relaciones FK se actualizan automaticamente (SET NULL en DB).
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

        /* QQ71: Verificar ban + suspensión */
        $cuentaResp = AuthMiddleware::verificarCuentaActiva($usuarioId);
        if ($cuentaResp) return $cuentaResp;

        $sample = SamplesRepository::buscarParaEliminar($sampleId);

        if (!$sample) {
            return new \WP_REST_Response(['code' => 'sample_no_encontrado'], 404);
        }

        $esPropietario = (int) $sample[SamplesCols::CREADOR_ID] === $usuarioId;

        if (!$esPropietario && !$esAdmin) {
            return new \WP_REST_Response(['code' => 'sin_permisos', 'message' => 'No tienes permiso para eliminar este sample'], 403);
        }

        if ($esAdmin && !$esPropietario) {
            /* Admin eliminando sample de otro: hard-delete irreversible + limpieza archivos */
            self::eliminarArchivosFisicos($sample);
            ServicioMedia::limpiarMediaComentarios('sample', $sampleId);
            SamplesRepository::eliminarConCascada($sampleId);
        } else {
            /* QQ56: Propietario — papelera con retención 30 días. Archivos se mantienen en disco. */
            $ok = ServicioPapelera::enviarSample($sampleId);
            if (!$ok) {
                return new \WP_REST_Response(['code' => 'error_papelera', 'message' => 'Error al enviar a papelera'], 500);
            }
        }

        KamplesLogger::info('Sample eliminado', [
            'sampleId' => $sampleId,
            'titulo'   => $sample[SamplesCols::TITULO] ?? '',
            'modo'     => ($esAdmin && !$esPropietario) ? 'hard-delete-admin' : 'papelera-propietario',
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

    /**
     * C800: POST /samples/{id}/corregir-ia — Corregir metadata IA.
     * Solo admin. Recibe instrucciones de correccion, llama a ServicioIA::corregirMetadata()
     * y actualiza el sample con la metadata corregida.
     */
    public static function corregirIA(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            $sampleId = (int) $request->get_param('id');
            $body = $request->get_json_params();
            $instrucciones = \sanitize_textarea_field($body['instrucciones'] ?? '');

            if (\strlen($instrucciones) < 5 || \strlen($instrucciones) > 1000) {
                return new \WP_REST_Response([
                    'ok' => false,
                    'mensaje' => 'Las instrucciones deben tener entre 5 y 1000 caracteres',
                ], 400);
            }

            /* Obtener sample actual con toda su metadata */
            $sample = SamplesRepository::buscarPorId($sampleId);
            if (!$sample) {
                return new \WP_REST_Response(['ok' => false, 'mensaje' => 'Sample no encontrado'], 404);
            }

            /* Decodificar metadata actual */
            $metadataActual = JsonHelper::decodeOrDefault($sample[SamplesCols::METADATA] ?? '{}', []);
            $titulo = $sample[SamplesCols::TITULO] ?? '';

            $contextoTecnico = [
                'bpm' => $sample[SamplesCols::BPM] ?? null,
                'key' => $sample[SamplesCols::KEY] ?? null,
                'escala' => $sample[SamplesCols::ESCALA] ?? null,
            ];

            /* Llamar a ServicioIA para correccion */
            $metadataCorregida = ServicioIA::corregirMetadata($metadataActual, $titulo, $instrucciones, $contextoTecnico);

            if ($metadataCorregida === null) {
                return new \WP_REST_Response([
                    'ok' => false,
                    'mensaje' => 'Error al procesar la correccion con IA. Intenta de nuevo.',
                ], 502);
            }

            /* Preservar campos que no genera la IA (youtube_id, relacion_id, confianza, etc.) */
            $camposPreservados = ['youtube_id', 'lado_extraccion', 'relacion_id', 'bpm_confianza', 'key_confianza'];
            foreach ($camposPreservados as $campo) {
                if (isset($metadataActual[$campo])) {
                    $metadataCorregida[$campo] = $metadataActual[$campo];
                }
            }
            $metadataCorregida['corregido_at'] = \date('Y-m-d H:i:s');
            $metadataCorregida['corregido_instrucciones'] = $instrucciones;

            /* Construir actualizaciones al sample */
            $setClauses = [];
            $params = ['id' => $sampleId];
            $cambios = [];

            /* Metadata JSONB */
            $metaJson = \json_encode($metadataCorregida, JSON_UNESCAPED_UNICODE);
            if ($metaJson === false || \json_last_error() !== JSON_ERROR_NONE) {
                return new \WP_REST_Response(['ok' => false, 'mensaje' => 'Error serializando metadata'], 500);
            }
            $setClauses[] = SamplesCols::METADATA . ' = :metadata::jsonb';
            $params['metadata'] = $metaJson;
            $cambios['metadata'] = true;

            /* Tipo */
            $tipoRaw = \strtolower(\str_replace([' ', '-'], '', $metadataCorregida['tipo'] ?? ''));
            $tiposValidos = [SamplesEnums::TIPO_LOOP, SamplesEnums::TIPO_ONESHOT];
            $tipoNuevo = \in_array($tipoRaw, $tiposValidos, true) ? $tipoRaw : SamplesEnums::TIPO_ONESHOT;
            $setClauses[] = SamplesCols::TIPO . ' = :tipo';
            $params['tipo'] = $tipoNuevo;
            $cambios['tipo'] = $tipoNuevo;

            /* Titulo y slug desde nombre_archivo_base corregido */
            if (!empty($metadataCorregida['nombre_archivo_base'])) {
                $tituloCorregido = \ucwords($metadataCorregida['nombre_archivo_base']);
                $bpm = $sample[SamplesCols::BPM] ?? null;
                $key = $sample[SamplesCols::KEY] ?? null;
                $escala = $sample[SamplesCols::ESCALA] ?? null;

                if ($bpm) {
                    $tituloCorregido .= ' ' . $bpm . 'bpm';
                }
                if ($key) {
                    $keyStr = $key;
                    if ($escala === 'menor') {
                        $keyStr .= 'm';
                    }
                    $tituloCorregido .= ' ' . $keyStr;
                }

                $idCorto = $sample[SamplesCols::ID_CORTO] ?? \substr(\md5((string) $sampleId), 0, 7);
                $slugNuevo = \sanitize_title($tituloCorregido) . '-' . $idCorto;

                $setClauses[] = SamplesCols::TITULO . ' = :titulo';
                $params['titulo'] = $tituloCorregido;
                $cambios['titulo'] = $tituloCorregido;

                $setClauses[] = SamplesCols::SLUG . ' = :slug';
                $params['slug'] = $slugNuevo;
                $cambios['slug'] = $slugNuevo;
            }

            /* Tags: usar tags_es si existen, sino tags */
            $tagsNuevos = $metadataCorregida['tags_es'] ?? $metadataCorregida['tags'] ?? null;
            if (\is_array($tagsNuevos) && !empty($tagsNuevos)) {
                $tagsNuevos = NormalizadorSample::normalizarTags($tagsNuevos);
                $setClauses[] = SamplesCols::TAGS . ' = :tags';
                $params['tags'] = NormalizadorSample::phpArrayToPg($tagsNuevos);
                $cambios['tags'] = $tagsNuevos;
            }

            /* Descripcion */
            $descNueva = $metadataCorregida['descripcion_es'] ?? $metadataCorregida['descripcion'] ?? null;
            if ($descNueva && \is_string($descNueva)) {
                $setClauses[] = SamplesCols::DESCRIPCION . ' = :descripcion';
                $params['descripcion'] = \sanitize_textarea_field($descNueva);
                $cambios['descripcion'] = $descNueva;
            }

            $setClauses[] = SamplesCols::UPDATED_AT . " = NOW()";

            /* Ejecutar UPDATE */
            $tabla = SamplesCols::TABLA;
            $sql = "UPDATE {$tabla} SET " . \implode(', ', $setClauses) . " WHERE " . SamplesCols::ID . " = :id";
            SamplesRepository::ejecutar($sql, $params);

            KamplesLogger::info('[C800] Metadata IA corregida', [
                'sampleId' => $sampleId,
                'instrucciones' => \mb_substr($instrucciones, 0, 100),
                'campos' => \array_keys($cambios),
            ]);

            return new \WP_REST_Response([
                'ok' => true,
                'mensaje' => 'Metadata corregida correctamente',
                'cambios' => $cambios,
            ], 200);
        } catch (\Throwable $e) {
            KamplesLogger::error('SamplesModificacionController::corregirIA error', ['error' => $e->getMessage()]);
            return new \WP_REST_Response(['ok' => false, 'mensaje' => 'Error interno del servidor'], 500);
        }
    }
}
