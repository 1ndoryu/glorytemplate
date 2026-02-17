<?php

/**
 * ComentariosController — Endpoints genéricos de comentarios.
 *
 * Maneja comentarios para cualquier tipo de entidad (sample, publicacion).
 *
 * GET  /comentarios/{tipo}/{targetId}  — Listar comentarios
 * POST /comentarios/{tipo}/{targetId}  — Crear comentario
 *
 * @package Kamples
 */

namespace App\Kamples\Api\Controladores;

use App\Kamples\Database\PostgresService;
use App\Kamples\Auth\AuthMiddleware;
use App\Kamples\Api\Helpers\UsuarioHelper;
use App\Kamples\Api\Helpers\RateLimiter;
use App\Kamples\Api\Helpers\Validador;
use App\Kamples\Services\PlanificadorAlgoritmo;
use App\Kamples\Services\ServicioAntiSpam;
use App\Kamples\Services\ServicioBan;
use App\Kamples\Api\ServicioModeracionIA;
use App\Kamples\LogIA as KamplesLogger;

class ComentariosController
{
    private const TIPOS_VALIDOS = ['sample', 'publicacion'];

    public static function registrarRutas(string $namespace): void
    {
        register_rest_route($namespace, '/comentarios/(?P<tipo>sample|publicacion)/(?P<targetId>\d+)', [
            'methods' => 'GET',
            'callback' => [self::class, 'listar'],
            'permission_callback' => '__return_true',
            'args' => [
                'page' => ['required' => false, 'type' => 'integer', 'default' => 1],
            ],
        ]);

        register_rest_route($namespace, '/comentarios/(?P<tipo>sample|publicacion)/(?P<targetId>\d+)', [
            'methods' => 'POST',
            'callback' => [self::class, 'crear'],
            'permission_callback' => [AuthMiddleware::class, 'requerirAuth'],
        ]);
    }

    public static function listar(\WP_REST_Request $request): \WP_REST_Response
    {
        $tipo = $request->get_param('tipo');
        $targetId = (int) $request->get_param('targetId');
        $page = (int) $request->get_param('page');
        $offset = ($page - 1) * 20;

        if (!in_array($tipo, self::TIPOS_VALIDOS, true)) {
            return new \WP_REST_Response(['code' => 'tipo_invalido'], 400);
        }

        /*
         * C131: Filtrar rechazados por moderación.
         * Comentarios 'pendiente' se muestran normalmente (fail-open).
         * Solo se ocultan los explícitamente rechazados.
         */
        $comentarios = PostgresService::consultar(
            "SELECT c.id, c.contenido, c.created_at,
                    c.tipo_contenido, c.media_url, c.media_metadata,
                    c.moderacion_estado,
                    u.id as autor_id, u.username, u.nombre_visible, u.avatar_url, u.wp_user_id
             FROM comentarios c
             JOIN usuarios_ext u ON c.autor_id = u.id
             WHERE c.tipo = :tipo AND c.target_id = :targetId
               AND (c.moderacion_estado IS NULL OR c.moderacion_estado != 'rechazado')
             ORDER BY c.created_at ASC LIMIT 20 OFFSET :offset",
            ['tipo' => $tipo, 'targetId' => $targetId, 'offset' => $offset]
        );

        /* Enriquecer con formato camelCase para el frontend */
        foreach ($comentarios as &$c) {
            $c['autorId'] = (int) $c['autor_id'];
            $c['creadoAt'] = $c['created_at'];
            $c['tipoContenido'] = $c['tipo_contenido'] ?? 'texto';
            $c['mediaUrl'] = $c['media_url'] ?? null;
            $c['mediaMetadata'] = $c['media_metadata'] ? json_decode($c['media_metadata'], true) : null;
            $c['autor'] = [
                'id' => (int) $c['autor_id'],
                'username' => $c['username'],
                'nombreVisible' => $c['nombre_visible'],
                'avatarUrl' => UsuarioHelper::resolverAvatarUrl($c['avatar_url'] ?? null, (int) ($c['wp_user_id'] ?? 0)),
            ];
        }

        return new \WP_REST_Response(['data' => $comentarios, 'page' => $page], 200);
    }

