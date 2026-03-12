<?php

/**
 * MensajesEnvioController — Envío de mensajes directos (texto, imagen, audio, sample).
 * Extraído de MensajesController para cumplir límite de 300 líneas (SRP).
 *
 * @package Kamples
 */

namespace App\Kamples\Api\Controladores;

use App\Kamples\Auth\AuthMiddleware;
use App\Kamples\Api\Helpers\UsuarioHelper;
use App\Kamples\Api\Helpers\RateLimiter;
use App\Kamples\Api\Helpers\Validador;
use App\Config\Schema\_generated\SamplesCols;
use App\Config\Schema\_generated\ConversacionesCols;
use App\Config\Schema\_generated\MensajesEnums;
use App\Kamples\Database\Repositories\ConversacionesRepository;
use App\Kamples\Database\Repositories\MensajesRepository;
use App\Kamples\Database\Repositories\SamplesRepository;
use App\Kamples\Database\Repositories\BloqueosRepository;
use App\Kamples\Services\ServicioAntiSpam;
use App\Kamples\KamplesLogger;

class MensajesEnvioController
{
    public static function enviarMensaje(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            $userId = UsuarioHelper::obtenerIdPg();
            if (!$userId) return UsuarioHelper::respuestaNoEncontrado();

            $conversacionId = (int) $request->get_param('conversacionId');

            /* Soporta JSON body para texto o FormData para multimedia */
            $contentType = $request->get_content_type();
            $esFormData = $contentType && str_contains($contentType['value'] ?? '', 'multipart');

            if ($esFormData) {
                $contenido = \sanitize_textarea_field($request->get_param('contenido') ?? '');
                $tipo = \sanitize_text_field($request->get_param('tipo') ?? MensajesEnums::TIPO_TEXTO);
            } else {
                $body = $request->get_json_params();
                $contenido = \sanitize_textarea_field($body['contenido'] ?? '');
                $tipo = \sanitize_text_field($body['tipo'] ?? MensajesEnums::TIPO_TEXTO);
            }

            /* Validar tipos permitidos */
            $tiposPermitidos = [
                MensajesEnums::TIPO_TEXTO,
                MensajesEnums::TIPO_IMAGEN,
                MensajesEnums::TIPO_AUDIO,
                MensajesEnums::TIPO_SAMPLE,
            ];
            if (!in_array($tipo, $tiposPermitidos, true)) {
                $tipo = MensajesEnums::TIPO_TEXTO;
            }

            /* C164: Rate limiting — 30 mensajes por minuto */
            $limitResp = RateLimiter::verificarUsuario($userId, 'mensaje', 30, 60);
            if ($limitResp) return $limitResp;

            /* QQ71: Verificar ban + suspensión */
            $cuentaResp = AuthMiddleware::verificarCuentaActiva($userId);
            if ($cuentaResp) return $cuentaResp;

            /* C164: Limite de longitud para mensajes de texto */
            if ($tipo === MensajesEnums::TIPO_TEXTO && !empty($contenido)) {
                $errorLongitud = Validador::validarLongitud($contenido, Validador::MAX_MENSAJE, 'El mensaje');
                if ($errorLongitud) return Validador::respuestaError($errorLongitud);

                /* QQ52: Anti-spam heurístico en mensajes de texto */
                $spamRazon = ServicioAntiSpam::evaluarTexto($contenido);
                if ($spamRazon !== null) {
                    return new \WP_REST_Response([
                        'code' => 'mensaje_spam',
                        'message' => $spamRazon,
                    ], 422);
                }
            }

            $mediaUrl = null;
            $mediaMetadata = null;

            /* Procesamiento según tipo de mensaje */
            if ($tipo === MensajesEnums::TIPO_IMAGEN || $tipo === MensajesEnums::TIPO_AUDIO) {
                $respMedia = self::procesarArchivoMedia($request, $tipo, $userId, $contenido);
                if ($respMedia instanceof \WP_REST_Response) return $respMedia;
                ['mediaUrl' => $mediaUrl, 'mediaMetadata' => $mediaMetadata] = $respMedia;

            } elseif ($tipo === MensajesEnums::TIPO_SAMPLE) {
                $body = $esFormData ? [] : $request->get_json_params();
                $sampleId = (int) ($body['sampleId'] ?? $request->get_param('sampleId') ?? 0);

                if ($sampleId <= 0) {
                    return new \WP_REST_Response(['code' => 'sample_invalido', 'message' => 'ID de sample inválido'], 400);
                }

                $sample = SamplesRepository::buscarParaCompartir($sampleId);
                if (!$sample) {
                    return new \WP_REST_Response(['code' => 'sample_no_encontrado'], 404);
                }

                $mediaMetadata = json_encode([
                    'sampleId' => (int) $sample[SamplesCols::ID],
                    'titulo'   => $sample[SamplesCols::TITULO],
                    'idCorto'  => $sample[SamplesCols::ID_CORTO],
                    'slug'     => $sample[SamplesCols::SLUG],
                    'tipo'     => $sample[SamplesCols::TIPO],
                    'bpm'      => $sample[SamplesCols::BPM],
                    'key'      => $sample[SamplesCols::KEY],
                ]);
                $contenido = $contenido ?: $sample[SamplesCols::TITULO];

            } else {
                if (empty($contenido)) {
                    return new \WP_REST_Response(['code' => 'mensaje_vacio', 'message' => 'El mensaje no puede estar vacío'], 400);
                }
            }

            /* Verificar participación en la conversación */
            $conv = ConversacionesRepository::verificarParticipacion($conversacionId, $userId);
            if (!$conv) {
                return new \WP_REST_Response(['code' => 'conversacion_no_encontrada'], 404);
            }

            /* QQ52: Bloqueo bidireccional — no permitir enviar mensajes a/desde usuarios bloqueados */
            $otroId = ConversacionesRepository::obtenerOtroParticipante($conversacionId, $userId);
            if ($otroId && BloqueosRepository::existeBloqueoMutuo($userId, $otroId)) {
                return new \WP_REST_Response(['code' => 'bloqueado', 'message' => 'No puedes enviar mensajes a este usuario'], 403);
            }

            $msgId = MensajesRepository::insertarMensaje(
                $conversacionId, $userId, $contenido, $tipo, $mediaUrl, $mediaMetadata
            );

            ConversacionesRepository::actualizarUltimoMensaje($conversacionId);

            $mensaje = MensajesRepository::obtenerNormalizado($msgId);

            /* Parsear mediaMetadata de string JSONB a objeto */
            if (isset($mensaje['mediaMetadata']) && is_string($mensaje['mediaMetadata'])) {
                $mensaje['mediaMetadata'] = json_decode($mensaje['mediaMetadata'], true);
            }

            return new \WP_REST_Response(['data' => $mensaje], 201);

        } catch (\Throwable $e) {
            KamplesLogger::error('Error en MensajesEnvioController::enviarMensaje', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return new \WP_REST_Response([
                'code'    => 'error_interno',
                'message' => 'Error interno del servidor',
            ], 500);
        }
    }

