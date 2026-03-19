<?php

/* [183A-106] Controlador para codigos de descarga gratuita.
 * Permite al admin generar codigos que dan acceso de descarga gratis a un sample/coleccion.
 * Los usuarios reclaman el codigo (registra uso) para poder descargarlo gratis.
 * Gotcha: usa PG userId de UsuarioHelper, no WP user_id, consistente con todo el sistema.
 * Pendiente: invalidar codigo (endpoint de desactivar) si se necesita en el futuro. */

namespace App\Kamples\Api\Controladores;

use App\Kamples\Auth\AuthMiddleware;
use App\Kamples\Api\Helpers\UsuarioHelper;
use App\Kamples\Database\Repositories\CodigoGratisRepository;
use App\Kamples\Database\Repositories\SamplesRepository;
use App\Kamples\Database\Repositories\ColeccionesRepository;
use App\Kamples\KamplesLogger;

class CodigoGratisController
{
    public static function registrarRutas(string $namespace): void
    {
        /* Solo admin puede generar codigos */
        register_rest_route($namespace, '/codigos-gratis/generar', [
            'methods'             => 'POST',
            'callback'            => [self::class, 'generar'],
            'permission_callback' => [AuthMiddleware::class, 'requerirAdmin'],
        ]);

        /* Publico: cualquiera puede verificar que un codigo existe y a que apunta */
        register_rest_route($namespace, '/codigos-gratis/verificar', [
            'methods'             => 'GET',
            'callback'            => [self::class, 'verificar'],
            'permission_callback' => '__return_true',
        ]);

        /* Autenticado: registrar que este usuario reclama el codigo */
        register_rest_route($namespace, '/codigos-gratis/reclamar', [
            'methods'             => 'POST',
            'callback'            => [self::class, 'reclamar'],
            'permission_callback' => [AuthMiddleware::class, 'requerirAuth'],
        ]);
    }

    /**
     * POST /codigos-gratis/generar (admin)
     * Body: { tipo: 'sample'|'coleccion', targetId: number }
     * Retorna: { ok: true, codigo: string }
     */
    public static function generar(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            $tipo     = sanitize_text_field((string) $request->get_param('tipo'));
            $targetId = (int) $request->get_param('targetId');

            if (!in_array($tipo, ['sample', 'coleccion'], true) || $targetId <= 0) {
                return new \WP_REST_Response(['ok' => false, 'error' => 'Parámetros inválidos'], 400);
            }

            /* Verificar que el item objetivo existe */
            if ($tipo === 'sample') {
                $item = SamplesRepository::buscarParaDescarga($targetId);
            } else {
                $item = ColeccionesRepository::buscarPorId($targetId);
            }

            if (!$item) {
                return new \WP_REST_Response(['ok' => false, 'error' => 'Elemento no encontrado'], 404);
            }

            $creadoPorId = UsuarioHelper::obtenerIdPg();
            if (!$creadoPorId) return UsuarioHelper::respuestaNoEncontrado();

            /* Generar codigo unico de 32 chars hex */
            $codigo = bin2hex(random_bytes(16));

            $id = CodigoGratisRepository::crear($codigo, $tipo, $targetId, $creadoPorId);
            if (!$id) {
                return new \WP_REST_Response(['ok' => false, 'error' => 'Error al crear código'], 500);
            }

            return new \WP_REST_Response(['ok' => true, 'codigo' => $codigo], 201);

        } catch (\Throwable $e) {
            KamplesLogger::error('CodigoGratis::generar', $e->getMessage());
            return new \WP_REST_Response(['ok' => false, 'error' => 'Error interno'], 500);
        }
    }

    /**
     * GET /codigos-gratis/verificar?codigo=XXX (publico)
     * Retorna info del item al que aplica el codigo, sin marcar uso.
     */
    public static function verificar(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            $codigo = sanitize_text_field((string) $request->get_param('codigo'));
            if (!$codigo) {
                return new \WP_REST_Response(['ok' => false, 'error' => 'Código requerido'], 400);
            }

            $registro = CodigoGratisRepository::buscarPorCodigo($codigo);
            if (!$registro) {
                return new \WP_REST_Response(['ok' => false, 'error' => 'Código inválido o expirado'], 404);
            }

            return new \WP_REST_Response([
                'ok'       => true,
                'tipo'     => $registro['tipo'],
                'targetId' => (int) $registro['target_id'],
            ]);

        } catch (\Throwable $e) {
            KamplesLogger::error('CodigoGratis::verificar', $e->getMessage());
            return new \WP_REST_Response(['ok' => false, 'error' => 'Error interno'], 500);
        }
    }

    /**
     * POST /codigos-gratis/reclamar (auth)
     * Body: { codigo: string }
     * Registra que el usuario autenticado reclama este codigo.
     * Idempotente: si ya fue reclamado, retorna ok=true igualmente.
     */
    public static function reclamar(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            $userId = UsuarioHelper::obtenerIdPg();
            if (!$userId) return UsuarioHelper::respuestaNoEncontrado();

            $codigo = sanitize_text_field((string) $request->get_param('codigo'));
            if (!$codigo) {
                return new \WP_REST_Response(['ok' => false, 'error' => 'Código requerido'], 400);
            }

            $registro = CodigoGratisRepository::buscarPorCodigo($codigo);
            if (!$registro) {
                return new \WP_REST_Response(['ok' => false, 'error' => 'Código inválido o expirado'], 404);
            }

            CodigoGratisRepository::registrarUso((int) $registro['id'], $userId);

            return new \WP_REST_Response([
                'ok'       => true,
                'tipo'     => $registro['tipo'],
                'targetId' => (int) $registro['target_id'],
            ]);

        } catch (\Throwable $e) {
            KamplesLogger::error('CodigoGratis::reclamar', $e->getMessage());
            return new \WP_REST_Response(['ok' => false, 'error' => 'Error interno'], 500);
        }
    }
}