    public static function crear(\WP_REST_Request $request): \WP_REST_Response
    {
        $userId = UsuarioHelper::obtenerIdPg();
        if (!$userId) return UsuarioHelper::respuestaNoEncontrado();

        $tipo = $request->get_param('tipo');
        $targetId = (int) $request->get_param('targetId');

        if (!in_array($tipo, self::TIPOS_VALIDOS, true)) {
            return new \WP_REST_Response(['code' => 'tipo_invalido'], 400);
        }

        /* C130: Soporta JSON (texto) o FormData (multimedia) */
        $contentType = $request->get_content_type();
        $esFormData = $contentType && str_contains($contentType['value'] ?? '', 'multipart');

        if ($esFormData) {
            $contenido = sanitize_textarea_field($request->get_param('contenido') ?? '');
            $tipoContenido = sanitize_text_field($request->get_param('tipoContenido') ?? 'texto');
        } else {
            $body = $request->get_json_params();
            $contenido = sanitize_textarea_field($body['contenido'] ?? '');
            $tipoContenido = 'texto';
        }

        /* Validar tipo de contenido */
        $tiposContenidoPermitidos = ['texto', 'imagen', 'audio'];
        if (!in_array($tipoContenido, $tiposContenidoPermitidos, true)) {
            $tipoContenido = 'texto';
        }

        /* C164: Rate limiting — 10 comentarios por minuto */
        $limitResp = RateLimiter::verificarUsuario($userId, 'comentar', 10, 60);
        if ($limitResp) return $limitResp;

        /* Validar contenido: requerido para texto, opcional para multimedia */
        if ($tipoContenido === 'texto') {
            if (empty($contenido)) {
                return new \WP_REST_Response(['code' => 'contenido_vacio', 'message' => 'El comentario necesita contenido'], 400);
            }
        }

        /* C164: Limite de longitud (aplica si hay texto) */
        if (!empty($contenido)) {
            $errorLongitud = Validador::validarLongitud($contenido, Validador::MAX_COMENTARIO, 'El comentario');
            if ($errorLongitud) {
                return Validador::respuestaError($errorLongitud);
            }
        }

        /* C131: Anti-spam heurístico — se evalúa ANTES del INSERT para rechazar inmediatamente */
        if (!empty($contenido)) {
            $razonSpam = ServicioAntiSpam::evaluar($contenido, $userId);
            if ($razonSpam) {
                ServicioBan::registrarViolacion($userId, $razonSpam, 'comentario');
                return new \WP_REST_Response(['code' => 'contenido_spam', 'message' => 'El comentario fue rechazado por spam'], 403);
            }
        }

        /* C132: Verificar si el usuario está baneado */
        $banResp = AuthMiddleware::verificarBanActivo($userId);
        if ($banResp) return $banResp;

        $mediaUrl = null;
        $mediaMetadata = null;

        /* C130: Procesamiento de archivos multimedia */
        if ($tipoContenido === 'imagen' || $tipoContenido === 'audio') {
            $archivos = $request->get_file_params();
            $archivo = $archivos['media'] ?? null;

            if (!$archivo || $archivo['error'] !== UPLOAD_ERR_OK) {
                return new \WP_REST_Response(['code' => 'archivo_invalido', 'message' => 'No se recibió archivo válido'], 400);
            }

            /* Validar MIME segun tipo — incluir variantes x- que mime_content_type() devuelve */
            $mimesPermitidos = $tipoContenido === 'imagen'
                ? ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
                : [
                    'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav',
                    'audio/ogg', 'application/ogg', 'audio/mp4', 'audio/x-m4a',
                    'audio/aac', 'audio/webm', 'audio/flac',
                ];

            $mimeReal = \mime_content_type($archivo['tmp_name']);
            if (!in_array($mimeReal, $mimesPermitidos, true)) {
                return new \WP_REST_Response(['code' => 'tipo_no_permitido', 'message' => "Tipo de archivo no permitido: {$mimeReal}"], 400);
            }

            /* Limite de tamano: 10MB imagenes, 25MB audio */
            $maxBytes = $tipoContenido === 'imagen' ? 10 * 1024 * 1024 : 25 * 1024 * 1024;
            if ($archivo['size'] > $maxBytes) {
                $maxMB = $maxBytes / 1024 / 1024;
                return new \WP_REST_Response(['code' => 'archivo_grande', 'message' => "El archivo excede el limite de {$maxMB}MB"], 400);
            }

            /* Subir a WP uploads en subcarpeta comentarios */
            $subDir = "kamples/comentarios/{$userId}/" . date('Y/m');
            $filtroDir = function ($paths) use ($subDir) {
                $paths['subdir'] = '/' . $subDir;
                $paths['path'] = $paths['basedir'] . '/' . $subDir;
                $paths['url'] = $paths['baseurl'] . '/' . $subDir;
                return $paths;
            };

            /* wp_handle_upload no está disponible en contexto REST (solo en admin) */
            if (!function_exists('wp_handle_upload')) {
                require_once ABSPATH . 'wp-admin/includes/file.php';
            }

            \add_filter('upload_dir', $filtroDir);
            $mimesUpload = $tipoContenido === 'audio'
                ? [
                    'mp3' => 'audio/mpeg', 'wav' => 'audio/wav', 'ogg' => 'audio/ogg',
                    'm4a' => 'audio/mp4', 'aac' => 'audio/aac', 'webm' => 'audio/webm',
                    'flac' => 'audio/flac',
                ]
                : [
                    'jpg|jpeg' => 'image/jpeg', 'png' => 'image/png',
                    'gif' => 'image/gif', 'webp' => 'image/webp',
                ];
            $subido = \wp_handle_upload($archivo, ['test_form' => false, 'mimes' => $mimesUpload]);
            \remove_filter('upload_dir', $filtroDir);

            if (isset($subido['error'])) {
                return new \WP_REST_Response(['code' => 'error_subida', 'message' => $subido['error']], 500);
            }

            $mediaUrl = $subido['url'];
            $mediaMetadata = json_encode([
                'formato' => pathinfo($archivo['name'], PATHINFO_EXTENSION),
                'tamano'  => $archivo['size'],
                'mimeType' => $mimeReal,
            ]);

            /*
             * C201: Convertir audio de comentarios a MP3 ligero (128kbps, mono, 44100Hz).
             * Los audios en comentarios deben ser livianos para carga rápida.
             * Genera waveform JSON para renderizado en frontend.
             */
            if ($tipoContenido === 'audio') {
                $rutaOriginal = $subido['file'];
                $extension = strtolower(pathinfo($rutaOriginal, PATHINFO_EXTENSION));

                /* Solo convertir si no es ya MP3 */
                if ($extension !== 'mp3') {
                    $rutaMp3 = preg_replace('/\.[^.]+$/', '.mp3', $rutaOriginal);
                    $convertido = self::convertirAudioComentario($rutaOriginal, $rutaMp3);
                    if ($convertido && file_exists($rutaMp3)) {
                        /* Borrar el original y usar el MP3 */
                        @unlink($rutaOriginal);
                        $mediaUrl = preg_replace('/\.[^.]+$/', '.mp3', $subido['url']);
                        $mediaMetadata = json_encode([
                            'formato' => 'mp3',
                            'tamano'  => filesize($rutaMp3),
                            'mimeType' => 'audio/mpeg',
                        ]);
                    }
                }

                /* Generar waveform JSON para el audio del comentario */
                $rutaAudioFinal = $extension !== 'mp3' && isset($rutaMp3) && file_exists($rutaMp3) ? $rutaMp3 : $rutaOriginal;
                $rutaWaveform = preg_replace('/\.[^.]+$/', '_waveform.json', $rutaAudioFinal);
                $picos = self::generarWaveformComentario($rutaAudioFinal, $rutaWaveform);

                if ($picos) {
                    $meta = json_decode($mediaMetadata, true);
                    $meta['waveformUrl'] = preg_replace('/\.[^.]+$/', '_waveform.json', $mediaUrl);
                    $meta['picos'] = $picos;
                    $mediaMetadata = json_encode($meta);
                }
            }

            /* Si no hay texto, la imagen/audio es el comentario completo */
            if (empty($contenido)) {
                $contenido = null;
            }
        }

        $id = PostgresService::insertar(
            "INSERT INTO comentarios (autor_id, tipo, target_id, contenido, tipo_contenido, media_url, media_metadata)
             VALUES (:autor, :tipo, :target, :contenido, :tipoContenido, :mediaUrl, :mediaMetadata::jsonb)
             RETURNING id",
            [
                'autor' => $userId,
                'tipo' => $tipo,
                'target' => $targetId,
                'contenido' => $contenido,
                'tipoContenido' => $tipoContenido,
                'mediaUrl' => $mediaUrl,
                'mediaMetadata' => $mediaMetadata,
            ]
        );

        /* Actualizar contador en la tabla correspondiente */
        $tabla = $tipo === 'publicacion' ? 'publicaciones' : 'samples';
        PostgresService::ejecutar(
            "UPDATE {$tabla} SET total_comentarios = (
                SELECT COUNT(*) FROM comentarios WHERE tipo = :tipo AND target_id = :targetId
            ) WHERE id = :targetId",
            ['tipo' => $tipo, 'targetId' => $targetId]
        );

