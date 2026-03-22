<?php

/* [223A-3] AutomatizacionController — REST endpoints para automatización de procesos.
 *
 * GET  /admin/automatizacion/estado    — estado general (activo/detenido por tipo)
 * GET  /admin/automatizacion/historial — historial de lotes paginado
 * POST /admin/automatizacion/reactivar — reactivar proceso auto-detenido
 * POST /admin/automatizacion/reporte-lote — Python reporta resultados de lote
 */

namespace App\Kamples\Api\Controladores;

use App\Kamples\Auth\AuthMiddleware;
use App\Kamples\Services\ServicioAutomatizacion;
use App\Kamples\Database\Repositories\LotesProcesamientoRepository;
use App\Config\Schema\_generated\LotesProcesamientoEnums;
use App\Kamples\KamplesLogger;

class AutomatizacionController
{
    public static function registrarRutas(string $namespace): void
    {
        $admin = [AuthMiddleware::class, 'requerirAdmin'];

        \register_rest_route($namespace, '/admin/automatizacion/estado', [
            'methods'             => 'GET',
            'callback'            => [self::class, 'estado'],
            'permission_callback' => $admin,
        ]);

        \register_rest_route($namespace, '/admin/automatizacion/historial', [
            'methods'             => 'GET',
            'callback'            => [self::class, 'historial'],
            'permission_callback' => $admin,
            'args'                => [
                'tipo'   => [
                    'type'              => 'string',
                    'required'          => false,
                    'sanitize_callback' => 'sanitize_key',
                    'validate_callback' => static function ($v): bool {
                        return $v === '' || \in_array($v, [LotesProcesamientoEnums::TIPO_EXTRACCION, LotesProcesamientoEnums::TIPO_SCRAPING], true);
                    },
                ],
                'pagina' => ['type' => 'integer', 'default' => 1, 'minimum' => 1],
            ],
        ]);

        \register_rest_route($namespace, '/admin/automatizacion/reactivar', [
            'methods'             => 'POST',
            'callback'            => [self::class, 'reactivar'],
            'permission_callback' => $admin,
            'args'                => [
                'tipo' => [
                    'type'              => 'string',
                    'required'          => true,
                    'sanitize_callback' => 'sanitize_key',
                    'validate_callback' => static function (string $v): bool {
                        return \in_array($v, [LotesProcesamientoEnums::TIPO_EXTRACCION, LotesProcesamientoEnums::TIPO_SCRAPING], true);
                    },
                ],
            ],
        ]);

        /* Endpoint para reporte de Python — autenticación por secret (sin sesión WP) */
        \register_rest_route($namespace, '/admin/automatizacion/reporte-lote', [
            'methods'             => 'POST',
            'callback'            => [self::class, 'reporteLote'],
            'permission_callback' => [self::class, 'verificarSecretCron'],
        ]);
    }

    public static function estado(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            return new \WP_REST_Response([
                'ok'     => true,
                'estado' => ServicioAutomatizacion::estadoGeneral(),
            ], 200);
        } catch (\Throwable $e) {
            KamplesLogger::error('[Automatizacion] Error obteniendo estado', ['error' => $e->getMessage()]);
            return new \WP_REST_Response(['ok' => false, 'error' => 'Error interno.'], 500);
        }
    }

    public static function historial(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            $tipo = $request->get_param('tipo') ?: null;
            $pagina = (int) $request->get_param('pagina');
            $datos = LotesProcesamientoRepository::listarHistorial($tipo, $pagina);

            return new \WP_REST_Response([
                'ok'       => true,
                'items'    => $datos['items'],
                'total'    => $datos['total'],
                'pagina'   => $pagina,
            ], 200);
        } catch (\Throwable $e) {
            KamplesLogger::error('[Automatizacion] Error listando historial', ['error' => $e->getMessage()]);
            return new \WP_REST_Response(['ok' => false, 'error' => 'Error interno.'], 500);
        }
    }

    public static function reactivar(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            $tipo = $request->get_param('tipo');
            $resultado = ServicioAutomatizacion::reactivar($tipo);
            $status = ($resultado['ok'] ?? false) ? 200 : 400;
            return new \WP_REST_Response($resultado, $status);
        } catch (\Throwable $e) {
            KamplesLogger::error('[Automatizacion] Error reactivando', ['error' => $e->getMessage()]);
            return new \WP_REST_Response(['ok' => false, 'error' => 'Error interno.'], 500);
        }
    }

    /**
     * Reporte de lote desde Python. Autenticado por X-Kamples-Secret.
     */
    public static function reporteLote(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            $body = $request->get_json_params();
            $loteId = (int) ($body['batch_id'] ?? 0);

            if ($loteId <= 0) {
                return new \WP_REST_Response(['ok' => false, 'error' => 'batch_id requerido.'], 400);
            }

            $datos = [
                'exitosos'           => (int) ($body['exitosos'] ?? 0),
                'fallidos'           => (int) ($body['fallidos'] ?? 0),
                'recortes'           => (int) ($body['recortes'] ?? 0),
                'samples_publicados' => (int) ($body['samples_publicados'] ?? 0),
                'canciones_nuevas'   => (int) ($body['canciones_nuevas'] ?? 0),
                'sampleos_nuevos'    => (int) ($body['sampleos_nuevos'] ?? 0),
                'error_mensaje'      => $body['error_mensaje'] ?? null,
                'metadata'           => $body['metadata'] ?? null,
            ];

            ServicioAutomatizacion::procesarReporteLote($loteId, $datos);

            return new \WP_REST_Response(['ok' => true], 200);
        } catch (\Throwable $e) {
            KamplesLogger::error('[Automatizacion] Error procesando reporte', ['error' => $e->getMessage()]);
            return new \WP_REST_Response(['ok' => false, 'error' => 'Error interno.'], 500);
        }
    }

    /**
     * Verifica X-Kamples-Secret para endpoints llamados por Python (sin sesión WP).
     */
    public static function verificarSecretCron(\WP_REST_Request $request): bool
    {
        $secretRecibido = $request->get_header('X-Kamples-Secret');
        $secretEsperado = \defined('KAMPLES_CRON_SECRET')
            ? \constant('KAMPLES_CRON_SECRET')
            : (\getenv('KAMPLES_CRON_SECRET') ?: '');

        if (empty($secretEsperado) || empty($secretRecibido)) {
            return false;
        }

        return \hash_equals($secretEsperado, $secretRecibido);
    }
}
