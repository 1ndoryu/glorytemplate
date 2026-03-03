<?php

/**
 * SamplesUploadController — Subida de samples con pipeline async.
 *
 * Extraído de SamplesController (A04 SOLID split).
 *
 * Endpoints:
 *   POST /samples/upload — Subida con pipeline asíncrono
 *
 * @package Kamples
 */

namespace App\Kamples\Api\Controladores;

use App\Kamples\Auth\AuthMiddleware;
use App\Kamples\Api\Helpers\NormalizadorSample;
use App\Kamples\Api\Helpers\UsuarioHelper;
use App\Kamples\Api\Helpers\RateLimiter;
use App\Kamples\Api\GeneradorIdCorto;
use App\Kamples\Api\PipelineAudio;
use App\Kamples\KamplesLogger;
use App\Config\Schema\_generated\SamplesCols;
use App\Kamples\Database\Repositories\SamplesRepository;
use App\Kamples\Database\Repositories\PublicacionesRepository;
use App\Kamples\Database\Repositories\UsuariosExtRepository;

class SamplesUploadController
{
    private const FORMATOS_AUDIO_VALIDOS = [
        'audio/wav', 'audio/mpeg', 'audio/mp3', 'audio/flac',
        'audio/aiff', 'audio/x-wav', 'audio/x-aiff'
    ];
    private const MAX_TAMANO_AUDIO = 50 * 1024 * 1024;

    public static function registrarRutas(string $namespace): void
    {
        \register_rest_route($namespace, '/samples/upload', [
            'methods'             => 'POST',
            'callback'            => [self::class, 'subir'],
            'permission_callback' => [AuthMiddleware::class, 'requerirAuth'],
        ]);
    }