        /* Registrar interaccion para el algoritmo */
        PlanificadorAlgoritmo::registrarInteraccion($userId, 'comentario');

        /*
         * C131: Moderación IA asíncrona post-INSERT.
         * Se ejecuta después de enviar la respuesta al cliente (fail-open).
         * El comentario se muestra inmediatamente; si IA lo rechaza, desaparece.
         */
        $comentarioIdMod = $id;
        $textoMod = $contenido ?? '';
        $mediaUrlMod = $mediaUrl;
        $tipoContenidoMod = $tipoContenido;
        $autorIdMod = $userId;

        register_shutdown_function(function () use ($comentarioIdMod, $autorIdMod, $textoMod, $mediaUrlMod, $tipoContenidoMod) {
            try {
                ServicioModeracionIA::moderarComentario(
                    $comentarioIdMod,
                    $autorIdMod,
                    $textoMod,
                    $mediaUrlMod,
                    $tipoContenidoMod
                );
            } catch (\Throwable $e) {
                /* Moderación fail-open pero con logging para detectar fallos recurrentes */
                KamplesLogger::warning('Moderación async de comentario falló', [
                    'comentarioId' => $comentarioIdMod,
                    'error' => $e->getMessage(),
                ]);
            }
        });

        /* Obtener datos del autor para devolver el comentario completo */
        $usuario = PostgresService::consultarUno(
            "SELECT id, username, nombre_visible, avatar_url, wp_user_id FROM usuarios_ext WHERE id = :id",
            ['id' => $userId]
        );

