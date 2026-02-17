<?php

/**
 * DiagnosticoController — Endpoints de health check y debug.
 *
 * @package Kamples
 */

namespace App\Kamples\Api\Controladores;

use App\Kamples\Database\PostgresService;
use App\Kamples\Database\VerificarPgvector;
use App\Kamples\Auth\AuthMiddleware;
use App\Kamples\Api\Helpers\UsuarioHelper;

class DiagnosticoController
{
    /**
     * Registra las rutas de diagnóstico.
     */
    public static function registrarRutas(string $namespace): void
    {
        register_rest_route($namespace, '/health', [
            'methods'             => 'GET',
            'callback'            => [self::class, 'health'],
            'permission_callback' => '__return_true',
        ]);

        /* S13: Solo admin puede ver info de BD (prevenir info disclosure) */
        register_rest_route($namespace, '/debug/pgvector', [
            'methods'             => 'GET',
            'callback'            => [self::class, 'verificarPgvector'],
            'permission_callback' => [AuthMiddleware::class, 'requerirAuth'],
        ]);
    }

    /**
     * GET /health — Estado de conexión a Postgres.
     */
    public static function health(): \WP_REST_Response
    {
        $conectado = PostgresService::estaConectado();

        return new \WP_REST_Response([
            'status'   => $conectado ? 'ok' : 'error',
            'database' => $conectado ? 'connected' : 'disconnected',
            'version'  => '1.0.0',
            'time'     => current_time('mysql'),
        ], $conectado ? 200 : 503);
    }

    /**
     * GET /debug/pgvector — Verificación de pgvector.
     */
    public static function verificarPgvector(): \WP_REST_Response
    {
        /* S13: Solo admin puede ver info interna de BD */
        if (!UsuarioHelper::esAdmin()) {
            return new \WP_REST_Response(['code' => 'sin_permisos', 'message' => 'Solo administradores.'], 403);
        }

        $resultados = VerificarPgvector::ejecutar();
        $todosOk = true;

        foreach ($resultados as $check) {
            if (!$check['ok']) {
                $todosOk = false;
                break;
            }
        }

        return new \WP_REST_Response([
            'status'  => $todosOk ? 'ok' : 'error',
            'checks'  => $resultados,
            'resumen' => $todosOk
                ? 'pgvector funcional — conexión, extensión, tabla e índice OK'
                : 'Hay errores en la configuración de pgvector',
        ], $todosOk ? 200 : 503);
    }
}
