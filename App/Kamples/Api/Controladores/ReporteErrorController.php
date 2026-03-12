<?php

/**
 * ReporteErrorController — Endpoint para reportes de errores/bugs de la plataforma.
 *
 * Permite a usuarios autenticados enviar reportes de errores que encuentren.
 * Los reportes se almacenan en la tabla 'reportes' con tipo 'error_plataforma'
 * y son visibles en el panel de admin/moderacion.
 *
 * Rutas registradas:
 *   POST kamples/v1/reportar-error — Crear reporte de error
 *
 * @package Kamples
 */

namespace App\Kamples\Api\Controladores;

use WP_REST_Request;
use WP_REST_Response;
use App\Kamples\Database\Repositories\ReportesRepository;
use App\Kamples\Auth\AuthMiddleware;
use App\Kamples\Api\Helpers\UsuarioHelper;
use App\Kamples\Api\Helpers\Validador;
use App\Kamples\Api\Helpers\RateLimiter;
use App\Kamples\KamplesLogger;

class ReporteErrorController
{
    private const TIPO_ERROR = 'error_plataforma';

    /* Maximo 5 reportes de error por usuario cada 24h */
    private const RATE_LIMIT_MAX = 5;
    private const RATE_LIMIT_VENTANA = 86400;

    public static function registrarRutas(string $ns): void
    {
        register_rest_route($ns, '/reportar-error', [
            'methods'             => 'POST',
            'callback'            => [self::class, 'crear'],
            'permission_callback' => [AuthMiddleware::class, 'requerirAuth'],
        ]);
    }

    /**
     * POST /reportar-error
     *
     * Parametros requeridos:
     *   razon    string — asunto breve del error
     *   detalles string — descripcion detallada del error
     *
     * Parametro opcional:
     *   url      string — URL donde ocurrio el error
     */
    public static function crear(WP_REST_Request $request): WP_REST_Response
    {
        try {
            $userId = UsuarioHelper::obtenerIdUsuario($request);
            if (!$userId) {
                return new WP_REST_Response(['code' => 'no_autorizado'], 401);
            }

            /* Rate limiting: prevenir abuso */
            $rateResp = RateLimiter::verificarUsuario(
                $userId,
                'reportar_error',
                self::RATE_LIMIT_MAX,
                self::RATE_LIMIT_VENTANA
            );
            if ($rateResp) {
                return $rateResp;
            }

            $body     = $request->get_json_params();
            $razon    = \sanitize_text_field($body['razon'] ?? '');
            $detalles = \sanitize_textarea_field($body['detalles'] ?? '');
            $url      = \esc_url_raw($body['url'] ?? '');

            /* Validaciones */
            if (empty($razon)) {
                return Validador::respuestaError('El asunto del reporte es obligatorio');
            }

            $errorRazon = Validador::validarLongitud($razon, 200, 'El asunto');
            if ($errorRazon) {
                return Validador::respuestaError($errorRazon);
            }

            if (empty($detalles)) {
                return Validador::respuestaError('La descripcion del error es obligatoria');
            }

            $errorDetalles = Validador::validarLongitud($detalles, 2000, 'La descripcion');
            if ($errorDetalles) {
                return Validador::respuestaError($errorDetalles);
            }

            /* Armar detalles como texto (incluir URL si existe) */
            $detallesCompletos = $detalles;
            if (!empty($url)) {
                $detallesCompletos = "URL: {$url}\n\n{$detalles}";
            }

            $reporteId = ReportesRepository::crearReporte(
                self::TIPO_ERROR,
                0,
                $userId,
                $razon,
                $detallesCompletos
            );

            return new WP_REST_Response([
                'ok'      => true,
                'message' => 'Reporte enviado correctamente',
                'id'      => $reporteId,
            ], 201);
        } catch (\Throwable $e) {
            KamplesLogger::error('ReporteErrorController::crear error', ['error' => $e->getMessage()]);
            return new WP_REST_Response(['code' => 'error_interno', 'message' => 'Error interno del servidor'], 500);
        }
    }
}