        return new \WP_REST_Response([
            'ok' => true,
            'data' => [
                'id' => $id,
                'autorId' => $userId,
                'contenido' => $contenido ?? '',
                'tipoContenido' => $tipoContenido,
                'mediaUrl' => $mediaUrl,
                'mediaMetadata' => $mediaMetadata ? json_decode($mediaMetadata, true) : null,
                'creadoAt' => date('c'),
                'autor' => [
                    'id' => $userId,
                    'username' => $usuario['username'] ?? '',
                    'nombreVisible' => $usuario['nombre_visible'] ?? '',
                    'avatarUrl' => UsuarioHelper::resolverAvatarUrl(
                        $usuario['avatar_url'] ?? null,
                        (int) ($usuario['wp_user_id'] ?? 0)
                    ),
                ],
            ],
        ], 201);
    }

    /*
     * C201: Convierte audio de comentario a MP3 ligero (128kbps, mono, 44100Hz).
     * Reutiliza la detección de FFmpeg de PipelineAudio vía .env o PATH.
     */
    private static function convertirAudioComentario(string $entrada, string $salida): bool
    {
        $ffmpeg = self::obtenerFFmpegBin();
        if (!$ffmpeg) {
            KamplesLogger::warning('ComentariosController: FFmpeg no disponible para conversion de audio');
            return false;
        }

        $cmd = sprintf(
            '%s -y -i %s -codec:a libmp3lame -b:a 128k -ac 1 -ar 44100 %s 2>&1',
            escapeshellarg($ffmpeg),
            escapeshellarg($entrada),
            escapeshellarg($salida)
        );

        exec($cmd, $output, $returnCode);
        return $returnCode === 0 && file_exists($salida);
    }

    /*
     * C201: Genera peaks waveform (60 barras) para audio de comentario.
     * Similar a PipelineAudio pero con menos resolución (audio corto).
     */
    private static function generarWaveformComentario(string $rutaAudio, string $rutaSalida): ?array
    {
        $ffmpeg = self::obtenerFFmpegBin();
        if (!$ffmpeg) return null;

        $barras = 60;

        /* Decodificar audio a PCM raw con FFmpeg */
        $tmpPcm = sys_get_temp_dir() . '/kamples_comment_pcm_' . uniqid() . '.raw';
        $cmd = sprintf(
            '%s -y -i %s -f f32le -acodec pcm_f32le -ac 1 -ar 8000 %s 2>&1',
            escapeshellarg($ffmpeg),
            escapeshellarg($rutaAudio),
            escapeshellarg($tmpPcm)
        );

        exec($cmd, $output, $returnCode);
        if ($returnCode !== 0 || !file_exists($tmpPcm)) {
            @unlink($tmpPcm);
            return null;
        }

        $raw = file_get_contents($tmpPcm);
        @unlink($tmpPcm);

        if (!$raw || strlen($raw) < 4) return null;

        $samples = unpack('f*', $raw);
        if (!$samples) return null;

        $total = count($samples);
        $porBarra = max(1, (int) floor($total / $barras));
        $picos = [];

        for ($i = 0; $i < $barras; $i++) {
            $inicio = $i * $porBarra + 1;
            $max = 0;
            for ($j = 0; $j < $porBarra; $j++) {
                $idx = $inicio + $j;
                if (isset($samples[$idx])) {
                    $val = abs($samples[$idx]);
                    if ($val > $max) $max = $val;
                }
            }
            $picos[] = round($max, 4);
        }

        /* Normalizar entre 0 y 1 */
        $maximo = max($picos) ?: 1;
        $picos = array_map(fn($p) => round(max(0.03, $p / $maximo), 3), $picos);

        /* Guardar como JSON */
        file_put_contents($rutaSalida, json_encode($picos));

        return $picos;
    }

    /*
     * Obtiene la ruta al binario FFmpeg (desde .env o PATH).
     */
    private static function obtenerFFmpegBin(): ?string
    {
        /* Intentar desde .env */
        $envPath = defined('FFMPEG_PATH') ? FFMPEG_PATH : (\getenv('FFMPEG_PATH') ?: null);
        if ($envPath && is_executable($envPath)) return $envPath;

        /* Intentar desde PATH del sistema */
        $esWindows = strtoupper(substr(PHP_OS, 0, 3)) === 'WIN';
        $cmd = $esWindows ? 'where ffmpeg 2>nul' : 'which ffmpeg 2>/dev/null';
        $resultado = trim(shell_exec($cmd) ?? '');

        if ($resultado) {
            $lineas = explode("\n", $resultado);
            $ruta = trim($lineas[0]);
            if (is_executable($ruta)) return $ruta;
        }

        return null;
    }
}
