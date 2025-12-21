<?php

/**
 * Dashboard API Controller
 *
 * Maneja los endpoints REST para el dashboard de productividad personal.
 * Permite guardar y cargar datos del usuario (hábitos, tareas, notas, proyectos).
 *
 * Endpoints:
 * - GET  /wp-json/glory/v1/dashboard       → Cargar datos del usuario
 * - POST /wp-json/glory/v1/dashboard       → Guardar datos del usuario
 * - GET  /wp-json/glory/v1/dashboard/sync  → Estado de sincronización
 *
 * @package App\Api
 */

namespace App\Api;

use App\Repository\DashboardRepository;

class DashboardApiController
{
    private const API_NAMESPACE = 'glory/v1';

    /**
     * Registra los endpoints REST
     */
    public static function register(): void
    {
        add_action('rest_api_init', [self::class, 'registerRoutes']);
    }

    /**
     * Define las rutas REST
     */
    public static function registerRoutes(): void
    {
        /* Endpoint principal: Cargar datos */
        register_rest_route(self::API_NAMESPACE, '/dashboard', [
            [
                'methods' => \WP_REST_Server::READABLE,
                'callback' => [self::class, 'loadDashboard'],
                'permission_callback' => [self::class, 'requireAuthentication'],
            ],
            [
                'methods' => \WP_REST_Server::CREATABLE,
                'callback' => [self::class, 'saveDashboard'],
                'permission_callback' => [self::class, 'requireAuthentication'],
                'args' => self::getSaveArgs(),
            ],
        ]);

        /* Endpoint de sincronización: Estado y timestamp */
        register_rest_route(self::API_NAMESPACE, '/dashboard/sync', [
            'methods' => \WP_REST_Server::READABLE,
            'callback' => [self::class, 'getSyncStatus'],
            'permission_callback' => [self::class, 'requireAuthentication'],
        ]);

        /* Endpoint incremental: Solo cambios desde timestamp */
        register_rest_route(self::API_NAMESPACE, '/dashboard/changes', [
            [
                'methods' => \WP_REST_Server::READABLE,
                'callback' => [self::class, 'getChangesSince'],
                'permission_callback' => [self::class, 'requireAuthentication'],
                'args' => [
                    'since' => [
                        'required' => true,
                        'validate_callback' => fn($param) => is_numeric($param),
                        'sanitize_callback' => 'absint',
                    ],
                ],
            ],
            [
                'methods' => \WP_REST_Server::CREATABLE,
                'callback' => [self::class, 'pushChanges'],
                'permission_callback' => [self::class, 'requireAuthentication'],
                'args' => [
                    'changes' => [
                        'required' => true,
                        'validate_callback' => fn($param) => is_array($param),
                    ],
                    'clientTimestamp' => [
                        'required' => true,
                        'validate_callback' => fn($param) => is_numeric($param),
                    ],
                ],
            ],
        ]);
    }

    /**
     * Argumentos de validación para el endpoint de guardado
     */
    private static function getSaveArgs(): array
    {
        return [
            'habitos' => [
                'required' => false,
                'validate_callback' => fn($param) => is_array($param),
                'default' => [],
            ],
            'tareas' => [
                'required' => false,
                'validate_callback' => fn($param) => is_array($param),
                'default' => [],
            ],
            'proyectos' => [
                'required' => false,
                'validate_callback' => fn($param) => is_array($param),
                'default' => [],
            ],
            'notas' => [
                'required' => false,
                'validate_callback' => fn($param) => is_string($param) || is_array($param),
                'default' => '',
            ],
            'configuracion' => [
                'required' => false,
                'validate_callback' => fn($param) => is_array($param),
                'default' => [],
            ],
        ];
    }

    /**
     * Verifica que el usuario esté autenticado
     */
    public static function requireAuthentication(): bool
    {
        return is_user_logged_in();
    }

    /**
     * Carga todos los datos del dashboard del usuario actual
     */
    public static function loadDashboard(\WP_REST_Request $request): \WP_REST_Response
    {
        $userId = get_current_user_id();

        try {
            error_log("[DashboardAPI] loadDashboard iniciado para userId: $userId");

            $repository = new DashboardRepository($userId);
            error_log("[DashboardAPI] Repository creado");

            $data = $repository->loadAll();
            error_log("[DashboardAPI] loadAll completado");

            return new \WP_REST_Response([
                'success' => true,
                'data' => $data,
                'meta' => [
                    'userId' => $userId,
                    'loadedAt' => current_time('c'),
                    'serverTimestamp' => time() * 1000,
                ],
            ], 200);
        } catch (\Exception $e) {
            error_log("[DashboardAPI] ERROR: " . $e->getMessage());
            error_log("[DashboardAPI] TRACE: " . $e->getTraceAsString());
            return new \WP_REST_Response([
                'success' => false,
                'message' => 'Error al cargar datos: ' . $e->getMessage(),
                'code' => 'load_error',
            ], 500);
        } catch (\Error $e) {
            error_log("[DashboardAPI] FATAL ERROR: " . $e->getMessage());
            error_log("[DashboardAPI] TRACE: " . $e->getTraceAsString());
            return new \WP_REST_Response([
                'success' => false,
                'message' => 'Error fatal: ' . $e->getMessage(),
                'code' => 'fatal_error',
            ], 500);
        }
    }

