<?php

/**
 * ColaIaController — Endpoints admin para gestionar la cola de procesamiento IA.
 *
 * C356: Proporciona visibilidad y control sobre los items encolados
 * cuando Groq devuelve rate limit (429).
 *
 * Endpoints:
 *   GET    /admin/cola-ia              — Lista items con paginacion y filtros
 *   GET    /admin/cola-ia/estadisticas — Estadisticas agregadas
 *   POST   /admin/cola-ia/reintentar   — Reintentar un item especifico
 *   POST   /admin/cola-ia/reintentar-todos — Reintentar todos los items con error
 *   POST   /admin/cola-ia/procesar     — Forzar procesamiento inmediato del cron
 *
 * @package Kamples
 */

namespace App\Kamples\Api\Controladores;

use App\Kamples\Database\Repositories\ColaProcesamientoIaRepository;
use App\Config\Schema\_generated\ColaProcesamientoIaEnums;
use App\Kamples\Auth\AuthMiddleware;
use App\Kamples\Services\ProcesadorColaIA;
use App\Kamples\KamplesLogger;

class ColaIaController
{
    /**
     * Registra las rutas REST para gestion de la cola IA.
     * Llamar desde KamplesController::registrar().
     */
    public static function registrarRutas(string $namespace): void
    {
        $admin = [AuthMiddleware::class, 'requerirAdmin'];

        /* Lista paginada de items en la cola */
        register_rest_route($namespace, '/admin/cola-ia', [
            'methods' => 'GET',
            'callback' => [self::class, 'listar'],
            'permission_callback' => $admin,
        ]);

        /* Estadisticas agregadas */
        register_rest_route($namespace, '/admin/cola-ia/estadisticas', [
            'methods' => 'GET',
            'callback' => [self::class, 'estadisticas'],
            'permission_callback' => $admin,
        ]);

        /* Reintentar un item especifico */
        register_rest_route($namespace, '/admin/cola-ia/reintentar', [
            'methods' => 'POST',
            'callback' => [self::class, 'reintentar'],
            'permission_callback' => $admin,
        ]);

        /* Reintentar todos los items con error */
        register_rest_route($namespace, '/admin/cola-ia/reintentar-todos', [
            'methods' => 'POST',
            'callback' => [self::class, 'reintentarTodos'],
            'permission_callback' => $admin,
        ]);

        /* Forzar procesamiento inmediato de la cola */
        register_rest_route($namespace, '/admin/cola-ia/procesar', [
            'methods' => 'POST',
            'callback' => [self::class, 'procesarAhora'],
            'permission_callback' => $admin,
        ]);
    }

