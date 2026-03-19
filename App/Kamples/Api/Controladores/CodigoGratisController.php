<?php

/* [183A-106] Controlador para codigos de descarga gratuita.
 * Permite al admin generar codigos que dan acceso de descarga gratis a un sample/coleccion.
 * Los usuarios reclaman el codigo (registra uso) para poder descargarlo gratis.
 * Gotcha: usa PG userId de UsuarioHelper, no WP user_id, consistente con todo el sistema.
 * [183A-110] Seguridad: rate limiting en verificar (30/min IP). ExpiraciÃ³n: 1 aÃ±o.
 *   Reclamar codigo expirado: agrega 50 creditos compensacion + modal en frontend.
 *   Endpoint invalidar: admin puede revocar todos los codigos activos de un item. */

namespace App\Kamples\Api\Controladores;

use App\Kamples\Auth\AuthMiddleware;
use App\Kamples\Api\Helpers\UsuarioHelper;
use App\Kamples\Api\Helpers\RateLimiter;
use App\Kamples\Database\Repositories\CodigoGratisRepository;
use App\Kamples\Database\Repositories\SamplesRepository;
use App\Kamples\Database\Repositories\ColeccionesRepository;
use App\Kamples\Database\Repositories\UsuariosExtRepository;
use App\Kamples\KamplesLogger;

class CodigoGratisController
{
    private const CREDITOS_COMPENSACION = 50;

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

