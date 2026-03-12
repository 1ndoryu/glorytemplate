<?php

/**
 * ModeracionController — Bloqueo user-to-user y sistema centralizado de reportes.
 *
 * Endpoint generico POST /reportar maneja todos los tipos: usuario, publicacion,
 * comentario, sample, error_plataforma. Validacion especifica por tipo.
 *
 * @package Kamples
 */

namespace App\Kamples\Api\Controladores;

use App\Kamples\Auth\AuthMiddleware;
use App\Kamples\Api\Helpers\UsuarioHelper;
use App\Kamples\Api\Helpers\RateLimiter;
use App\Kamples\Api\Helpers\Validador;
use App\Kamples\Database\Repositories\FollowsRepository;
use App\Kamples\Database\Repositories\BloqueosRepository;
use App\Kamples\Database\Repositories\ReportesRepository;
use App\Kamples\Database\Repositories\UsuariosExtRepository;
use App\Kamples\Database\Repositories\PublicacionesRepository;
use App\Kamples\Database\Repositories\ComentariosRepository;
use App\Kamples\Database\Repositories\SamplesRepository;
use App\Config\Schema\_generated\PublicacionesCols;
use App\Config\Schema\_generated\ComentariosCols;
use App\Config\Schema\_generated\SamplesCols;
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

        /* QQ23: Reporte de usuario (legacy — usar POST /reportar generico) */
        register_rest_route($namespace, '/reportar-usuario/(?P<userId>\d+)', [
            'methods'             => 'POST',
            'callback'            => [self::class, 'reportarUsuario'],
            'permission_callback' => [AuthMiddleware::class, 'requerirAuth'],
        ]);

        /* QQ38: Endpoint centralizado de reportes. Todos los tipos pasan por aqui. */
        register_rest_route($namespace, '/reportar', [
            'methods'             => 'POST',
            'callback'            => [self::class, 'reportarGenerico'],
            'permission_callback' => [AuthMiddleware::class, 'requerirAuth'],
        ]);

        /* QQ63: Verificar disponibilidad de solicitud WhatsApp */
        register_rest_route($namespace, '/solicitud-whatsapp/estado', [
            'methods'             => 'GET',
            'callback'            => [self::class, 'estadoSolicitudWhatsapp'],
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

    /* Tipos validos para el endpoint centralizado de reportes */
    private const TIPO_USUARIO = 'usuario';
    private const TIPO_PUBLICACION = 'publicacion';
    private const TIPO_COMENTARIO = 'comentario';
    private const TIPO_SAMPLE = 'sample';
    private const TIPO_ERROR = 'error_plataforma';
    private const TIPO_SOLICITUD_WA = 'solicitud_whatsapp';
    private const LIMITE_DIARIO_SOLICITUDES_WA = 6;

    private const TIPOS_PERMITIDOS = [
        self::TIPO_USUARIO,
        self::TIPO_PUBLICACION,
        self::TIPO_COMENTARIO,
        self::TIPO_SAMPLE,
        self::TIPO_ERROR,
        self::TIPO_SOLICITUD_WA,
    ];

    /*
     * QQ38: Endpoint centralizado de reportes.
     * Acepta: tipo, targetId, razon, detalles?, url? (para error_plataforma).
     * Valida existencia del target segun tipo y evita duplicados.
     */
    public static function reportarGenerico(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            $userId = UsuarioHelper::obtenerIdPg();
            if (!$userId) return UsuarioHelper::respuestaNoEncontrado();

            $body     = $request->get_json_params();
            $tipo     = \sanitize_text_field($body['tipo'] ?? '');
            $targetId = (int) ($body['targetId'] ?? 0);
            $razon    = \sanitize_text_field($body['razon'] ?? '');
            $detalles = \sanitize_textarea_field($body['detalles'] ?? '');
            $url      = \esc_url_raw($body['url'] ?? '');

            if (!in_array($tipo, self::TIPOS_PERMITIDOS, true)) {
                return Validador::respuestaError('Tipo de reporte no valido');
            }

            if (empty($razon)) {
                return Validador::respuestaError('Indica el motivo del reporte');
            }

            $errorRazon = Validador::validarLongitud($razon, 500, 'El motivo');
            if ($errorRazon) return Validador::respuestaError($errorRazon);

            if (mb_strlen($detalles) > 2000) {
                $detalles = mb_substr($detalles, 0, 2000);
            }

            /* Rate limit global: 10 reportes por hora */
            $limitResp = RateLimiter::verificarUsuario($userId, 'reportar_' . $tipo, 10, 3600);
            if ($limitResp) return $limitResp;

            return self::procesarReporte($tipo, $targetId, $userId, $razon, $detalles, $url);
        } catch (\Throwable $e) {
            KamplesLogger::error('ModeracionController::reportarGenerico error', ['error' => $e->getMessage()]);
            return new \WP_REST_Response(['code' => 'error_interno', 'message' => 'Error interno del servidor'], 500);
        }
    }

    /* Procesa cada tipo de reporte con validacion especifica */
    private static function procesarReporte(string $tipo, int $targetId, int $userId, string $razon, string $detalles, string $url): \WP_REST_Response
    {
        switch ($tipo) {
            case self::TIPO_USUARIO:
                if ($userId === $targetId) {
                    return Validador::respuestaError('No puedes reportarte a ti mismo');
                }
                if (!UsuariosExtRepository::existe(['id' => $targetId])) {
                    return new \WP_REST_Response(['code' => 'no_encontrado', 'message' => 'Usuario no encontrado'], 404);
                }
                ReportesRepository::crearReporteUsuario($targetId, $userId, $razon, $detalles ?: null);
                break;

            case self::TIPO_PUBLICACION:
                if (!PublicacionesRepository::existe([PublicacionesCols::ID => $targetId])) {
                    return new \WP_REST_Response(['code' => 'no_encontrado', 'message' => 'Publicacion no encontrada'], 404);
                }
                if (ReportesRepository::yaReportado(self::TIPO_PUBLICACION, $targetId, $userId)) {
                    return new \WP_REST_Response(['ok' => true, 'message' => 'Ya reportaste esta publicacion'], 200);
                }
                ReportesRepository::crearReporte(self::TIPO_PUBLICACION, $targetId, $userId, $razon, $detalles ?: null);
                break;

            case self::TIPO_COMENTARIO:
                if (!ComentariosRepository::existe([ComentariosCols::ID => $targetId])) {
                    return new \WP_REST_Response(['code' => 'no_encontrado', 'message' => 'Comentario no encontrado'], 404);
                }
                if (ReportesRepository::yaReportado(self::TIPO_COMENTARIO, $targetId, $userId)) {
                    return new \WP_REST_Response(['ok' => true, 'message' => 'Ya reportaste este comentario'], 200);
                }
                ReportesRepository::crearReporte(self::TIPO_COMENTARIO, $targetId, $userId, $razon, $detalles ?: null);
                break;

            case self::TIPO_SAMPLE:
                if (!SamplesRepository::existe([SamplesCols::ID => $targetId])) {
                    return new \WP_REST_Response(['code' => 'no_encontrado', 'message' => 'Sample no encontrado'], 404);
                }
                if (ReportesRepository::yaReportado(self::TIPO_SAMPLE, $targetId, $userId)) {
                    return new \WP_REST_Response(['ok' => true, 'message' => 'Ya reportaste este sample'], 200);
                }
                ReportesRepository::crearReporte(self::TIPO_SAMPLE, $targetId, $userId, $razon, $detalles ?: null);
                break;

            case self::TIPO_ERROR:
                $detallesCompletos = $detalles;
                if (!empty($url)) {
                    $detallesCompletos = "URL: {$url}\n\n{$detalles}";
                }
                ReportesRepository::crearReporte(self::TIPO_ERROR, 0, $userId, $razon, $detallesCompletos ?: null);
                break;

            case self::TIPO_SOLICITUD_WA:
                if (ReportesRepository::contarPorTipoYUsuario(self::TIPO_SOLICITUD_WA, $userId) > 0) {
                    return Validador::respuestaError('Ya enviaste tu solicitud de ingreso');
                }
                if (ReportesRepository::contarPorTipoHoy(self::TIPO_SOLICITUD_WA) >= self::LIMITE_DIARIO_SOLICITUDES_WA) {
                    return Validador::respuestaError('Se ha alcanzado el limite diario de solicitudes. Intenta manana temprano.');
                }
                ReportesRepository::crearReporte(self::TIPO_SOLICITUD_WA, 0, $userId, $razon, $detalles ?: null);
                break;
        }

        KamplesLogger::info('Reporte creado', ['tipo' => $tipo, 'target' => $targetId, 'reportador' => $userId]);
        return new \WP_REST_Response(['ok' => true, 'message' => 'Reporte enviado'], 201);
    }

    /*
     * QQ63: Verificar si el usuario puede enviar solicitud de WhatsApp.
     * Retorna: disponible (puede enviar), yaEnviada (ya envió una), limiteDiario (se excedió el global).
     */
    public static function estadoSolicitudWhatsapp(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            $userId = UsuarioHelper::obtenerIdPg();
            if (!$userId) return UsuarioHelper::respuestaNoEncontrado();

            $yaEnviada = ReportesRepository::contarPorTipoYUsuario(self::TIPO_SOLICITUD_WA, $userId) > 0;
            $limiteDiario = ReportesRepository::contarPorTipoHoy(self::TIPO_SOLICITUD_WA) >= self::LIMITE_DIARIO_SOLICITUDES_WA;

            return new \WP_REST_Response([
                'ok' => true,
                'data' => [
                    'disponible'   => !$yaEnviada && !$limiteDiario,
                    'yaEnviada'    => $yaEnviada,
                    'limiteDiario' => $limiteDiario,
                ],
            ], 200);
        } catch (\Throwable $e) {
            KamplesLogger::error('ModeracionController::estadoSolicitudWhatsapp error', ['error' => $e->getMessage()]);
            return new \WP_REST_Response(['code' => 'error_interno', 'message' => 'Error interno del servidor'], 500);
        }
    }
}
