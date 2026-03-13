<?php

/**
 * DuplicadosController — Panel de moderacion de duplicados (D5).
 *
 * Endpoints admin-only:
 *   GET  /admin/duplicados               — Listar duplicados pendientes
 *   GET  /admin/duplicados/contar        — Contar pendientes (badge)
 *   POST /admin/duplicados/{id}/fusionar — Fusionar: conservar original, eliminar duplicado
 *   POST /admin/duplicados/{id}/aprobar  — Aprobar: ambos coexisten (no duplicado real)
 *   POST /admin/duplicados/{id}/rechazar — Rechazar: eliminar duplicado
 *   POST /admin/duplicados/{id}/intercambiar — Invertir + fusionar
 *
 * @package Kamples
 */

namespace App\Kamples\Api\Controladores;

use App\Kamples\Database\Repositories\DuplicadosPendientesRepository;
use App\Kamples\Auth\AuthMiddleware;
use App\Kamples\Api\Helpers\UsuarioHelper;
use App\Kamples\Api\Helpers\NormalizadorSample;
use App\Config\Schema\_generated\DuplicadosPendientesEnums;
use App\Kamples\Services\BackfillHashService;
use App\Kamples\KamplesLogger;

class DuplicadosController
{
    public static function registrarRutas(string $namespace): void
    {
        $admin = [AuthMiddleware::class, 'requerirAdmin'];

        register_rest_route($namespace, '/admin/duplicados', [
            'methods' => 'GET',
            'callback' => [self::class, 'listar'],
            'permission_callback' => $admin,
        ]);

        register_rest_route($namespace, '/admin/duplicados/contar', [
            'methods' => 'GET',
            'callback' => [self::class, 'contar'],
            'permission_callback' => $admin,
        ]);

        register_rest_route($namespace, '/admin/duplicados/(?P<id>\d+)/fusionar', [
            'methods' => 'POST',
            'callback' => [self::class, 'fusionar'],
            'permission_callback' => $admin,
        ]);

        register_rest_route($namespace, '/admin/duplicados/(?P<id>\d+)/aprobar', [
            'methods' => 'POST',
            'callback' => [self::class, 'aprobar'],
            'permission_callback' => $admin,
        ]);

        register_rest_route($namespace, '/admin/duplicados/(?P<id>\d+)/rechazar', [
            'methods' => 'POST',
            'callback' => [self::class, 'rechazar'],
            'permission_callback' => $admin,
        ]);

        register_rest_route($namespace, '/admin/duplicados/(?P<id>\d+)/intercambiar', [
            'methods' => 'POST',
            'callback' => [self::class, 'intercambiar'],
            'permission_callback' => $admin,
        ]);

        register_rest_route($namespace, '/admin/duplicados/backfill', [
            'methods' => 'POST',
            'callback' => [self::class, 'backfill'],
            'permission_callback' => $admin,
        ]);
    }