        /* [183A-110] Solo admin puede invalidar todos los codigos activos de un item */
        register_rest_route($namespace, '/codigos-gratis/invalidar', [
            'methods'             => 'POST',
            'callback'            => [self::class, 'invalidar'],
            'permission_callback' => [AuthMiddleware::class, 'requerirAdmin'],
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
                return new \WP_REST_Response(['ok' => false, 'error' => 'ParÃ¡metros invÃ¡lidos'], 400);
            }

            /* Verificar que el item objetivo existe y obtener su nombre */
            $nombreItem = '';
            if ($tipo === 'sample') {
                $item = SamplesRepository::buscarParaDescarga($targetId);
                if ($item) $nombreItem = (string) ($item['titulo'] ?? '');
            } else {
                $item = ColeccionesRepository::buscarPorId($targetId);
                if ($item) $nombreItem = (string) ($item['nombre'] ?? '');
            }

            if (!$item) {
                return new \WP_REST_Response(['ok' => false, 'error' => 'Elemento no encontrado'], 404);
            }

            $creadoPorId = UsuarioHelper::obtenerIdPg();
            if (!$creadoPorId) return UsuarioHelper::respuestaNoEncontrado();

            /* Generar codigo unico de 32 chars hex (128 bits de entropia â€” brute force imposible) */
            $codigo = bin2hex(random_bytes(16));

            $id = CodigoGratisRepository::crear($codigo, $tipo, $targetId, $creadoPorId, $nombreItem);
            if (!$id) {
                return new \WP_REST_Response(['ok' => false, 'error' => 'Error al crear cÃ³digo'], 500);
            }

            return new \WP_REST_Response(['ok' => true, 'codigo' => $codigo], 201);

        } catch (\Throwable $e) {
            KamplesLogger::error('CodigoGratis::generar', $e->getMessage());
            return new \WP_REST_Response(['ok' => false, 'error' => 'Error interno'], 500);
        }
    }

    /**
     * GET /codigos-gratis/verificar?codigo=XXX (publico)
     * [183A-110] Rate limited: 30 req/min por IP.
     * Diferencia entre codigo invalido (404), expirado (410) y valido (200).
     */
    public static function verificar(\WP_REST_Request $request): \WP_REST_Response
    {
        /* [183A-110] Rate limiting por IP para evitar DoS */
        $rateLimitResp = RateLimiter::verificarIp('codigos_gratis_verificar', 30, 60);
        if ($rateLimitResp) return $rateLimitResp;

        try {
            $codigo = sanitize_text_field((string) $request->get_param('codigo'));

            /* ValidaciÃ³n de longitud: nuestros codigos son 32 chars hex */
            if (!$codigo || strlen($codigo) > 64) {
                return new \WP_REST_Response(['ok' => false, 'error' => 'CÃ³digo invÃ¡lido'], 400);
            }

            /* [183A-110] Buscar incluyendo expirados para diferenciar vs inexistente */
            $registro = CodigoGratisRepository::buscarSiActivo($codigo);

            if (!$registro) {
                /* No existe o fue invalidado */
                return new \WP_REST_Response(['ok' => false, 'error' => 'CÃ³digo invÃ¡lido'], 404);
            }

            /* Detectar si estÃ¡ expirado */
            $expiresAt = strtotime((string) $registro['expires_at']);
            if ($expiresAt && $expiresAt < time()) {
                /* CÃ³digo expirado â€” diferente a invÃ¡lido para el modal de compensaciÃ³n */
                return new \WP_REST_Response([
                    'ok'        => false,
                    'expired'   => true,
                    'nombreItem' => (string) ($registro['nombre_item'] ?? ''),
                ], 410);
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
     * [183A-110] Manejo extendido: si el codigo esta expirado, agrega 50 creditos de compensacion
     * y retorna expired=true para que el frontend muestre el modal.
     * Idempotente: ya reclamado â†’ ok=true; ya compensado â†’ expired=true sin duplicar creditos.
     */
    public static function reclamar(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            $userId = UsuarioHelper::obtenerIdPg();
            if (!$userId) return UsuarioHelper::respuestaNoEncontrado();

            $codigo = sanitize_text_field((string) $request->get_param('codigo'));
            if (!$codigo || strlen($codigo) > 64) {
                return new \WP_REST_Response(['ok' => false, 'error' => 'CÃ³digo requerido'], 400);
            }

            /* [183A-110] Primero buscar incluyendo expirados para manejar compensacion */
            $registroActivo = CodigoGratisRepository::buscarSiActivo($codigo);

            if (!$registroActivo) {
                /* Codigo no existe o fue invalidado â€” no hay compensacion */
                return new \WP_REST_Response(['ok' => false, 'error' => 'CÃ³digo invÃ¡lido'], 404);
            }

            $codigoId  = (int) $registroActivo['id'];
            $expiresAt = strtotime((string) $registroActivo['expires_at']);
            $expirado  = ($expiresAt && $expiresAt < time());

            if ($expirado) {
                /* Codigo expirado: dar 50 creditos de compensacion (si no se han dado ya) */
                $yaCompensado = CodigoGratisRepository::yaCompensadoPorExpiracion($codigoId, $userId);

                if (!$yaCompensado) {
                    UsuariosExtRepository::agregarCreditosBonus($userId, self::CREDITOS_COMPENSACION);
                    CodigoGratisRepository::registrarCompensacion($codigoId, $userId);
                }

                return new \WP_REST_Response([
                    'ok'          => false,
                    'expired'     => true,
                    'compensado'  => !$yaCompensado,
                    'nombreItem'  => (string) ($registroActivo['nombre_item'] ?? ''),
                ]);
            }

            /* Codigo valido: registrar uso (idempotente) */
            CodigoGratisRepository::registrarUso($codigoId, $userId);

            return new \WP_REST_Response([
                'ok'       => true,
                'tipo'     => $registroActivo['tipo'],
                'targetId' => (int) $registroActivo['target_id'],
            ]);

        } catch (\Throwable $e) {
            KamplesLogger::error('CodigoGratis::reclamar', $e->getMessage());
            return new \WP_REST_Response(['ok' => false, 'error' => 'Error interno'], 500);
        }
    }

    /**
     * POST /codigos-gratis/invalidar (admin)
     * Body: { tipo: 'sample'|'coleccion', targetId: number }
     * [183A-110] Revoca todos los codigos activos de un item.
     * Los usuarios que ya reclamaron siguen con el codigo en su store, pero el download
     * endpoint rechazarÃ¡ porque usuarioPuedeDescargar() verifica activo = TRUE.
     * Gotcha: codigos ya expirados no necesitan invalidarse (ya no funcionan).
     */
    public static function invalidar(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            $tipo     = sanitize_text_field((string) $request->get_param('tipo'));
            $targetId = (int) $request->get_param('targetId');

            if (!in_array($tipo, ['sample', 'coleccion'], true) || $targetId <= 0) {
                return new \WP_REST_Response(['ok' => false, 'error' => 'ParÃ¡metros invÃ¡lidos'], 400);
            }

            $invalidados = CodigoGratisRepository::invalidarPorTipoTarget($tipo, $targetId);

            return new \WP_REST_Response([
                'ok'          => true,
                'invalidados' => $invalidados,
            ]);

        } catch (\Throwable $e) {
            KamplesLogger::error('CodigoGratis::invalidar', $e->getMessage());
            return new \WP_REST_Response(['ok' => false, 'error' => 'Error interno'], 500);
        }
    }
}