    /* Procesa subida de archivo de imagen o audio para mensajes multimedia */
    private static function procesarArchivoMedia(
        \WP_REST_Request $request,
        string $tipo,
        int $userId,
        string &$contenido
    ): array|\WP_REST_Response {
        $archivos = $request->get_file_params();
        $archivo = $archivos['media'] ?? null;

        if (!$archivo || $archivo['error'] !== UPLOAD_ERR_OK) {
            return new \WP_REST_Response(['code' => 'archivo_invalido', 'message' => 'No se recibió archivo válido'], 400);
        }

        /* Validar MIME según tipo — incluir variantes x- que mime_content_type() devuelve */
        $mimesPermitidos = $tipo === MensajesEnums::TIPO_IMAGEN
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

        /* Límite de tamaño: 10MB imágenes, 30MB audio */
        $maxBytes = $tipo === MensajesEnums::TIPO_IMAGEN ? 10 * 1024 * 1024 : 30 * 1024 * 1024;
        if ($archivo['size'] > $maxBytes) {
            $maxMB = $maxBytes / 1024 / 1024;
            return new \WP_REST_Response(['code' => 'archivo_grande', 'message' => "El archivo excede el límite de {$maxMB}MB"], 400);
        }

        /* Subir a WP uploads en subcarpeta mensajes */
        $subDir = "kamples/mensajes/{$userId}/" . date('Y/m');
        $filtroDir = function ($paths) use ($subDir) {
            $paths['subdir'] = '/' . $subDir;
            $paths['path'] = $paths['basedir'] . '/' . $subDir;
            $paths['url'] = $paths['baseurl'] . '/' . $subDir;
            return $paths;
        };

        if (!function_exists('wp_handle_upload')) {
            require_once ABSPATH . 'wp-admin/includes/file.php';
        }

        $mimesUpload = $tipo === MensajesEnums::TIPO_AUDIO
            ? [
                'mp3' => 'audio/mpeg', 'wav' => 'audio/wav', 'ogg' => 'audio/ogg',
                'm4a' => 'audio/mp4', 'aac' => 'audio/aac', 'webm' => 'audio/webm',
                'flac' => 'audio/flac',
            ]
            : [
                'jpg|jpeg' => 'image/jpeg', 'png' => 'image/png',
                'gif' => 'image/gif', 'webp' => 'image/webp',
            ];

        \add_filter('upload_dir', $filtroDir);
        $subido = \wp_handle_upload($archivo, ['test_form' => false, 'mimes' => $mimesUpload]);
        \remove_filter('upload_dir', $filtroDir);

        if (isset($subido['error'])) {
            return new \WP_REST_Response(['code' => 'error_subida', 'message' => $subido['error']], 500);
        }

        return [
            'mediaUrl'      => $subido['url'],
            'mediaMetadata' => json_encode([
                'formato'  => pathinfo($archivo['name'], PATHINFO_EXTENSION),
                'tamano'   => $archivo['size'],
                'mimeType' => $mimeReal,
            ]),
        ];
    }
}
