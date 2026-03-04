<?php

/**
 * SyncController — Endpoints para sync desktop (Tauri).
 *
 * Provee datos optimizados para sincronización basada en colecciones.
 * El desktop usa estos endpoints para construir la estructura de carpetas local.
 *
 * Endpoints:
 *   GET /me/sync/colecciones — Colecciones del usuario con samples (para sync completo)
 *
 * @package Kamples
 */

namespace App\Kamples\Api\Controladores;

use App\Kamples\Auth\AuthMiddleware;
use App\Kamples\Api\Helpers\UsuarioHelper;
use App\Kamples\Database\Repositories\SyncRepository;
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
}