    /**
     * GET /admin/cola-ia?estado=pendiente&tipo=sample&pagina=1&limite=20
     * Lista items de la cola con filtros opcionales.
     */
    public static function listar(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            $estado = $request->get_param('estado');
            $tipo = $request->get_param('tipo');
            $pagina = \max(1, (int) ($request->get_param('pagina') ?? 1));
            $limite = \min(100, \max(5, (int) ($request->get_param('limite') ?? 20)));

            /* Validar filtros contra valores validos del schema */
            $estadosValidos = [
                ColaProcesamientoIaEnums::ESTADO_PENDIENTE,
                ColaProcesamientoIaEnums::ESTADO_PROCESANDO,
                ColaProcesamientoIaEnums::ESTADO_COMPLETADO,
                ColaProcesamientoIaEnums::ESTADO_ERROR_REINTENTO,
                ColaProcesamientoIaEnums::ESTADO_ERROR_FINAL,
            ];
            if ($estado && !\in_array($estado, $estadosValidos, true)) {
                return new \WP_REST_Response(['code' => 'filtro_invalido', 'message' => 'Estado no valido'], 400);
            }

            $tiposValidos = [
                ColaProcesamientoIaEnums::TIPO_SAMPLE,
                ColaProcesamientoIaEnums::TIPO_PUBLICACION,
                ColaProcesamientoIaEnums::TIPO_COMENTARIO,
            ];
            if ($tipo && !\in_array($tipo, $tiposValidos, true)) {
                return new \WP_REST_Response(['code' => 'filtro_invalido', 'message' => 'Tipo no valido'], 400);
            }

            $items = ColaProcesamientoIaRepository::listarItems($pagina, $limite, $estado, $tipo);

            return new \WP_REST_Response(['data' => $items], 200);
        } catch (\Throwable $e) {
            KamplesLogger::error('ColaIaController::listar fallo', ['error' => $e->getMessage()]);
            return new \WP_REST_Response(['code' => 'error_interno', 'message' => 'Error interno'], 500);
        }
    }

    /**
     * GET /admin/cola-ia/estadisticas
     * Estadisticas agregadas: totales por estado, pendientes, errores, etc.
     */
    public static function estadisticas(): \WP_REST_Response
    {
        try {
            $stats = ColaProcesamientoIaRepository::obtenerEstadisticas();
            return new \WP_REST_Response(['data' => $stats], 200);
        } catch (\Throwable $e) {
            KamplesLogger::error('ColaIaController::estadisticas fallo', ['error' => $e->getMessage()]);
            return new \WP_REST_Response(['code' => 'error_interno', 'message' => 'Error interno'], 500);
        }
    }

    /**
     * POST /admin/cola-ia/reintentar { id: number }
     * Fuerza reintento de un item especifico.
     */
    public static function reintentar(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            $id = (int) $request->get_param('id');
            if ($id <= 0) {
                return new \WP_REST_Response(['code' => 'id_requerido', 'message' => 'ID de item requerido'], 400);
            }

            $resultado = ColaProcesamientoIaRepository::forzarReintento($id);
            if (!$resultado) {
                return new \WP_REST_Response(['code' => 'no_encontrado', 'message' => 'Item no encontrado o no reintenible'], 404);
            }

            KamplesLogger::info('ColaIaController: Reintento forzado', ['itemId' => $id]);
            return new \WP_REST_Response(['ok' => true, 'message' => 'Item marcado para reintento'], 200);
        } catch (\Throwable $e) {
            KamplesLogger::error('ColaIaController::reintentar fallo', ['error' => $e->getMessage()]);
            return new \WP_REST_Response(['code' => 'error_interno', 'message' => 'Error interno'], 500);
        }
    }

    /**
     * POST /admin/cola-ia/reintentar-todos
     * Fuerza reintento de todos los items con error (error_reintento + error_final).
     */
    public static function reintentarTodos(): \WP_REST_Response
    {
        try {
            $total = ColaProcesamientoIaRepository::forzarReintentarTodos();

            KamplesLogger::info('ColaIaController: Reintento masivo', ['total' => $total]);
            return new \WP_REST_Response([
                'ok' => true,
                'total' => $total,
                'message' => "{$total} items marcados para reintento",
            ], 200);
        } catch (\Throwable $e) {
            KamplesLogger::error('ColaIaController::reintentarTodos fallo', ['error' => $e->getMessage()]);
            return new \WP_REST_Response(['code' => 'error_interno', 'message' => 'Error interno'], 500);
        }
    }

    /**
     * POST /admin/cola-ia/procesar
     * Ejecuta el procesamiento de la cola inmediatamente (sin esperar cron).
     * Util para admin que quiere forzar el reproceso ahora.
     */
    public static function procesarAhora(): \WP_REST_Response
    {
        try {
            $resultado = ProcesadorColaIA::procesar();

            KamplesLogger::info('ColaIaController: Procesamiento manual ejecutado', $resultado);
            return new \WP_REST_Response([
                'ok' => true,
                'resultado' => $resultado,
            ], 200);
        } catch (\Throwable $e) {
            KamplesLogger::error('ColaIaController::procesarAhora fallo', ['error' => $e->getMessage()]);
            return new \WP_REST_Response(['code' => 'error_interno', 'message' => 'Error interno'], 500);
        }
    }
}
