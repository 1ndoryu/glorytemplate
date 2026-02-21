<?php

/**
 * DashboardController — Estadísticas del creador.
 *
 * TO-DO: Extraer queries directas de PostgresService a un DashboardRepository
 * para cumplir con la separación controller/repository (endpoint-accede-bd).
 *
 * @package Kamples
 */

namespace App\Kamples\Api\Controladores;

use App\Kamples\Auth\AuthMiddleware;
use App\Kamples\Api\Helpers\UsuarioHelper;
use App\Config\Schema\_generated\UsuariosExtCols;
use App\Config\Schema\_generated\DescargasCols;
use App\Config\Schema\_generated\ReproduccionesCols;
use App\Config\Schema\_generated\SamplesCols;
use App\Config\Schema\_generated\FollowsCols;
use App\Kamples\Database\PostgresService;
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
         * OPT01: 4 queries de metricas mensuales combinadas en 1 con subqueries escalares.
         * PDO con ATTR_EMULATE_PREPARES=false prohibe reusar placeholders,
         * asi que se usan uid1-uid4 con el mismo valor.
         */
        $td = DescargasCols::TABLA;
        $tr = ReproduccionesCols::TABLA;
        $ts = SamplesCols::TABLA;
        $tf = FollowsCols::TABLA;

        $statsMes = PostgresService::consultarUno(
            "SELECT"
            . " (SELECT COUNT(*) FROM {$td} d JOIN {$ts} s ON d." . DescargasCols::SAMPLE_ID . " = s." . SamplesCols::ID
            . "  WHERE s." . SamplesCols::CREADOR_ID . " = :uid1"
            . "  AND d." . DescargasCols::CREATED_AT . " >= date_trunc('month', NOW())) as descargas_mes,"
            . " (SELECT COUNT(*) FROM {$tr} r JOIN {$ts} s ON r." . ReproduccionesCols::SAMPLE_ID . " = s." . SamplesCols::ID
            . "  WHERE s." . SamplesCols::CREADOR_ID . " = :uid2"
            . "  AND r." . ReproduccionesCols::CREATED_AT . " >= date_trunc('month', NOW())) as reproducciones_mes,"
            . " (SELECT COALESCE(SUM(" . SamplesCols::TOTAL_REPRODUCCIONES . "), 0) FROM {$ts}"
            . "  WHERE " . SamplesCols::CREADOR_ID . " = :uid3) as reproducciones_totales,"
            . " (SELECT COUNT(*) FROM {$tf}"
            . "  WHERE " . FollowsCols::SEGUIDO_ID . " = :uid4"
            . "  AND " . FollowsCols::CREATED_AT . " >= date_trunc('month', NOW())) as seguidores_nuevos",
            ['uid1' => $userId, 'uid2' => $userId, 'uid3' => $userId, 'uid4' => $userId]
        );

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