    /**
     * POST /samples/upload — Subida de audio con pipeline asíncrono.
     */
    public static function subir(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            $wpUserId = AuthMiddleware::obtenerWpUserId();

        /*
         * P5: Idempotencia — Si el cliente envía X-Idempotency-Key y ya procesamos
         * esa clave, retornar la respuesta anterior en vez de crear duplicado.
         * Usa transients de WP con TTL de 1 hora (suficiente para reintentos).
         */
        $idempotencyKey = $request->get_header('X-Idempotency-Key');
        if ($idempotencyKey) {
            $idempotencyKey = \substr(\preg_replace('/[^a-zA-Z0-9\-]/', '', $idempotencyKey), 0, 64);
            $cacheKey = 'idem_upload_' . $idempotencyKey;
            $cached = \get_transient($cacheKey);
            if ($cached && \is_array($cached)) {
                KamplesLogger::info('Upload idempotente: retornando resultado cacheado', [
                    'idempotencyKey' => $idempotencyKey,
                    'sampleId' => $cached['sample_id'] ?? null,
                ]);
                return new \WP_REST_Response($cached, 200);
            }
        }

        /* C164: Rate limit — 5000 uploads por hora (Alto para permitir Desktop Sync de librerías enteras) */
        $pgId = UsuarioHelper::obtenerIdPg();
        if ($pgId) {
            $limitResp = RateLimiter::verificarUsuario($pgId, 'subir_sample', 5000, 3600);
            if ($limitResp) return $limitResp;
        }

        $archivos = $request->get_file_params();

        if (empty($archivos['audio'])) {
            return new \WP_REST_Response(['ok' => false, 'error' => 'No se recibió archivo de audio'], 400);
        }

        $audio = $archivos['audio'];

        if (!\in_array($audio['type'], self::FORMATOS_AUDIO_VALIDOS, true)) {
            return new \WP_REST_Response([
                'ok' => false, 'error' => 'Formato de audio no válido. Formatos aceptados: WAV, MP3, FLAC, AIFF'
            ], 400);
        }

        /* S30 fix: Verificar contenido real del archivo con magic bytes */
        $finfo = new \finfo(FILEINFO_MIME_TYPE);
        $realMime = $finfo->file($audio['tmp_name']);
        if (!\in_array($realMime, self::FORMATOS_AUDIO_VALIDOS, true)) {
            return new \WP_REST_Response(['ok' => false, 'error' => 'El contenido del archivo no coincide con un formato de audio válido'], 400);
        }

        if ($audio['size'] > self::MAX_TAMANO_AUDIO) {
            return new \WP_REST_Response(['ok' => false, 'error' => 'El archivo excede el tamaño máximo de 50 MB'], 400);
        }

        if (!\function_exists('wp_handle_upload')) {
            require_once ABSPATH . 'wp-admin/includes/file.php';
        }

        $anio = \date('Y');
        $mes = \date('m');
        $subDir = "kamples/{$wpUserId}/{$anio}/{$mes}";
        $uploadDir = \wp_upload_dir();
        $directorioDestino = $uploadDir['basedir'] . '/' . $subDir;

        if (!\file_exists($directorioDestino)) {
            \wp_mkdir_p($directorioDestino);
        }

        $filtroDir = function ($paths) use ($subDir) {
            $paths['subdir'] = '/' . $subDir;
            $paths['path'] = $paths['basedir'] . '/' . $subDir;
            $paths['url'] = $paths['baseurl'] . '/' . $subDir;
            return $paths;
        };

        \add_filter('upload_dir', $filtroDir);

        $subido = \wp_handle_upload($audio, [
            'test_form' => false,
            'mimes'     => [
                'wav' => 'audio/wav', 'mp3' => 'audio/mpeg',
                'flac' => 'audio/flac', 'aiff' => 'audio/aiff',
            ],
        ]);

        \remove_filter('upload_dir', $filtroDir);

        if (isset($subido['error'])) {
            /* S28 fix: no exponer rutas del servidor al cliente */
            KamplesLogger::error('Error al subir archivo de audio', ['error' => $subido['error']]);
            return new \WP_REST_Response(['ok' => false, 'error' => 'Error al procesar el archivo de audio'], 500);
        }

        $titulo = \sanitize_text_field($request->get_param('titulo') ?? $audio['name']);
        $contenido = \sanitize_textarea_field($request->get_param('contenido') ?? '');
        $tagsRaw = $request->get_param('tags');
        $tags = \is_string($tagsRaw) ? \json_decode($tagsRaw, true) ?? [] : (array) ($tagsRaw ?? []);
        $permitirDescarga = \filter_var($request->get_param('permitir_descarga') ?? true, \FILTER_VALIDATE_BOOLEAN);
        $licenciaLibre = \filter_var($request->get_param('licencia_libre') ?? false, \FILTER_VALIDATE_BOOLEAN);
        $esPremium = \filter_var($request->get_param('es_premium') ?? false, \FILTER_VALIDATE_BOOLEAN);
        /* C220: Toggle de visibilidad en comunidad */
        $mostrarEnComunidad = \filter_var($request->get_param('mostrar_en_comunidad') ?? true, \FILTER_VALIDATE_BOOLEAN);
        $precio = $request->get_param('precio');
        $precio = $precio !== null ? (float) $precio : null;
        /* S31 fix: Validar rango de precio */
        if ($precio !== null && ($precio < 0 || $precio > 9999)) {
            return new \WP_REST_Response(['ok' => false, 'error' => 'Precio fuera de rango válido (0-9999)'], 400);
        }

        if (\count($tags) < 2) {
            return new \WP_REST_Response([
                'ok' => false,
                'error' => 'Se requieren al menos 2 tags para subir un sample. Agrega hashtags (#) en tu descripción.',
            ], 400);
        }

        $idCorto = GeneradorIdCorto::generar();
        $slug = \sanitize_title($titulo) . '-' . $idCorto;

        $userId = UsuarioHelper::obtenerIdPg();
        if (!$userId) {
            return UsuarioHelper::respuestaNoEncontrado();
        }

        $sampleId = null;
        /* Normalizar tags: sanitize → lowercase + trim + dedup → PG array.
         * Consistencia obligatoria con GeneradorEmbeddings (strtolower) y ConstructorSenales (LOWER SQL). */
        $tagsSanitizados = \array_map('\sanitize_text_field', $tags);
        $tagsNormalizados = NormalizadorSample::normalizarTags($tagsSanitizados);
        $tagsPostgres = NormalizadorSample::phpArrayToPg($tagsNormalizados);

        try {
            $sampleId = SamplesRepository::insertarSample([
                    'creadorId' => $userId, 'titulo' => $titulo, 'slug' => $slug,
                    'idCorto' => $idCorto, 'descripcion' => $contenido,
                    'formato' => \strtolower(\pathinfo($audio['name'], PATHINFO_EXTENSION)),
                    'tamano' => $audio['size'], 'rutaOriginal' => $subido['file'],
                    'tags' => $tagsPostgres,
                    'esPremium' => $esPremium ? 'true' : 'false',
                    'precio' => $precio,
                    'descarga' => $permitirDescarga ? 'true' : 'false',
                    'licencia' => $licenciaLibre ? 'true' : 'false',
                    'comunidad' => $mostrarEnComunidad ? 'true' : 'false',
            ]);
        } catch (\Exception $e) {
            KamplesLogger::error('Error al insertar sample en Postgres', ['error' => $e->getMessage()]);
            /* S22 fix: limpiar archivo huérfano y retornar error real */
            self::eliminarArchivoSiExiste($subido['file'], 'archivo huerfano de subida tras error de insercion');
            return new \WP_REST_Response(['ok' => false, 'error' => 'Error interno al registrar el sample'], 500);
        }

        /* Crear publicación automática en el feed si mostrarEnComunidad está activo */
        if ($sampleId && $mostrarEnComunidad) {
            try {
                $samplesAdjuntosPg = '{' . $sampleId . '}';
                PublicacionesRepository::crearPublicacion(
                    $userId,
                    $contenido,
                    '{}',
                    $samplesAdjuntosPg
                );
                KamplesLogger::info('Publicación de comunidad creada para sample', [
                    'sampleId' => $sampleId,
                    'userId' => $userId,
                ]);
            } catch (\Throwable $e) {
                KamplesLogger::error('No se pudo crear publicación de comunidad para sample', [
                    'sampleId' => $sampleId,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        /* C198: Sumar 1 crédito bonus por publicar sample */
        if ($sampleId) {
            try {
                UsuariosExtRepository::incrementarCreditosBonus($userId);
            } catch (\Exception $e) {
                KamplesLogger::warning('No se pudo sumar crédito bonus al publicar sample', ['error' => $e->getMessage()]);
            }
        }

        /* Pipeline asíncrono post-respuesta */
        if ($sampleId) {
            $datosPipeline = [
                'sampleId' => $sampleId, 'rutaArchivo' => $subido['file'],
                'nombreOriginal' => $audio['name'], 'idCorto' => $idCorto,
                'descripcion' => $contenido, 'tags' => $tags,
            ];

            \add_action('shutdown', function () use ($datosPipeline) {
                if (\function_exists('fastcgi_finish_request')) {
                    \fastcgi_finish_request();
                } else {
                    \ignore_user_abort(true);
                    if (\session_id()) \session_write_close();
                    if (!\headers_sent()) {
                        \header('Connection: close');
                    }
                    while (\ob_get_level() > 0) {
                        \ob_end_flush();
                    }
                    \flush();
                }

                if (\function_exists('set_time_limit') && !\set_time_limit(600)) {
                    KamplesLogger::warning('No se pudo ampliar set_time_limit para pipeline async', ['sampleId' => $datosPipeline['sampleId']]);
                }

                $resultadoMemoria = \ini_set('memory_limit', '256M');
                if ($resultadoMemoria === false) {
                    KamplesLogger::warning('No se pudo ajustar memory_limit para pipeline async', ['sampleId' => $datosPipeline['sampleId']]);
                }

                try {
                    PipelineAudio::procesar(
                        $datosPipeline['sampleId'], $datosPipeline['rutaArchivo'],
                        $datosPipeline['nombreOriginal'], $datosPipeline['idCorto'],
                        $datosPipeline['descripcion'], $datosPipeline['tags']
                    );
                } catch (\Throwable $e) {
                    KamplesLogger::error('Pipeline async error', [
                        'sampleId' => $datosPipeline['sampleId'],
                        'error' => $e->getMessage(),
                    ]);
                }
            }, 0);
        }

        $respuestaExitosa = [
            'ok' => true, 'sample_id' => $sampleId, 'id_corto' => $idCorto,
            'slug' => $slug, 'url' => $subido['url'], 'estado' => 'procesando',
        ];

        /* P5: Cachear resultado para idempotencia (TTL 1 hora) */
        if (isset($cacheKey)) {
            \set_transient($cacheKey, $respuestaExitosa, 3600);
        }

        return new \WP_REST_Response($respuestaExitosa, 201);
        } catch (\Throwable $e) {
            KamplesLogger::error('[SamplesUploadController::subir] Error no capturado', ['error' => $e->getMessage()]);
            return new \WP_REST_Response(['ok' => false, 'error' => 'Error interno al procesar la subida'], 500);
        }
    }

    private static function eliminarArchivoSiExiste(string $ruta, string $contexto): void
    {
        if (!$ruta || !\file_exists($ruta)) {
            return;
        }

        try {
            if (!\unlink($ruta)) {
                KamplesLogger::warning('No se pudo eliminar archivo en SamplesUploadController', [
                    'ruta' => $ruta,
                    'contexto' => $contexto,
                ]);
            }
        } catch (\Throwable $e) {
            KamplesLogger::warning('Error eliminando archivo en SamplesUploadController', [
                'ruta' => $ruta,
                'contexto' => $contexto,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
