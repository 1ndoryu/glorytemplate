<?php

/**
 * AlgoTimingController — Historial de timing del algoritmo de feed.
 *
 * GET    /kamples/v1/admin/algo-timing  — Retorna historial completo (admin)
 * DELETE /kamples/v1/admin/algo-timing  — Limpia historial (admin)
 *
 * [2003A-3] Creado para exponer el historial de AlgoTimingLogger al frontend
 * y permitir el modal de métricas en el menu contextual de perfil.
 *
 * @package Kamples
 */

namespace App\Kamples\Api\Controladores;

use App\Kamples\Auth\AuthMiddleware;
use App\Kamples\Services\AlgoTimingLogger;

class AlgoTimingController
{
    public static function registrarRutas(string $namespace): void
    {
        $admin = [AuthMiddleware::class, 'requerirAdmin'];

        \register_rest_route($namespace, '/admin/algo-timing', [
            [
                'methods'             => 'GET',
                'callback'            => [self::class, 'obtener'],
                'permission_callback' => $admin,
            ],
            [
                'methods'             => 'DELETE',
                'callback'            => [self::class, 'limpiar'],
                'permission_callback' => $admin,
            ],
        ]);
    }

    public static function obtener(\WP_REST_Request $request): \WP_REST_Response
    {
        return new \WP_REST_Response([
            'ok'       => true,
            'historial' => AlgoTimingLogger::obtenerHistorial(),
        ], 200);
    }

    public static function limpiar(\WP_REST_Request $request): \WP_REST_Response
    {
        AlgoTimingLogger::limpiarHistorial();
        return new \WP_REST_Response(['ok' => true], 200);
    }
}
