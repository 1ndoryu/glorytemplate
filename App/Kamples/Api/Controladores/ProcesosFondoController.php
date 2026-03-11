<?php

/*
 * Controller: ProcesosFondoController
 * Endpoints admin para gestionar procesos de fondo (scraping, extraccion, seed).
 * Delega toda la logica a GestorProcesosFondo (SRP).
 *
 * GET  /admin/procesos           — Estado de todos los procesos
 * GET  /admin/procesos/{nombre}  — Estado de un proceso especifico
 * POST /admin/procesos/{nombre}/start — Iniciar proceso
 * POST /admin/procesos/{nombre}/stop  — Detener proceso
 */

namespace App\Kamples\Api\Controladores;

use App\Kamples\Auth\AuthMiddleware;
use App\Kamples\Services\GestorProcesosFondo;
use App\Kamples\KamplesLogger;

class ProcesosFondoController
{
    /* Nombres validos de proceso (whitelist) */
    private const NOMBRES_VALIDOS = ['scraping', 'extraccion', 'seed'];

    public static function registrarRutas(string $namespace): void
    {
        $admin = [AuthMiddleware::class, 'requerirAdmin'];

        \register_rest_route($namespace, '/admin/procesos', [
            'methods'             => 'GET',
            'callback'            => [self::class, 'listarTodos'],
            'permission_callback' => $admin,
        ]);

        \register_rest_route($namespace, '/admin/procesos/(?P<nombre>[a-z_]+)', [
            'methods'             => 'GET',
            'callback'            => [self::class, 'estado'],
            'permission_callback' => $admin,
            'args'                => self::argsNombre(),
        ]);

        \register_rest_route($namespace, '/admin/procesos/(?P<nombre>[a-z_]+)/start', [
            'methods'             => 'POST',
            'callback'            => [self::class, 'iniciar'],
            'permission_callback' => $admin,
            'args'                => \array_merge(self::argsNombre(), [
                'limit' => [
                    'type'    => 'integer',
                    'default' => 0,
                    'minimum' => 0,
                    'maximum' => 500,
                ],
            ]),
        ]);

        \register_rest_route($namespace, '/admin/procesos/(?P<nombre>[a-z_]+)/stop', [
            'methods'             => 'POST',
            'callback'            => [self::class, 'detener'],
            'permission_callback' => $admin,
            'args'                => self::argsNombre(),
        ]);
    }

    public static function listarTodos(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            return new \WP_REST_Response([
                'ok'       => true,
                'procesos' => GestorProcesosFondo::estadoTodos(),
            ], 200);
        } catch (\Throwable $e) {
            KamplesLogger::error('[Procesos] Error listando procesos', ['error' => $e->getMessage()]);
            return new \WP_REST_Response(['ok' => false, 'error' => 'Error interno.'], 500);
        }
    }

    public static function estado(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            $nombre = $request->get_param('nombre');
            return new \WP_REST_Response([
                'ok'      => true,
                'proceso' => GestorProcesosFondo::estadoProceso($nombre),
            ], 200);
        } catch (\InvalidArgumentException $e) {
            return new \WP_REST_Response(['ok' => false, 'error' => $e->getMessage()], 400);
        } catch (\Throwable $e) {
            KamplesLogger::error('[Procesos] Error obteniendo estado', ['error' => $e->getMessage()]);
            return new \WP_REST_Response(['ok' => false, 'error' => 'Error interno.'], 500);
        }
    }

    public static function iniciar(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            $nombre = $request->get_param('nombre');
            $limit  = (int) $request->get_param('limit');

            $opciones = [];
            if ($limit > 0) {
                $opciones['limit'] = $limit;
            }

            $resultado = GestorProcesosFondo::iniciar($nombre, $opciones);

            $status = ($resultado['ok'] ?? false) ? 200 : 409;
            return new \WP_REST_Response($resultado, $status);
        } catch (\InvalidArgumentException $e) {
            return new \WP_REST_Response(['ok' => false, 'error' => $e->getMessage()], 400);
        } catch (\Throwable $e) {
            KamplesLogger::error('[Procesos] Error iniciando proceso', ['error' => $e->getMessage()]);
            return new \WP_REST_Response(['ok' => false, 'error' => 'Error interno.'], 500);
        }
    }

    public static function detener(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            $nombre   = $request->get_param('nombre');
            $resultado = GestorProcesosFondo::detener($nombre);

            return new \WP_REST_Response($resultado, 200);
        } catch (\InvalidArgumentException $e) {
            return new \WP_REST_Response(['ok' => false, 'error' => $e->getMessage()], 400);
        } catch (\Throwable $e) {
            KamplesLogger::error('[Procesos] Error deteniendo proceso', ['error' => $e->getMessage()]);
            return new \WP_REST_Response(['ok' => false, 'error' => 'Error interno.'], 500);
        }
    }

    private static function argsNombre(): array
    {
        return [
            'nombre' => [
                'type'              => 'string',
                'required'          => true,
                'sanitize_callback' => 'sanitize_key',
                'validate_callback' => static function (string $v): bool {
                    return \in_array($v, self::NOMBRES_VALIDOS, true);
                },
            ],
        ];
    }
}
