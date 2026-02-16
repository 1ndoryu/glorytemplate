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

use App\Kamples\Database\PostgresService;
use App\Kamples\Auth\AuthMiddleware;
use App\Kamples\Api\Helpers\UsuarioHelper;
use App\Kamples\Api\Helpers\NormalizadorSample;
use App\Kamples\Services\MotorRecomendacion;
use App\Kamples\Services\PlanificadorAlgoritmo;

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
        $userId = UsuarioHelper::obtenerIdPg();
        if (!$userId) return UsuarioHelper::respuestaNoEncontrado();

        $sampleId = (int) $request->get_param('id');
        $duracion = (float) $request->get_param('duracion_escuchada');
        $completada = (bool) $request->get_param('completada');

        /* Debounce: no registrar si ya se reprodujo en los últimos 3 segundos */
        $reciente = PostgresService::consultarUno(
            "SELECT id FROM reproducciones
             WHERE usuario_id = :userId AND sample_id = :sampleId
             AND created_at > NOW() - INTERVAL '3 seconds'",
            ['userId' => $userId, 'sampleId' => $sampleId]
        );

        if ($reciente) {
            /* Actualizar la reproducción existente en vez de crear otra */
            PostgresService::ejecutar(
                "UPDATE reproducciones SET duracion_escuchada = :duracion, completada = :completada
                 WHERE id = :id",
                ['id' => $reciente['id'], 'duracion' => $duracion, 'completada' => $completada ? 'true' : 'false']
            );
            return new \WP_REST_Response(['ok' => true, 'debounce' => true], 200);
        }

        PostgresService::ejecutar(
            "INSERT INTO reproducciones (usuario_id, sample_id, duracion_escuchada, completada)
             VALUES (:userId, :sampleId, :duracion, :completada)",
            ['userId' => $userId, 'sampleId' => $sampleId, 'duracion' => $duracion, 'completada' => $completada ? 'true' : 'false']
        );

        /* Incrementar contador en la tabla samples */
        PostgresService::ejecutar(
            "UPDATE samples SET total_reproducciones = total_reproducciones + 1 WHERE id = :id",
            ['id' => $sampleId]
        );

        /* Invalidar cache del feed para que el algoritmo recalcule */
        MotorRecomendacion::invalidarCache($userId);

        /* C45: registrar interacción para el planificador del algoritmo */
        PlanificadorAlgoritmo::registrarInteraccion($userId, 'reproduccion');
        if ($completada) {
            PlanificadorAlgoritmo::registrarInteraccion($userId, 'completa');
        }

        return new \WP_REST_Response(['ok' => true], 201);
    }

    /**
     * GET /reproducciones/historial — Historial de reproducciones.
     */
    public static function historial(\WP_REST_Request $request): \WP_REST_Response
    {
        $userId = UsuarioHelper::obtenerIdPg();
        if (!$userId) return UsuarioHelper::respuestaNoEncontrado();

        $page = (int) $request->get_param('page');
        $perPage = (int) $request->get_param('per_page');
        $offset = ($page - 1) * $perPage;

        $sql = NormalizadorSample::sqlSelectSamples()
             . " JOIN reproducciones r ON r.sample_id = s.id"
             . " WHERE r.usuario_id = :userId AND s.estado = 'activo'"
             . " GROUP BY s.id, u.id, u.username, u.nombre_visible, u.avatar_url, u.verificado"
             . " ORDER BY MAX(r.created_at) DESC LIMIT :limit OFFSET :offset";

        $samples = PostgresService::consultar($sql, ['userId' => $userId, 'limit' => $perPage, 'offset' => $offset]);

        return new \WP_REST_Response([
            'data' => NormalizadorSample::normalizarLista($samples),
            'page' => $page,
        ], 200);
    }

    /**
     * GET /samples/{id}/similares — Samples similares por metadata.
     * Se usa en SampleDetalleIsland y en el modal "También te podría gustar" al dar like.
     */
    public static function similares(\WP_REST_Request $request): \WP_REST_Response
    {
        $sampleId = (int) $request->get_param('id');
        $limite = (int) $request->get_param('limite');

        $sample = PostgresService::consultarUno(
            "SELECT tags, bpm, key, tipo FROM samples WHERE id = :id",
            ['id' => $sampleId]
        );

        if (!$sample) {
            return new \WP_REST_Response(['data' => []], 200);
        }

        $tags = NormalizadorSample::pgArrayToPhp($sample['tags'] ?? '');
        $bpm = $sample['bpm'] ? (int) $sample['bpm'] : 120;
        $key = $sample['key'] ?? null;

        /* Scoring por similitud de tags + proximidad BPM + match de key + mismo tipo */
        $params = ['sampleId' => $sampleId, 'limit' => $limite, 'bpm' => $bpm];

        $tagScoreParts = [];
        foreach (array_slice($tags, 0, 8) as $i => $tag) {
            $tagScoreParts[] = "CASE WHEN :stag{$i} = ANY(s.tags) THEN 2 ELSE 0 END";
            $params["stag{$i}"] = $tag;
        }
        $tagScore = !empty($tagScoreParts) ? '(' . implode(' + ', $tagScoreParts) . ')' : '0';

        $keyScore = $key ? "CASE WHEN s.key = :skey THEN 5 ELSE 0 END" : "0";
        if ($key) $params['skey'] = $key;

        $tipoScore = "CASE WHEN s.tipo = :stipo THEN 3 ELSE 0 END";
        $params['stipo'] = $sample['tipo'] ?? 'one shot';

        $sql = NormalizadorSample::sqlSelectSamples()
             . " WHERE s.estado = 'activo' AND s.id != :sampleId"
             . " ORDER BY ({$tagScore} + {$keyScore} + {$tipoScore}"
             . " + CASE WHEN s.bpm IS NOT NULL THEN GREATEST(0, 5 - ABS(s.bpm - :bpm) / 10) ELSE 0 END) DESC,"
             . " s.total_likes DESC LIMIT :limit";

        $similares = PostgresService::consultar($sql, $params);

        return new \WP_REST_Response(['data' => NormalizadorSample::normalizarLista($similares)], 200);
    }
}
