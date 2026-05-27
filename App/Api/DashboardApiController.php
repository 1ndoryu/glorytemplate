<?php

/* sentinel-disable-file limite-lineas — controlador REST legacy del dashboard; agrupa rutas históricas hasta refactor de endpoints. */

/**
 * Dashboard API Controller
 *
 * Maneja los endpoints REST para el dashboard de productividad personal.
 * Solo endpoints core: cargar, guardar y sincronizar datos.
 *
 * Endpoints:
 * - GET  /wp-json/glory/v1/dashboard         -> Cargar datos del usuario
 * - POST /wp-json/glory/v1/dashboard         -> Guardar datos del usuario
 * - GET  /wp-json/glory/v1/dashboard/sync    -> Estado de sincronizacion
 * - GET  /wp-json/glory/v1/dashboard/changes -> Cambios incrementales
 * - POST /wp-json/glory/v1/dashboard/changes -> Push cambios
 *
 * @package App\Api
 */

namespace App\Api;

use App\Repository\DashboardRepository;
use App\Repository\BackupsRepository;
use App\Services\SuscripcionService;
use App\Services\UserTimeService;

class DashboardApiController
{
    private const API_NAMESPACE = 'glory/v1';

    public static function register(): void
    {
        add_action('rest_api_init', [self::class, 'registerRoutes']);
    }

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

