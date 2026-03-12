<?php

/**
 * ComentariosInteraccionController — Likes y procesamiento multimedia de comentarios.
 *
 * Extraído de ComentariosController (A11 SOLID split).
 *
 * Métodos públicos:
 *   darLike()         — POST /comentarios/{id}/like
 *   quitarLike()      — DELETE /comentarios/{id}/like
 *   procesarMedia()   — Subida, validación y conversión de multimedia (usado por crear)
 *
 * @package Kamples
 */

namespace App\Kamples\Api\Controladores;

use App\Kamples\Api\Helpers\UsuarioHelper;
use App\Kamples\Api\FFmpegDetector;
use App\Kamples\Services\ServicioNotificaciones;
use App\Kamples\LogModeracion as KamplesLogger;
use App\Config\Schema\_generated\ComentariosCols;
use App\Config\Schema\_generated\ComentariosEnums;
use App\Kamples\Database\Repositories\ComentariosRepository;
use App\Kamples\Database\Repositories\LikesRepository;
use App\Kamples\KamplesLogger as LogGeneral;

class ComentariosInteraccionController
{
    /* C265: Dar like a un comentario */
    public static function darLike(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
        $userId = UsuarioHelper::obtenerIdPg();
        if (!$userId) return UsuarioHelper::respuestaNoEncontrado();

        $id = (int) $request->get_param('id');

        $existe = ComentariosRepository::existe([ComentariosCols::ID => $id]);
        if (!$existe) return new \WP_REST_Response(['code' => 'no_encontrado'], 404);

        LikesRepository::darLikeComentario($userId, $id);

        $totalLikes = LikesRepository::recalcularTotalComentario($id);

        /* C266: Notificacion de like en comentario */
        $autorId = ComentariosRepository::buscarAutorId($id);
        /* O17 fix: no autonotificar likes propios */
        if ($autorId && $autorId !== $userId) {
            ServicioNotificaciones::likeComentario($autorId, $userId, $id);
        }

        return new \WP_REST_Response(['data' => ['totalLikes' => $totalLikes, 'liked' => true]], 200);
        } catch (\Throwable $e) {
            LogGeneral::error('ComentariosInteraccionController::darLike error', ['error' => $e->getMessage()]);
            return new \WP_REST_Response(['code' => 'error_interno', 'message' => 'Error interno del servidor'], 500);
        }
    }

    /* C265: Quitar like de un comentario */
    public static function quitarLike(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
        $userId = UsuarioHelper::obtenerIdPg();
        if (!$userId) return UsuarioHelper::respuestaNoEncontrado();

        $id = (int) $request->get_param('id');

        /* S42 fix: verificar que el comentario existe antes de operar */
        $existe = ComentariosRepository::existe([ComentariosCols::ID => $id]);
        if (!$existe) return new \WP_REST_Response(['code' => 'no_encontrado'], 404);

        LikesRepository::quitarLikeComentario($userId, $id);

        $totalLikes = LikesRepository::recalcularTotalComentario($id);

        return new \WP_REST_Response(['data' => ['totalLikes' => $totalLikes, 'liked' => false]], 200);
        } catch (\Throwable $e) {
            LogGeneral::error('ComentariosInteraccionController::quitarLike error', ['error' => $e->getMessage()]);
            return new \WP_REST_Response(['code' => 'error_interno', 'message' => 'Error interno del servidor'], 500);
        }
    }

    /**
     * Procesa subida multimedia para comentarios (imagen o audio).
     * Extraído de ComentariosController::crear().
     *
     * @return array{0: string|null, 1: string|null, 2: string|null}|\WP_REST_Response
     *   En éxito: [$mediaUrl, $mediaMetadata, $contenido].
     *   En error: WP_REST_Response con código de error.
     */
    public static function procesarMedia(
        \WP_REST_Request $request,
        string $tipoContenido,
        int $userId,
        ?string $contenido
    ): array|\WP_REST_Response {
        try {
        $archivos = $request->get_file_params();
        $archivo = $archivos['media'] ?? null;

        if (!$archivo || $archivo['error'] !== UPLOAD_ERR_OK) {
            return new \WP_REST_Response(['code' => 'archivo_invalido', 'message' => 'No se recibió archivo válido'], 400);
        }

        /* Validar MIME según tipo */
        $mimesPermitidos = $tipoContenido === ComentariosEnums::TIPO_CONTENIDO_IMAGEN
            ? ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
            : [
                'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav',
                'audio/ogg', 'application/ogg', 'audio/mp4', 'audio/x-m4a',
                'audio/aac', 'audio/webm', 'audio/flac',
            ];

        $mimeReal = \mime_content_type($archivo['tmp_name']);
        if (!\in_array($mimeReal, $mimesPermitidos, true)) {
            return new \WP_REST_Response(['code' => 'tipo_no_permitido', 'message' => "Tipo de archivo no permitido: {$mimeReal}"], 400);
        }

        /* Limite de tamano: 10MB imagenes, 25MB audio */
        $maxBytes = $tipoContenido === ComentariosEnums::TIPO_CONTENIDO_IMAGEN ? 10 * 1024 * 1024 : 25 * 1024 * 1024;
        if ($archivo['size'] > $maxBytes) {
            $maxMB = $maxBytes / 1024 / 1024;
            return new \WP_REST_Response(['code' => 'archivo_grande', 'message' => "El archivo excede el limite de {$maxMB}MB"], 400);
        }

        /* Subir a WP uploads en subcarpeta comentarios */
        $subDir = "kamples/comentarios/{$userId}/" . \date('Y/m');
        $filtroDir = function ($paths) use ($subDir) {
            $paths['subdir'] = '/' . $subDir;
            $paths['path'] = $paths['basedir'] . '/' . $subDir;
            $paths['url'] = $paths['baseurl'] . '/' . $subDir;
            return $paths;
        };

        if (!\function_exists('wp_handle_upload')) {
            require_once ABSPATH . 'wp-admin/includes/file.php';
        }

        \add_filter('upload_dir', $filtroDir);
        $mimesUpload = $tipoContenido === ComentariosEnums::TIPO_CONTENIDO_AUDIO
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
        $mediaMetadata = \json_encode([
            'formato' => \pathinfo($archivo['name'], PATHINFO_EXTENSION),
            'tamano'  => $archivo['size'],
            'mimeType' => $mimeReal,
        ]);

        /* C201: Convertir audio a MP3 ligero + generar waveform */
        if ($tipoContenido === ComentariosEnums::TIPO_CONTENIDO_AUDIO) {
            $rutaOriginal = $subido['file'];
            $extension = \strtolower(\pathinfo($rutaOriginal, PATHINFO_EXTENSION));

            if ($extension !== 'mp3') {
                $rutaMp3 = \preg_replace('/\.[^.]+$/', '.mp3', $rutaOriginal);
                $convertido = self::convertirAudioComentario($rutaOriginal, $rutaMp3);
                if ($convertido && \file_exists($rutaMp3)) {
                    self::eliminarArchivoSiExiste($rutaOriginal, 'audio original tras conversion a mp3');
                    $mediaUrl = \preg_replace('/\.[^.]+$/', '.mp3', $subido['url']);
                    $mediaMetadata = \json_encode([
                        'formato' => 'mp3',
                        'tamano'  => \filesize($rutaMp3),
                        'mimeType' => 'audio/mpeg',
                    ]);
                }
            }

            $rutaAudioFinal = ($extension !== 'mp3' && isset($rutaMp3) && \file_exists($rutaMp3)) ? $rutaMp3 : $rutaOriginal;
            $rutaWaveform = \preg_replace('/\.[^.]+$/', '_waveform.json', $rutaAudioFinal);
            $picos = self::generarWaveformComentario($rutaAudioFinal, $rutaWaveform);

            if ($picos) {
                $meta = \json_decode($mediaMetadata, true) ?? [];
                $meta['waveformUrl'] = \preg_replace('/\.[^.]+$/', '_waveform.json', $mediaUrl);
                $meta['picos'] = $picos;
                $mediaMetadata = \json_encode($meta);
            }
        }

        /* Si no hay texto, imagen/audio es el comentario completo */
        if (empty($contenido)) {
            $contenido = null;
        }

        return [$mediaUrl, $mediaMetadata, $contenido];
        } catch (\Throwable $e) {
            LogGeneral::error('ComentariosInteraccionController::procesarMedia error', ['error' => $e->getMessage()]);
            return new \WP_REST_Response(['code' => 'error_interno', 'message' => 'Error procesando media'], 500);
        }
    }

    /* C201: Convierte audio de comentario a MP3 ligero (128kbps, mono, 44100Hz) */
    private static function convertirAudioComentario(string $entrada, string $salida): bool
    {
        $ffmpeg = self::obtenerFFmpegBin();
        if (!$ffmpeg) {
            KamplesLogger::warning('ComentariosController: FFmpeg no disponible para conversion de audio');
            return false;
        }

        try {
            $cmd = \sprintf(
                '%s -y -i %s -codec:a libmp3lame -b:a 128k -ac 1 -ar 44100 %s 2>&1',
                \escapeshellarg($ffmpeg),
                \escapeshellarg($entrada),
                \escapeshellarg($salida)
            );

            \exec($cmd, $output, $returnCode);
            return $returnCode === 0 && \file_exists($salida);
        } catch (\Throwable $e) {
            KamplesLogger::error('ComentariosController: error convirtiendo audio', ['error' => $e->getMessage()]);
            return false;
        }
    }

    /* C201: Genera peaks waveform (60 barras) para audio de comentario */
    private static function generarWaveformComentario(string $rutaAudio, string $rutaSalida): ?array
    {
        $ffmpeg = self::obtenerFFmpegBin();
        if (!$ffmpeg) return null;

        $barras = 60;

        /* O18 fix: usar random_bytes en vez de uniqid predecible */
        $tmpPcm = \sys_get_temp_dir() . '/kamples_comment_pcm_' . \bin2hex(\random_bytes(8)) . '.raw';

        try {
            $cmd = \sprintf(
                '%s -y -i %s -f f32le -acodec pcm_f32le -ac 1 -ar 8000 %s 2>&1',
                \escapeshellarg($ffmpeg),
                \escapeshellarg($rutaAudio),
                \escapeshellarg($tmpPcm)
            );

            \exec($cmd, $output, $returnCode);
            if ($returnCode !== 0 || !\file_exists($tmpPcm)) {
                return null;
            }

            $raw = \file_get_contents($tmpPcm);

            if (!$raw || \strlen($raw) < 4) return null;

            $samples = \unpack('f*', $raw);
            if (!$samples) return null;

            $total = \count($samples);
            $porBarra = \max(1, (int) \floor($total / $barras));
            $picos = [];

            for ($i = 0; $i < $barras; $i++) {
                $inicio = $i * $porBarra + 1;
                $max = 0;
                for ($j = 0; $j < $porBarra; $j++) {
                    $idx = $inicio + $j;
                    if (isset($samples[$idx])) {
                        $val = \abs($samples[$idx]);
                        if ($val > $max) $max = $val;
                    }
                }
                $picos[] = \round($max, 4);
            }

            /* Normalizar entre 0 y 1 */
            $maximo = \max($picos) ?: 1;
            $picos = \array_map(fn($p) => \round(\max(0.03, $p / $maximo), 3), $picos);

            \file_put_contents($rutaSalida, \json_encode($picos));

            return $picos;
        } catch (\Throwable $e) {
            KamplesLogger::error('ComentariosController: error generando waveform', ['error' => $e->getMessage()]);
            return null;
        } finally {
            if (\file_exists($tmpPcm)) {
                \unlink($tmpPcm);
            }
        }
    }

    /* Delegado a FFmpegDetector (centralizado, cross-platform) */
    private static function obtenerFFmpegBin(): ?string
    {
        return FFmpegDetector::obtenerFFmpeg();
    }

    private static function eliminarArchivoSiExiste(string $ruta, string $contexto): void
    {
        if (!\file_exists($ruta)) {
            return;
        }

        try {
            if (!\unlink($ruta)) {
                KamplesLogger::warning('No se pudo eliminar archivo multimedia de comentario', [
                    'ruta' => $ruta,
                    'contexto' => $contexto,
                ]);
            }
        } catch (\Throwable $e) {
            KamplesLogger::warning('Error eliminando archivo multimedia de comentario', [
                'ruta' => $ruta,
                'contexto' => $contexto,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
