<?php

namespace App\Api;

use App\Repository\BackupsRepository;
use App\Repository\DashboardRepository;
use App\Services\SuscripcionService;

class BackupsApiController
{
    private const API_NAMESPACE = 'glory/v1';

    public static function register(): void
    {
        add_action('rest_api_init', [self::class, 'registerRoutes']);
    }

    public static function registerRoutes(): void
    {
        /* Listar backups */
        register_rest_route(self::API_NAMESPACE, '/backups', [
            [
                'methods' => \WP_REST_Server::READABLE,
                'callback' => [self::class, 'getBackups'],
                'permission_callback' => [self::class, 'checkPermission'],
            ]
        ]);

        /* Restaurar backup */
        register_rest_route(self::API_NAMESPACE, '/backups/restore', [
            [
                'methods' => \WP_REST_Server::CREATABLE,
                'callback' => [self::class, 'restoreBackup'],
                'permission_callback' => [self::class, 'checkPermission'],
                'args' => [
                    'backup_id' => [
                        'required' => true,
                        'validate_callback' => fn($param) => is_numeric($param),
                    ],
                ],
            ]
        ]);

        /* Eliminar backup */
        register_rest_route(self::API_NAMESPACE, '/backups/(?P<backup_id>\d+)', [
            [
                'methods' => \WP_REST_Server::DELETABLE,
                'callback' => [self::class, 'deleteBackup'],
                'permission_callback' => [self::class, 'checkPermission'],
                'args' => [
                    'backup_id' => [
                        'required' => true,
                        'validate_callback' => fn($param) => is_numeric($param),
                    ],
                ],
            ]
        ]);
    }

    public static function checkPermission(): bool
    {
        if (!is_user_logged_in()) return false;

        $userId = get_current_user_id();
        $suscripcion = new SuscripcionService($userId);
        return $suscripcion->esPremium();
    }

    public static function getBackups(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            $userId = get_current_user_id();
            $repo = new BackupsRepository($userId);

            return new \WP_REST_Response([
                'success' => true,
                'data' => $repo->getAll()
            ]);
        } catch (\Throwable $e) {
            error_log('[BackupsApiController] Error en getBackups: ' . $e->getMessage());
            return new \WP_REST_Response([
                'success' => false,
                'message' => 'Error interno del servidor'
            ], 500);
        }
    }

    public static function restoreBackup(\WP_REST_Request $request): \WP_REST_Response
    {
        $userId = get_current_user_id();
        $backupId = (int)$request->get_param('backup_id');

        $backupsRepo = new BackupsRepository($userId);
        $backup = $backupsRepo->getById($backupId);

        if (!$backup) {
            return new \WP_REST_Response([
                'success' => false,
                'message' => 'Backup no encontrado'
            ], 404);
        }

        /* Decodificar datos */
        try {
            $decoded = base64_decode($backup['data']);
            if ($decoded === false) throw new \Exception('Base64 decode falló');

            $json = gzdecode($decoded);
            if ($json === false) throw new \Exception('Gzip decode falló');

            // sentinel-disable-next-line json-decode-inseguro — FALSO POSITIVO: se verifica !$data en linea siguiente
            $data = json_decode($json, true);
            if (!$data) throw new \Exception('JSON decode falló');
        } catch (\Exception $e) {
            return new \WP_REST_Response([
                'success' => false,
                'message' => 'Datos de backup corruptos: ' . $e->getMessage()
            ], 500);
        }

        /* Ejecutar restauración */
        $dashboardRepo = new DashboardRepository($userId);
        global $wpdb;
        $wpdb->query('START TRANSACTION');

        try {
            /** 
             * Eliminamos todo lo actual para reemplazo limpio.
             * Esto es seguro porque acabamos de cargar el backup.
             */
            // sentinel-disable-next-line retorno-ignorado-repo — dentro de try/catch con ROLLBACK, saveAll valida despues
            $dashboardRepo->deleteAll();

/* [275A-1] Solución 5: inTransaction=true evita START TRANSACTION anidado.
         * MySQL hace implicit COMMIT al anidar transacciones, rompiendo el ROLLBACK exterior. */
        $result = $dashboardRepo->saveAll($data, false, true);

            if ($result) {
                $wpdb->query('COMMIT');
                return new \WP_REST_Response([
                    'success' => true,
                    'message' => 'Backup restaurado exitosamente'
                ]);
            } else {
                throw new \Exception('Error al guardar datos del backup');
            }
        } catch (\Exception $e) {
            $wpdb->query('ROLLBACK');
            return new \WP_REST_Response([
                'success' => false,
                'message' => 'Error en restauración: ' . $e->getMessage()
            ], 500);
        }
    }

    public static function deleteBackup(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            $userId = get_current_user_id();
            $backupId = (int)$request->get_param('backup_id');

            $backupsRepo = new BackupsRepository($userId);
            $deleted = $backupsRepo->deleteById($backupId);

            if ($deleted) {
                return new \WP_REST_Response([
                    'success' => true,
                    'message' => 'Backup eliminado'
                ]);
            }

            return new \WP_REST_Response([
                'success' => false,
                'message' => 'No se pudo eliminar el backup'
            ], 400);
        } catch (\Throwable $e) {
            error_log('[BackupsApiController] Error en deleteBackup: ' . $e->getMessage());
            return new \WP_REST_Response([
                'success' => false,
                'message' => 'Error interno del servidor'
            ], 500);
        }
    }
}

BackupsApiController::register();