        /* Endpoint de sincronizacion: Estado y timestamp */
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
                    'generateBackup' => [
                        'required' => false,
                        'validate_callback' => fn($param) => is_bool($param),
                    ],
                ],
            ],
        ]);
    }

    /**
     * Argumentos de validacion para el endpoint de guardado
     */
    /* [275A-1] Argumentos sin defaults destructivos.
     * ANTES: 'default' => [] hacía que WordPress inyectara arrays vacíos
     * cuando el cliente no enviaba un campo, causando soft-delete masivo
     * en los repositorios (sync-by-diff interpretaba [] como "borrar todo").
     * AHORA: Sin defaults, isset($data['habitos']) solo es true si el
     * cliente realmente envió esa clave. Los repositorios ignoran entidades
     * omitidas, procesando solo lo que viene explícitamente en la petición.
     */
    private static function getSaveArgs(): array
    {
        return [
            'habitos' => [
                'required' => false,
                'validate_callback' => fn($param) => is_array($param),
            ],
            'tareas' => [
                'required' => false,
                'validate_callback' => fn($param) => is_array($param),
            ],
            'proyectos' => [
                'required' => false,
                'validate_callback' => fn($param) => is_array($param),
            ],
            'notas' => [
                'required' => false,
                'validate_callback' => fn($param) => is_string($param) || is_array($param),
            ],
            'configuracion' => [
                'required' => false,
                'validate_callback' => fn($param) => is_array($param),
            ],
            'generateBackup' => [
                'required' => false,
                'validate_callback' => fn($param) => is_bool($param),
                'default' => false,
            ],
        ];
    }

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
        self::syncTimezoneFromRequest($userId, $request);

        try {
            $repository = new DashboardRepository($userId);
            $data = $repository->loadAll();

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
            error_log("[DashboardAPI] ERROR loadDashboard: " . $e->getMessage());
            return new \WP_REST_Response([
                'success' => false,
                'message' => 'Error al cargar datos. Contacta soporte si persiste.',
                'code' => 'load_error',
            ], 500);
        } catch (\Error $e) {
            error_log("[DashboardAPI] FATAL loadDashboard: " . $e->getMessage());
            return new \WP_REST_Response([
                'success' => false,
                'message' => 'Error inesperado. Contacta soporte.',
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
        self::syncTimezoneFromRequest($userId, $request);

        /* [275A-1] Construir $data solo con campos presentes en la petición.
         * ANTES: ?? [] convertía campos ausentes en arrays vacíos, causando
         * borrado masivo en los repositorios (sync-by-diff: [] = borrar todo).
         * AHORA: Solo se incluye en $data lo que el cliente envió explícitamente.
         * DashboardRepository::saveAll() usa isset() para saltar entidades omitidas.
         */
        $data = [];
        $habitos = $request->get_param('habitos');
        if ($habitos !== null) { $data['habitos'] = $habitos; }
        $tareas = $request->get_param('tareas');
        if ($tareas !== null) { $data['tareas'] = $tareas; }
        $proyectos = $request->get_param('proyectos');
        if ($proyectos !== null) { $data['proyectos'] = $proyectos; }
        $notas = $request->get_param('notas');
        if ($notas !== null) { $data['notas'] = $notas; }
        $configuracion = $request->get_param('configuracion');
        if ($configuracion !== null) { $data['configuracion'] = $configuracion; }

        $ayuno = $request->get_param('ayuno');
        if (is_array($ayuno)) {
            $data['ayuno'] = $ayuno;
        }
        $deficitCalorico = $request->get_param('deficitCalorico');
        if (is_array($deficitCalorico)) {
            $data['deficitCalorico'] = $deficitCalorico;
        }
        $generateBackup = (bool) $request->get_param('generateBackup');

        try {
            $repository = new DashboardRepository($userId);
            $suscripcionService = new SuscripcionService($userId);

            /* Validar limites del plan */
            $erroresLimite = $suscripcionService->validarLimites($data);
            if (!empty($erroresLimite)) {
                error_log("[DashboardAPI] Limites excedidos: " . json_encode($erroresLimite));
                return new \WP_REST_Response([
                    'success' => false,
                    'message' => 'Limites del plan excedidos',
                    'errors' => $erroresLimite,
                    'code' => 'plan_limit_exceeded',
                    'suscripcion' => $suscripcionService->getInfoCompleta(),
                ], 403);
            }

            /* Validar estructura de datos */
            $validation = $repository->validateData($data);
            if (!$validation['valid']) {
                error_log("[DashboardAPI] Validacion fallida: " . json_encode($validation['errors']));
                return new \WP_REST_Response([
                    'success' => false,
                    'message' => 'Datos invalidos',
                    'errors' => $validation['errors'],
                    'code' => 'validation_error',
                ], 400);
            }

            /* Guardar datos */
            $result = $repository->saveAll($data);

            if (!$result) {
                error_log("[DashboardAPI] saveAll devolvio false");
                return new \WP_REST_Response([
                    'success' => false,
                    'message' => 'Error al guardar datos',
                    'code' => 'save_error',
                ], 500);
            }

            /* Generar Backup Automatico (Solo Premium) */
            if ($generateBackup) {
                if ($suscripcionService->esPremium()) {
                    /* En saveDashboard, $data ya tiene (casi) todo, pero es mejor cargar lo consolidado o usar lo enviado si es completo */
                    /* loadAll asegura tener IDs generados y todo consistente */
                    $fullData = $repository->loadAll();
                    $backupsRepo = new BackupsRepository($userId);
                    $backupsRepo->create($fullData, 'auto_save');
                }
            }

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
            error_log("[DashboardAPI] ERROR saveDashboard: " . $e->getMessage());
            return new \WP_REST_Response([
                'success' => false,
                'message' => 'Error al guardar datos. Intenta de nuevo.',
                'code' => 'internal_error',
            ], 500);
        } catch (\Error $e) {
            error_log("[DashboardAPI] FATAL saveDashboard: " . $e->getMessage());
            return new \WP_REST_Response([
                'success' => false,
                'message' => 'Error inesperado. Contacta soporte.',
                'code' => 'fatal_error',
            ], 500);
        }
    }

    /**
     * Obtiene el estado de sincronizacion
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
            error_log("[DashboardAPI] ERROR getSyncStatus: " . $e->getMessage());
            return new \WP_REST_Response([
                'success' => false,
                'message' => 'Error al obtener estado de sincronización.',
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
            error_log("[DashboardAPI] ERROR getChangesSince: " . $e->getMessage());
            return new \WP_REST_Response([
                'success' => false,
                'message' => 'Error al obtener cambios.',
            ], 500);
        }
    }

    /**
     * Recibe cambios incrementales del cliente
     */
    public static function pushChanges(\WP_REST_Request $request): \WP_REST_Response
    {
        $userId = get_current_user_id();
        self::syncTimezoneFromRequest($userId, $request);
        $changes = $request->get_param('changes');
        $clientTimestamp = (int) $request->get_param('clientTimestamp');
        $generateBackup = (bool) $request->get_param('generateBackup');

        try {
            $repository = new DashboardRepository($userId);
            $result = $repository->applyChanges($changes, $clientTimestamp);

            /* Generar Backup Automatico (Solo Premium) */
            if ($generateBackup) {
                $suscripcionService = new SuscripcionService($userId);
                if ($suscripcionService->esPremium()) {
                    $fullData = $repository->loadAll();
                    $backupsRepo = new BackupsRepository($userId);
                    $backupsRepo->create($fullData, 'sync');
                }
            }

            return new \WP_REST_Response([
                'success' => true,
                'data' => $result,
                'meta' => [
                    'appliedChanges' => count($changes),
                    'serverTimestamp' => time() * 1000,
                ],
            ], 200);
        } catch (\Exception $e) {
            error_log("[DashboardAPI] ERROR pushChanges: " . $e->getMessage());
            return new \WP_REST_Response([
                'success' => false,
                'message' => 'Error al aplicar cambios.',
            ], 500);
        }
    }

    private static function syncTimezoneFromRequest(int $userId, \WP_REST_Request $request): void
    {
        $timezone = $request->get_header('X-Glory-Timezone') ?: $request->get_param('timezone');
        UserTimeService::syncFromClient($userId, $timezone, 'dashboard');
    }
}

DashboardApiController::register();
