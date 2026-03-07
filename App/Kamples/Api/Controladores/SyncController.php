<?php

/**
 * SyncController — Endpoints para sync desktop (Tauri).
 *
 * Provee datos optimizados para sincronización basada en colecciones.
 * El desktop usa estos endpoints para construir la estructura de carpetas local.
 *
 * Endpoints:
 *   GET /me/sync/colecciones — Colecciones del usuario con samples (para sync completo)
 *   GET /me/sync/delta       — Cambios incrementales desde cursor (para delta sync)
 *
 * @package Kamples
 */

namespace App\Kamples\Api\Controladores;

use App\Kamples\Auth\AuthMiddleware;
use App\Kamples\Api\Helpers\UsuarioHelper;
use App\Kamples\Database\Repositories\SyncRepository;
use App\Kamples\Database\Repositories\SyncChangelogRepository;
use App\Config\Schema\_generated\ColeccionesCols;
use App\Kamples\KamplesLogger;

class SyncController
{
    public static function registrarRutas(string $namespace): void
    {
        register_rest_route($namespace, '/me/sync/colecciones', [
            'methods'             => 'GET',
            'callback'            => [self::class, 'coleccionesParaSync'],
            'permission_callback' => [AuthMiddleware::class, 'requerirAuth'],
        ]);

        register_rest_route($namespace, '/me/sync/delta', [
            'methods'             => 'GET',
            'callback'            => [self::class, 'delta'],
            'permission_callback' => [AuthMiddleware::class, 'requerirAuth'],
        ]);
    }

    /**
     * GET /me/sync/colecciones
     *
     * Retorna colecciones del usuario con samples mínimos para sync.
     * El desktop compara contra su índice local y descarga diferencias.
     *
     * Respuesta:
     * {
     *   colecciones: [{ id, nombre, samples: [{ id, titulo, formato, tamano }] }],
     *   sinColeccion: [{ id, titulo, formato, tamano }]
     * }
     */
    public static function coleccionesParaSync(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            $userId = UsuarioHelper::obtenerIdPg();
            if (!$userId) {
                return UsuarioHelper::respuestaNoEncontrado();
            }

            $coleccionesRaw = SyncRepository::coleccionesConSamples($userId);
            $sinColeccion = SyncRepository::descargasSinColeccion($userId);

            /* Parsear samples_json (viene como string JSON de PostgreSQL) */
            $colecciones = array_map(function (array $col): array {
                $samplesJson = $col['samples_json'] ?? '[]';
                $samples = is_string($samplesJson) ? json_decode($samplesJson, true) : $samplesJson;

                if (json_last_error() !== JSON_ERROR_NONE) {
                    KamplesLogger::error('SyncController: Error parseando samples_json', [
                        'coleccion_id' => $col['id'] ?? null,
                        'json_error'   => json_last_error_msg(),
                    ]);
                    $samples = [];
                }

                return [
                    'id'        => (int) $col['id'],
                    'nombre'    => $col['nombre'],
                    'parent_id' => isset($col[ColeccionesCols::PARENT_ID]) ? (int) $col[ColeccionesCols::PARENT_ID] : null,
                    'samples'   => array_map(fn(array $s): array => [
                        'id'         => (int) $s['id'],
                        'titulo'     => $s['titulo'],
                        'formato'    => $s['formato'],
                        'tamano'     => (int) ($s['tamano'] ?? 0),
                        'imagen_url' => $s['imagen_url'] ?? null,
                    ], $samples ?? []),
                ];
            }, $coleccionesRaw);

            /* Normalizar sinColeccion (ya viene plano del repo) */
            $sinColeccionNorm = array_map(fn(array $s): array => [
                'id'         => (int) $s['id'],
                'titulo'     => $s['titulo'],
                'formato'    => $s['formato'],
                'tamano'     => (int) ($s['tamano'] ?? 0),
                'imagen_url' => $s['imagen_url'] ?? null,
            ], $sinColeccion);

            return new \WP_REST_Response([
                'data' => [
                    'colecciones'  => $colecciones,
                    'sinColeccion' => $sinColeccionNorm,
                ],
            ], 200);
        } catch (\Throwable $e) {
            KamplesLogger::error('Error en SyncController::coleccionesParaSync', [
                'error' => $e->getMessage(),
            ]);
            return new \WP_REST_Response([
                'code'    => 'error_interno',
                'message' => 'Error interno del servidor',
            ], 500);
        }
    }

    /**
     * GET /me/sync/delta?cursor={last_id}
     *
     * Retorna cambios incrementales desde el cursor dado.
     * Si cursor=0 o cursor invalido (purgado), retorna fullSyncRequired=true
     * y el cliente debe hacer full sync con /me/sync/colecciones.
     *
     * Respuesta:
     * {
     *   cambios: [{ id, tipo, entidadId, metadata, createdAt }],
     *   cursor: number,
     *   hayMas: boolean,
     *   fullSyncRequired: boolean
     * }
     */
    public static function delta(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            $userId = UsuarioHelper::obtenerIdPg();
            if (!$userId) {
                return UsuarioHelper::respuestaNoEncontrado();
            }

            $cursor = (int) ($request->get_param('cursor') ?? 0);
            $limite = (int) ($request->get_param('limite') ?? 100);

            /* Acotar limite entre 1 y 500 para evitar abusos */
            $limite = max(1, min(500, $limite));

            $resultado = SyncChangelogRepository::obtenerDelta($userId, $cursor, $limite);

            return new \WP_REST_Response([
                'data' => $resultado,
            ], 200);
        } catch (\Throwable $e) {
            KamplesLogger::error('Error en SyncController::delta', [
                'error' => $e->getMessage(),
            ]);
            return new \WP_REST_Response([
                'code'    => 'error_interno',
                'message' => 'Error interno del servidor',
            ], 500);
        }
    }
}
