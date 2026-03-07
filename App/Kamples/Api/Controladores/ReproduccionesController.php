<?php

/**
 * ReproduccionesController — Tracking de reproducciones.
 *
 * Registra cada play con debounce de 3s y duración escuchada.
 * Alimenta el algoritmo de recomendación y el historial del usuario.
 *
 * @package Kamples
 */

namespace App\Kamples\Api\Controladores;

use App\Kamples\Auth\AuthMiddleware;
use App\Kamples\Api\Helpers\UsuarioHelper;
use App\Kamples\Api\Helpers\NormalizadorSample;
use App\Kamples\Api\Helpers\RateLimiter;
use App\Kamples\Services\MotorRecomendacion;
use App\Kamples\Services\PlanificadorAlgoritmo;
use App\Config\Schema\_generated\SamplesCols;
use App\Kamples\Database\Repositories\ReproduccionesRepository;
use App\Kamples\Database\Repositories\SamplesRepository;
use App\Kamples\KamplesLogger;

class ReproduccionesController
{
    public static function registrarRutas(string $namespace): void
    {
        /* Registrar reproducción */
        register_rest_route($namespace, '/samples/(?P<id>\d+)/reproduccion', [
            'methods' => 'POST', 'callback' => [self::class, 'registrar'],
            'permission_callback' => [AuthMiddleware::class, 'requerirAuth'],
            'args' => [
                'duracion_escuchada' => ['required' => false, 'type' => 'number', 'default' => 0],
                'completada'         => ['required' => false, 'type' => 'boolean', 'default' => false],
            ],
        ]);

        /* Historial de reproducciones del usuario */
        register_rest_route($namespace, '/reproducciones/historial', [
            'methods' => 'GET', 'callback' => [self::class, 'historial'],
            'permission_callback' => [AuthMiddleware::class, 'requerirAuth'],
            'args' => [
                'page' => ['required' => false, 'type' => 'integer', 'default' => 1],
                'per_page' => ['required' => false, 'type' => 'integer', 'default' => 20],
            ],
        ]);

        /* Samples similares para "También te podría gustar" */
        register_rest_route($namespace, '/samples/(?P<id>\d+)/similares', [
            'methods' => 'GET', 'callback' => [self::class, 'similares'],
            'permission_callback' => '__return_true',
            'args' => ['limite' => ['required' => false, 'type' => 'integer', 'default' => 5]],
        ]);
    }

    /**
     * POST /samples/{id}/reproduccion — Registra una reproducción.
     * Debounce: ignora reproducciones del mismo sample en los últimos 3 segundos.
     */
    public static function registrar(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
        $userId = UsuarioHelper::obtenerIdPg();
        if (!$userId) return UsuarioHelper::respuestaNoEncontrado();

        /* C164: Rate limit — 60 reproducciones por minuto (anti-bot) */
        $limitResp = RateLimiter::verificarUsuario($userId, 'reproduccion', 60, 60);
        if ($limitResp) return $limitResp;

        $sampleId = (int) $request->get_param('id');
        $duracion = (float) $request->get_param('duracion_escuchada');
        $completada = (bool) $request->get_param('completada');

        /*
         * O13: Debounce atómico con INSERT ... ON CONFLICT para evitar race condition.
         * Si ya existe una reproducción del mismo usuario+sample en los últimos 3s,
         * actualizamos en vez de crear duplicado.
         */
        $reciente = ReproduccionesRepository::buscarRecientePorUsuario($userId, $sampleId, '3 seconds');

        if ($reciente) {
            /* Actualizar la reproducción existente en vez de crear otra */
            ReproduccionesRepository::actualizarReproduccion((int) $reciente['id'], $duracion, $completada);
            return new \WP_REST_Response(['ok' => true, 'debounce' => true], 200);
        }

        ReproduccionesRepository::registrar($userId, $sampleId, $duracion, $completada);

        /* Incrementar contador en la tabla samples */
        SamplesRepository::incrementarReproducciones($sampleId);

        /* Invalidar cache del feed para que el algoritmo recalcule */
        MotorRecomendacion::invalidarCache($userId);

        /* C45: registrar interacción para el planificador del algoritmo */
        PlanificadorAlgoritmo::registrarInteraccion($userId, 'reproduccion');
        if ($completada) {
            PlanificadorAlgoritmo::registrarInteraccion($userId, 'completa');
        }

        return new \WP_REST_Response(['ok' => true], 201);
        } catch (\Throwable $e) {
            KamplesLogger::error('ReproduccionesController::registrar error', ['error' => $e->getMessage()]);
            return new \WP_REST_Response(['code' => 'error_interno', 'message' => 'Error interno del servidor'], 500);
        }
    }

    /**
     * GET /reproducciones/historial — Historial de reproducciones.
     */
    public static function historial(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
        $userId = UsuarioHelper::obtenerIdPg();
        if (!$userId) return UsuarioHelper::respuestaNoEncontrado();

        $page = max(1, (int) $request->get_param('page'));
        $perPage = (int) $request->get_param('per_page');
        $offset = ($page - 1) * $perPage;

        $samples = ReproduccionesRepository::historialUsuario($userId, $perPage, $offset);

        return new \WP_REST_Response([
            'data' => NormalizadorSample::normalizarLista($samples),
            'page' => $page,
        ], 200);
        } catch (\Throwable $e) {
            KamplesLogger::error('ReproduccionesController::historial error', ['error' => $e->getMessage()]);
            return new \WP_REST_Response(['code' => 'error_interno', 'message' => 'Error interno del servidor'], 500);
        }
    }

    /**
     * GET /samples/{id}/similares — Samples similares por metadata.
     * Se usa en SampleDetalleIsland y en el modal "También te podría gustar" al dar like.
     */
    public static function similares(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
        $sampleId = (int) $request->get_param('id');
        $limite = (int) $request->get_param('limite');

        /* F10: Cache de similares por sample — evita recalcular en cada apertura de detalle */
        $cacheKey = "kamples_similares_{$sampleId}_{$limite}";
        $cached = \get_transient($cacheKey);
        if ($cached !== false) {
            return new \WP_REST_Response(['data' => $cached], 200);
        }

        $sample = SamplesRepository::buscarMetadataParaSimilares($sampleId);

        if (!$sample) {
            return new \WP_REST_Response(['data' => []], 200);
        }

        $tags = NormalizadorSample::pgArrayToPhp($sample[SamplesCols::TAGS] ?? '');
        $bpm = $sample[SamplesCols::BPM] ? (int) $sample[SamplesCols::BPM] : 120;
        $key = $sample[SamplesCols::KEY] ?? null;
        $tipo = $sample[SamplesCols::TIPO] ?? 'one shot';

        $similares = SamplesRepository::buscarSimilares($sampleId, $tags, $bpm, $key, $tipo, $limite);
        $resultado = NormalizadorSample::normalizarLista($similares);

        /* Cache 15 minutos — los similares no cambian frecuentemente */
        \set_transient($cacheKey, $resultado, 15 * MINUTE_IN_SECONDS);

        return new \WP_REST_Response(['data' => $resultado], 200);
        } catch (\Throwable $e) {
            KamplesLogger::error('ReproduccionesController::similares error', ['error' => $e->getMessage()]);
            return new \WP_REST_Response(['code' => 'error_interno', 'message' => 'Error interno del servidor'], 500);
        }
    }
}
