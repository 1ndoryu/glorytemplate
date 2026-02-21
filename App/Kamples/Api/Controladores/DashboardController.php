<?php

/**
 * DashboardController — Estadísticas del creador.
 *
 * @package Kamples
 */

namespace App\Kamples\Api\Controladores;

use App\Kamples\Auth\AuthMiddleware;
use App\Kamples\Api\Helpers\UsuarioHelper;
use App\Config\Schema\_generated\UsuariosExtCols;
use App\Kamples\Database\Repositories\DashboardRepository;
use App\Kamples\Database\Repositories\SamplesRepository;
use App\Kamples\Database\Repositories\TransaccionesRepository;
use App\Kamples\KamplesLogger;

class DashboardController
{
    public static function registrarRutas(string $namespace): void
    {
        register_rest_route($namespace, '/dashboard/stats', [
            'methods' => 'GET', 'callback' => [self::class, 'stats'],
            'permission_callback' => [AuthMiddleware::class, 'requerirAuth'],
        ]);

        register_rest_route($namespace, '/dashboard/top-samples', [
            'methods' => 'GET', 'callback' => [self::class, 'topSamples'],
            'permission_callback' => [AuthMiddleware::class, 'requerirAuth'],
        ]);

        register_rest_route($namespace, '/dashboard/transacciones', [
            'methods' => 'GET', 'callback' => [self::class, 'transacciones'],
            'permission_callback' => [AuthMiddleware::class, 'requerirAuth'],
            'args' => ['page' => ['required' => false, 'type' => 'integer', 'default' => 1]],
        ]);

        register_rest_route($namespace, '/dashboard/ingresos', [
            'methods' => 'GET', 'callback' => [self::class, 'ingresos'],
            'permission_callback' => [AuthMiddleware::class, 'requerirAuth'],
            'args' => ['periodo' => ['required' => false, 'type' => 'string', 'default' => 'mes', 'enum' => ['semana', 'mes', 'anio']]],
        ]);
    }

    public static function stats(): \WP_REST_Response
    {
        try {
        $userId = UsuarioHelper::obtenerIdPg();
        if (!$userId) return UsuarioHelper::respuestaNoEncontrado();

        $usuario = UsuarioHelper::obtenerPorId($userId);

        /*
         * OPT01: 4 queries de métricas mensuales combinadas en 1 (ver DashboardRepository::statsMesCreador).
         */
        $statsMes = DashboardRepository::statsMesCreador($userId);

        $descargasMes = (int) ($statsMes['descargas_mes'] ?? 0);
        $reproduccionesMes = (int) ($statsMes['reproducciones_mes'] ?? 0);
        $reproduccionesTotal = (int) ($statsMes['reproducciones_totales'] ?? 0);
        $seguidoresNuevos = (int) ($statsMes['seguidores_nuevos'] ?? 0);

        /* OPT02: 3 queries de ingresos combinadas en 1 con SUM FILTER */
        $ingresos = TransaccionesRepository::ingresosDashboard($userId);
        $ingresosMes = $ingresos['ingresosMes'];
        $ingresosAnterior = $ingresos['ingresosAnterior'];
        $ingresosTotal = $ingresos['ingresosTotal'];

        return new \WP_REST_Response(['data' => [
            'ingresosTotal'       => $ingresosTotal,
            'ingresosMes'         => $ingresosMes,
            'ingresosAnterior'    => $ingresosAnterior,
            'descargasTotal'      => (int) ($usuario[UsuariosExtCols::TOTAL_DESCARGAS] ?? 0),
            'descargasMes'        => $descargasMes,
            'reproduccionesTotal' => $reproduccionesTotal,
            'reproduccionesMes'   => $reproduccionesMes,
            'seguidoresTotal'     => (int) ($usuario[UsuariosExtCols::TOTAL_SEGUIDORES] ?? 0),
            'seguidoresNuevosMes' => $seguidoresNuevos,
            'samplesPublicados'   => (int) ($usuario[UsuariosExtCols::TOTAL_SAMPLES] ?? 0),
        ]], 200);
        } catch (\Throwable $e) {
            KamplesLogger::error('Error en DashboardController::stats', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return new \WP_REST_Response([
                'code' => 'error_interno',
                'message' => 'Error interno del servidor',
            ], 500);
        }
    }

    public static function topSamples(): \WP_REST_Response
    {
        try {
        $userId = UsuarioHelper::obtenerIdPg();
        if (!$userId) return UsuarioHelper::respuestaNoEncontrado();

        $samples = SamplesRepository::topSamplesCreador($userId);

        return new \WP_REST_Response(['data' => $samples], 200);
        } catch (\Throwable $e) {
            KamplesLogger::error('Error en DashboardController::topSamples', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return new \WP_REST_Response([
                'code' => 'error_interno',
                'message' => 'Error interno del servidor',
            ], 500);
        }
    }

    public static function transacciones(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
        $userId = UsuarioHelper::obtenerIdPg();
        if (!$userId) return UsuarioHelper::respuestaNoEncontrado();

        $page = max(1, (int) $request->get_param('page'));
        $offset = ($page - 1) * 20;

        $transacciones = TransaccionesRepository::listarDelCreador($userId, 20, $offset);

        return new \WP_REST_Response(['data' => $transacciones], 200);
        } catch (\Throwable $e) {
            KamplesLogger::error('Error en DashboardController::transacciones', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return new \WP_REST_Response([
                'code' => 'error_interno',
                'message' => 'Error interno del servidor',
            ], 500);
        }
    }

    public static function ingresos(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
        $userId = UsuarioHelper::obtenerIdPg();
        if (!$userId) return UsuarioHelper::respuestaNoEncontrado();

        $periodo = $request->get_param('periodo');
        $intervalo = match ($periodo) {
            'semana' => '7 days',
            'anio' => '365 days',
            default => '30 days',
        };

        $ingresos = TransaccionesRepository::ingresosGrafico($userId, $intervalo);

        return new \WP_REST_Response(['data' => $ingresos], 200);
        } catch (\Throwable $e) {
            KamplesLogger::error('Error en DashboardController::ingresos', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return new \WP_REST_Response([
                'code' => 'error_interno',
                'message' => 'Error interno del servidor',
            ], 500);
        }
    }
}