    /**
     * GET /admin/duplicados — Lista paginada con filtros.
     */
    public static function listar(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            $estado = \sanitize_text_field($request->get_param('estado') ?? DuplicadosPendientesEnums::ESTADO_PENDIENTE);
            $tipo = $request->get_param('tipo') ? \sanitize_text_field($request->get_param('tipo')) : null;
            $pagina = \max(1, (int) ($request->get_param('pagina') ?? 1));
            $porPagina = \min(50, \max(1, (int) ($request->get_param('porPagina') ?? 20)));

            /* Validar estado */
            if (!\in_array($estado, DuplicadosPendientesEnums::TODOS_ESTADO, true)) {
                $estado = DuplicadosPendientesEnums::ESTADO_PENDIENTE;
            }

            $duplicados = DuplicadosPendientesRepository::listar($estado, $tipo, $pagina, $porPagina);
            $total = DuplicadosPendientesRepository::contarPendientes();

            /* Convertir rutas filesystem a URLs HTTP para previews de audio */
            $duplicados = array_map([self::class, 'normalizarRutasPreview'], $duplicados);

            return new \WP_REST_Response([
                'ok' => true,
                'total' => $total,
                'pagina' => $pagina,
                'porPagina' => $porPagina,
                'duplicados' => $duplicados,
            ]);
        } catch (\Throwable $e) {
            KamplesLogger::error('DuplicadosController: Error listando', ['error' => $e->getMessage()]);
            return new \WP_REST_Response(['ok' => false, 'error' => 'Error interno'], 500);
        }
    }

    /**
     * GET /admin/duplicados/contar — Total de pendientes (para badge en nav).
     */
    public static function contar(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            $total = DuplicadosPendientesRepository::contarPendientes();
            return new \WP_REST_Response(['ok' => true, 'total' => $total]);
        } catch (\Throwable $e) {
            KamplesLogger::error('DuplicadosController: Error contando', ['error' => $e->getMessage()]);
            return new \WP_REST_Response(['ok' => false, 'error' => 'Error interno'], 500);
        }
    }

    /**
     * POST /admin/duplicados/{id}/fusionar — Conservar original, transferir relaciones, eliminar duplicado.
     */
    public static function fusionar(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            $registroId = (int) $request->get_param('id');
            $adminId = UsuarioHelper::obtenerIdPg();
            if (!$adminId) return UsuarioHelper::respuestaNoEncontrado();

            $ok = DuplicadosPendientesRepository::fusionar($registroId, $adminId);

            if (!$ok) {
                return new \WP_REST_Response(['ok' => false, 'error' => 'Registro no encontrado'], 404);
            }

            KamplesLogger::info('DuplicadosController: Fusionado', ['registroId' => $registroId, 'adminId' => $adminId]);
            return new \WP_REST_Response(['ok' => true, 'accion' => 'fusionado']);
        } catch (\Throwable $e) {
            KamplesLogger::error('DuplicadosController: Error fusionando', ['id' => $request->get_param('id'), 'error' => $e->getMessage()]);
            return new \WP_REST_Response(['ok' => false, 'error' => 'Error interno'], 500);
        }
    }

    /**
     * POST /admin/duplicados/{id}/aprobar — Marcar como "no duplicado real".
     */
    public static function aprobar(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            $registroId = (int) $request->get_param('id');
            $adminId = UsuarioHelper::obtenerIdPg();
            if (!$adminId) return UsuarioHelper::respuestaNoEncontrado();

            $ok = DuplicadosPendientesRepository::aprobar($registroId, $adminId);

            if (!$ok) {
                return new \WP_REST_Response(['ok' => false, 'error' => 'Registro no encontrado o ya resuelto'], 404);
            }

            KamplesLogger::info('DuplicadosController: Aprobado', ['registroId' => $registroId, 'adminId' => $adminId]);
            return new \WP_REST_Response(['ok' => true, 'accion' => 'aprobado']);
        } catch (\Throwable $e) {
            KamplesLogger::error('DuplicadosController: Error aprobando', ['id' => $request->get_param('id'), 'error' => $e->getMessage()]);
            return new \WP_REST_Response(['ok' => false, 'error' => 'Error interno'], 500);
        }
    }

    /**
     * POST /admin/duplicados/{id}/rechazar — Eliminar sample duplicado.
     */
    public static function rechazar(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            $registroId = (int) $request->get_param('id');
            $adminId = UsuarioHelper::obtenerIdPg();
            if (!$adminId) return UsuarioHelper::respuestaNoEncontrado();

            $ok = DuplicadosPendientesRepository::rechazar($registroId, $adminId);

            if (!$ok) {
                return new \WP_REST_Response(['ok' => false, 'error' => 'Registro no encontrado'], 404);
            }

            KamplesLogger::info('DuplicadosController: Rechazado', ['registroId' => $registroId, 'adminId' => $adminId]);
            return new \WP_REST_Response(['ok' => true, 'accion' => 'rechazado']);
        } catch (\Throwable $e) {
            KamplesLogger::error('DuplicadosController: Error rechazando', ['id' => $request->get_param('id'), 'error' => $e->getMessage()]);
            return new \WP_REST_Response(['ok' => false, 'error' => 'Error interno'], 500);
        }
    }

    /**
     * POST /admin/duplicados/{id}/intercambiar — Invertir roles y fusionar.
     */
    public static function intercambiar(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            $registroId = (int) $request->get_param('id');
            $adminId = UsuarioHelper::obtenerIdPg();
            if (!$adminId) return UsuarioHelper::respuestaNoEncontrado();

            $ok = DuplicadosPendientesRepository::intercambiar($registroId, $adminId);

            if (!$ok) {
                return new \WP_REST_Response(['ok' => false, 'error' => 'Registro no encontrado'], 404);
            }

            KamplesLogger::info('DuplicadosController: Intercambiado y fusionado', ['registroId' => $registroId, 'adminId' => $adminId]);
            return new \WP_REST_Response(['ok' => true, 'accion' => 'intercambiado']);
        } catch (\Throwable $e) {
            KamplesLogger::error('DuplicadosController: Error intercambiando', ['id' => $request->get_param('id'), 'error' => $e->getMessage()]);
            return new \WP_REST_Response(['ok' => false, 'error' => 'Error interno'], 500);
        }
    }

    /**
     * POST /admin/duplicados/backfill — Ejecutar batch de backfill de hashes manualmente.
     */
    public static function backfill(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            $batch = \min(500, \max(10, (int) ($request->get_param('batch') ?? 100)));
            $stats = BackfillHashService::ejecutarBatch($batch);

            return new \WP_REST_Response([
                'ok' => true,
                'stats' => $stats,
            ]);
        } catch (\Throwable $e) {
            KamplesLogger::error('DuplicadosController: Error en backfill', ['error' => $e->getMessage()]);
            return new \WP_REST_Response(['ok' => false, 'error' => 'Error interno'], 500);
        }
    }

    /*
     * Convierte rutas filesystem a URLs HTTP para ambos lados de un duplicado.
     * Usa ruta_original como fallback si ruta_preview no existe (samples
     * marcados como duplicado antes de que el pipeline genere el preview).
     */
    private static function normalizarRutasPreview(array $row): array
    {
        $row['original_ruta_preview'] = NormalizadorSample::rutaAUrl(
            $row['original_ruta_preview'] ?? $row['original_ruta_original'] ?? ''
        );
        $row['duplicado_ruta_preview'] = NormalizadorSample::rutaAUrl(
            $row['duplicado_ruta_preview'] ?? $row['duplicado_ruta_original'] ?? ''
        );
        /* No exponer rutas filesystem al frontend */
        unset($row['original_ruta_original'], $row['duplicado_ruta_original']);

        return $row;
    }
}
