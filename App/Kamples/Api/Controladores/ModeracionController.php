<?php

/**
 * ModeracionController — Bloqueo user-to-user y reportes de usuario.
 *
 * Extraido de SocialController para cumplir SRP y limite de 300 lineas.
 *
 * @package Kamples
 */

namespace App\Kamples\Api\Controladores;

use App\Kamples\Auth\AuthMiddleware;
use App\Kamples\Api\Helpers\UsuarioHelper;
use App\Kamples\Api\Helpers\RateLimiter;
use App\Kamples\Database\Repositories\FollowsRepository;
use App\Kamples\Database\Repositories\BloqueosRepository;
use App\Kamples\Database\Repositories\ReportesRepository;
use App\Kamples\Database\Repositories\UsuariosExtRepository;
use App\Kamples\KamplesLogger;

class ModeracionController
{
    public static function registrarRutas(string $namespace): void
    {
        /* QQ25: Endpoints de bloqueo user-to-user */
        register_rest_route($namespace, '/block/(?P<userId>\d+)', [
            'methods'             => 'POST',
            'callback'            => [self::class, 'bloquearUsuario'],
            'permission_callback' => [AuthMiddleware::class, 'requerirAuth'],
        ]);

        register_rest_route($namespace, '/block/(?P<userId>\d+)', [
            'methods'             => 'DELETE',
            'callback'            => [self::class, 'desbloquearUsuario'],
            'permission_callback' => [AuthMiddleware::class, 'requerirAuth'],
        ]);

        register_rest_route($namespace, '/me/bloqueados', [
            'methods'             => 'GET',
            'callback'            => [self::class, 'misBloqueados'],
            'permission_callback' => [AuthMiddleware::class, 'requerirAuth'],
        ]);

        /* QQ23: Reporte de usuario */
        register_rest_route($namespace, '/reportar-usuario/(?P<userId>\d+)', [
            'methods'             => 'POST',
            'callback'            => [self::class, 'reportarUsuario'],
            'permission_callback' => [AuthMiddleware::class, 'requerirAuth'],
        ]);
    }

    /* ---- QQ25: Bloqueo user-to-user ---- */

    public static function bloquearUsuario(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            $userId = UsuarioHelper::obtenerIdPg();
            if (!$userId) return UsuarioHelper::respuestaNoEncontrado();

            $targetId = (int) $request->get_param('userId');
            if ($targetId === $userId) {
                return new \WP_REST_Response(['code' => 'auto_bloqueo', 'message' => 'No puedes bloquearte a ti mismo'], 400);
            }

            $target = UsuariosExtRepository::buscarPorId($targetId);
            if (!$target) {
                return new \WP_REST_Response(['code' => 'usuario_no_encontrado', 'message' => 'Usuario no encontrado'], 404);
            }

            /* Rate limit: 10 bloqueos/minuto */
            $limitResp = RateLimiter::verificarUsuario($userId, 'block', 10, 60);
            if ($limitResp) return $limitResp;

            BloqueosRepository::bloquear($userId, $targetId);

            /* Al bloquear, dejar de seguir mutuamente */
            FollowsRepository::dejarDeSeguir($userId, $targetId);
            FollowsRepository::dejarDeSeguir($targetId, $userId);
            FollowsRepository::actualizarContadores($userId, $targetId);

            return new \WP_REST_Response(['ok' => true], 200);
        } catch (\Throwable $e) {
            KamplesLogger::error('ModeracionController::bloquearUsuario error', ['error' => $e->getMessage()]);
            return new \WP_REST_Response(['code' => 'error_interno', 'message' => 'Error interno del servidor'], 500);
        }
    }

    public static function desbloquearUsuario(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            $userId = UsuarioHelper::obtenerIdPg();
            if (!$userId) return UsuarioHelper::respuestaNoEncontrado();

            $targetId = (int) $request->get_param('userId');
            BloqueosRepository::desbloquear($userId, $targetId);

            return new \WP_REST_Response(['ok' => true], 200);
        } catch (\Throwable $e) {
            KamplesLogger::error('ModeracionController::desbloquearUsuario error', ['error' => $e->getMessage()]);
            return new \WP_REST_Response(['code' => 'error_interno', 'message' => 'Error interno del servidor'], 500);
        }
    }

    public static function misBloqueados(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            $userId = UsuarioHelper::obtenerIdPg();
            if (!$userId) return UsuarioHelper::respuestaNoEncontrado();

            $lista = BloqueosRepository::listarBloqueados($userId);

            return new \WP_REST_Response(['data' => $lista], 200);
        } catch (\Throwable $e) {
            KamplesLogger::error('ModeracionController::misBloqueados error', ['error' => $e->getMessage()]);
            return new \WP_REST_Response(['code' => 'error_interno', 'message' => 'Error interno del servidor'], 500);
        }
    }

    /*
     * QQ23: Reportar usuario.
     * Crea un reporte de tipo 'usuario' en la tabla de reportes,
     * visible en el panel de moderacion.
     */
    public static function reportarUsuario(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            $reportadorId = UsuarioHelper::obtenerIdPg();
            if (!$reportadorId) return UsuarioHelper::respuestaNoEncontrado();

            /* Rate limit: 5 reportes de usuario cada 24h */
            $limitResp = RateLimiter::verificarUsuario($reportadorId, 'reportar_usuario', 5, 86400);
            if ($limitResp) return $limitResp;

            $targetId = (int) $request->get_param('userId');

            if ($reportadorId === $targetId) {
                return new \WP_REST_Response(['code' => 'no_self_report', 'message' => 'No puedes reportarte a ti mismo'], 400);
            }

            if (!UsuariosExtRepository::existe(['id' => $targetId])) {
                return new \WP_REST_Response(['code' => 'usuario_no_encontrado', 'message' => 'El usuario no existe'], 404);
            }

            $body   = $request->get_json_params();
            $razon  = \sanitize_text_field($body['razon'] ?? '');

            if (empty($razon)) {
                return new \WP_REST_Response(['code' => 'razon_requerida', 'message' => 'Indica el motivo del reporte'], 400);
            }

            if (mb_strlen($razon) > 500) {
                return new \WP_REST_Response(['code' => 'razon_larga', 'message' => 'El motivo no puede superar 500 caracteres'], 400);
            }

            $detalles = \sanitize_textarea_field($body['detalles'] ?? '');
            if (mb_strlen($detalles) > 2000) {
                $detalles = mb_substr($detalles, 0, 2000);
            }

            ReportesRepository::crearReporteUsuario($targetId, $reportadorId, $razon, !empty($detalles) ? $detalles : null);

            KamplesLogger::info('Reporte de usuario creado', [
                'reportador' => $reportadorId,
                'reportado'  => $targetId,
            ]);

            return new \WP_REST_Response(['ok' => true, 'message' => 'Reporte enviado'], 201);
        } catch (\Throwable $e) {
            KamplesLogger::error('ModeracionController::reportarUsuario error', ['error' => $e->getMessage()]);
            return new \WP_REST_Response(['code' => 'error_interno', 'message' => 'Error interno del servidor'], 500);
        }
    }
}
