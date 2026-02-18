<?php

/**
 * DashboardController — Estadísticas del creador.
 *
 * @package Kamples
 */

namespace App\Kamples\Api\Controladores;

use App\Kamples\Database\PostgresService;
use App\Kamples\Auth\AuthMiddleware;
use App\Kamples\Api\Helpers\UsuarioHelper;
use App\Config\Schema\_generated\UsuariosExtCols;

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
        $userId = UsuarioHelper::obtenerIdPg();
        if (!$userId) return UsuarioHelper::respuestaNoEncontrado();

        $usuario = UsuarioHelper::obtenerPorId($userId);

        $descargasMes = PostgresService::consultarUno(
            "SELECT COUNT(*) as total FROM descargas d JOIN samples s ON d.sample_id = s.id
             WHERE s.creador_id = :userId AND d.created_at >= date_trunc('month', NOW())",
            ['userId' => $userId]
        );

        $reproduccionesMes = PostgresService::consultarUno(
            "SELECT COUNT(*) as total FROM reproducciones r JOIN samples s ON r.sample_id = s.id
             WHERE s.creador_id = :userId AND r.created_at >= date_trunc('month', NOW())",
            ['userId' => $userId]
        );

        $reproduccionesTotal = PostgresService::consultarUno(
            "SELECT COALESCE(SUM(s.total_reproducciones), 0) as total FROM samples s WHERE s.creador_id = :userId",
            ['userId' => $userId]
        );

        $seguidoresNuevos = PostgresService::consultarUno(
            "SELECT COUNT(*) as total FROM follows WHERE seguido_id = :userId AND created_at >= date_trunc('month', NOW())",
            ['userId' => $userId]
        );

        $ingresosMes = PostgresService::consultarUno(
            "SELECT COALESCE(SUM(pago_creador), 0) as total FROM transacciones
             WHERE creador_id = :userId AND estado = 'completed' AND created_at >= date_trunc('month', NOW())",
            ['userId' => $userId]
        );

        $ingresosAnterior = PostgresService::consultarUno(
            "SELECT COALESCE(SUM(pago_creador), 0) as total FROM transacciones
             WHERE creador_id = :userId AND estado = 'completed'
             AND created_at >= date_trunc('month', NOW()) - INTERVAL '1 month'
             AND created_at < date_trunc('month', NOW())",
            ['userId' => $userId]
        );

        $ingresosTotal = PostgresService::consultarUno(
            "SELECT COALESCE(SUM(pago_creador), 0) as total FROM transacciones WHERE creador_id = :userId AND estado = 'completed'",
            ['userId' => $userId]
        );

        return new \WP_REST_Response(['data' => [
            'ingresosTotal'       => (float) ($ingresosTotal['total'] ?? 0),
            'ingresosMes'         => (float) ($ingresosMes['total'] ?? 0),
            'ingresosAnterior'    => (float) ($ingresosAnterior['total'] ?? 0),
            'descargasTotal'      => (int) ($usuario[UsuariosExtCols::TOTAL_DESCARGAS] ?? 0),
            'descargasMes'        => (int) ($descargasMes['total'] ?? 0),
            'reproduccionesTotal' => (int) ($reproduccionesTotal['total'] ?? 0),
            'reproduccionesMes'   => (int) ($reproduccionesMes['total'] ?? 0),
            'seguidoresTotal'     => (int) ($usuario[UsuariosExtCols::TOTAL_SEGUIDORES] ?? 0),
            'seguidoresNuevosMes' => (int) ($seguidoresNuevos['total'] ?? 0),
            'samplesPublicados'   => (int) ($usuario[UsuariosExtCols::TOTAL_SAMPLES] ?? 0),
        ]], 200);
    }

    public static function topSamples(): \WP_REST_Response
    {
        $userId = UsuarioHelper::obtenerIdPg();
        if (!$userId) return UsuarioHelper::respuestaNoEncontrado();

        $samples = PostgresService::consultar(
            "SELECT s.id, s.titulo, s.slug,
                    s.total_descargas as descargas, s.total_reproducciones as reproducciones,
                    s.total_likes as likes,
                    COALESCE((SELECT SUM(t.pago_creador) FROM transacciones t WHERE t.sample_id = s.id AND t.estado = 'completed'), 0) as ingresos
             FROM samples s WHERE s.creador_id = :userId AND s.estado = 'activo'
             ORDER BY s.total_descargas DESC LIMIT 10",
            ['userId' => $userId]
        );

        return new \WP_REST_Response(['data' => $samples], 200);
    }

    public static function transacciones(\WP_REST_Request $request): \WP_REST_Response
    {
        $userId = UsuarioHelper::obtenerIdPg();
        if (!$userId) return UsuarioHelper::respuestaNoEncontrado();

        $page = max(1, (int) $request->get_param('page'));
        $offset = ($page - 1) * 20;

        $transacciones = PostgresService::consultar(
            "SELECT t.id, t.created_at as fecha, t.monto, t.comision_plataforma as comision,
                    t.pago_creador as neto, t.estado, s.titulo as sample, u.username as comprador
             FROM transacciones t
             LEFT JOIN samples s ON t.sample_id = s.id
             LEFT JOIN usuarios_ext u ON t.comprador_id = u.id
             WHERE t.creador_id = :userId ORDER BY t.created_at DESC LIMIT 20 OFFSET :offset",
            ['userId' => $userId, 'offset' => $offset]
        );

        return new \WP_REST_Response(['data' => $transacciones], 200);
    }

    public static function ingresos(\WP_REST_Request $request): \WP_REST_Response
    {
        $userId = UsuarioHelper::obtenerIdPg();
        if (!$userId) return UsuarioHelper::respuestaNoEncontrado();

        $periodo = $request->get_param('periodo');
        $intervalo = match ($periodo) {
            'semana' => '7 days',
            'anio' => '365 days',
            default => '30 days',
        };

        $ingresos = PostgresService::consultar(
            "SELECT DATE(created_at) as fecha, COALESCE(SUM(pago_creador), 0) as monto
             FROM transacciones WHERE creador_id = :userId AND estado = 'completed'
             AND created_at >= NOW() - INTERVAL '{$intervalo}'
             GROUP BY DATE(created_at) ORDER BY fecha ASC",
            ['userId' => $userId]
        );

        return new \WP_REST_Response(['data' => $ingresos], 200);
    }
}