    /**
     * Guarda los datos del dashboard del usuario actual
     */
    public static function saveDashboard(\WP_REST_Request $request): \WP_REST_Response
    {
        $userId = get_current_user_id();
        error_log("[DashboardAPI] saveDashboard iniciado para userId: $userId");

        $data = [
            'habitos' => $request->get_param('habitos') ?? [],
            'tareas' => $request->get_param('tareas') ?? [],
            'proyectos' => $request->get_param('proyectos') ?? [],
            'notas' => $request->get_param('notas') ?? '',
            'configuracion' => $request->get_param('configuracion') ?? [],
        ];

        error_log("[DashboardAPI] Datos recibidos - habitos:" . count($data['habitos']) . " tareas:" . count($data['tareas']) . " proyectos:" . count($data['proyectos']));

        try {
            $repository = new DashboardRepository($userId);
            error_log("[DashboardAPI] Repository creado para save");

            /* Validar estructura de datos */
            $validation = $repository->validateData($data);
            if (!$validation['valid']) {
                error_log("[DashboardAPI] Validacion fallida: " . json_encode($validation['errors']));
                return new \WP_REST_Response([
                    'success' => false,
                    'message' => 'Datos inválidos',
                    'errors' => $validation['errors'],
                    'code' => 'validation_error',
                ], 400);
            }

            error_log("[DashboardAPI] Validacion OK, guardando...");

            /* Guardar datos */
            $result = $repository->saveAll($data);
            error_log("[DashboardAPI] saveAll resultado: " . ($result ? 'true' : 'false'));

            if (!$result) {
                return new \WP_REST_Response([
                    'success' => false,
                    'message' => 'Error al guardar datos',
                    'code' => 'save_error',
                ], 500);
            }

            error_log("[DashboardAPI] saveDashboard completado exitosamente");

            return new \WP_REST_Response([
                'success' => true,
                'message' => 'Datos guardados correctamente',
                'meta' => [
                    'userId' => $userId,
                    'savedAt' => current_time('c'),
                    'serverTimestamp' => time() * 1000,
                    'counts' => [
                        'habitos' => count($data['habitos']),
                        'tareas' => count($data['tareas']),
                        'proyectos' => count($data['proyectos']),
                    ],
                ],
            ], 200);
        } catch (\Exception $e) {
            error_log("[DashboardAPI] SAVE ERROR: " . $e->getMessage());
            error_log("[DashboardAPI] SAVE TRACE: " . $e->getTraceAsString());
            return new \WP_REST_Response([
                'success' => false,
                'message' => 'Error interno: ' . $e->getMessage(),
                'code' => 'internal_error',
            ], 500);
        } catch (\Error $e) {
            error_log("[DashboardAPI] SAVE FATAL ERROR: " . $e->getMessage());
            error_log("[DashboardAPI] SAVE TRACE: " . $e->getTraceAsString());
            return new \WP_REST_Response([
                'success' => false,
                'message' => 'Error fatal: ' . $e->getMessage(),
                'code' => 'fatal_error',
            ], 500);
        }
    }

    /**
     * Obtiene el estado de sincronización
     */
    public static function getSyncStatus(\WP_REST_Request $request): \WP_REST_Response
    {
        $userId = get_current_user_id();

        try {
            $repository = new DashboardRepository($userId);
            $status = $repository->getSyncStatus();

            return new \WP_REST_Response([
                'success' => true,
                'data' => $status,
            ], 200);
        } catch (\Exception $e) {
            return new \WP_REST_Response([
                'success' => false,
                'message' => 'Error al obtener estado: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Obtiene cambios desde un timestamp (sync incremental)
     */
    public static function getChangesSince(\WP_REST_Request $request): \WP_REST_Response
    {
        $userId = get_current_user_id();
        $since = (int) $request->get_param('since');

        try {
            $repository = new DashboardRepository($userId);
            $changes = $repository->getChangesSince($since);

            return new \WP_REST_Response([
                'success' => true,
                'data' => $changes,
                'meta' => [
                    'since' => $since,
                    'serverTimestamp' => time() * 1000,
                ],
            ], 200);
        } catch (\Exception $e) {
            return new \WP_REST_Response([
                'success' => false,
                'message' => 'Error al obtener cambios: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Recibe cambios incrementales del cliente
     */
    public static function pushChanges(\WP_REST_Request $request): \WP_REST_Response
    {
        $userId = get_current_user_id();
        $changes = $request->get_param('changes');
        $clientTimestamp = (int) $request->get_param('clientTimestamp');

        try {
            $repository = new DashboardRepository($userId);
            $result = $repository->applyChanges($changes, $clientTimestamp);

            return new \WP_REST_Response([
                'success' => true,
                'data' => $result,
                'meta' => [
                    'appliedChanges' => count($changes),
                    'serverTimestamp' => time() * 1000,
                ],
            ], 200);
        } catch (\Exception $e) {
            return new \WP_REST_Response([
                'success' => false,
                'message' => 'Error al aplicar cambios: ' . $e->getMessage(),
            ], 500);
        }
    }
}

/* Registrar el controlador automáticamente */
DashboardApiController::register();
