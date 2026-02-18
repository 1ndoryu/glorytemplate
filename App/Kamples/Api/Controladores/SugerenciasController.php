<?php

/**
 * SugerenciasController — Motor de sugerencias "Más Ideas".
 *
 * Extraído de SamplesController (A04 SOLID split).
 * Scoring por tags + BPM + key para recomendar samples similares
 * al historial del usuario (descargas o favoritos).
 *
 * Endpoints:
 *   GET /me/descargas/sugerencias  — Sugerencias basadas en descargas
 *   GET /me/favoritos/sugerencias  — Sugerencias basadas en favoritos
 *
 * @package Kamples
 */

namespace App\Kamples\Api\Controladores;

use App\Kamples\Database\PostgresService;
use App\Kamples\Auth\AuthMiddleware;
use App\Kamples\Api\Helpers\NormalizadorSample;
use App\Kamples\Api\Helpers\UsuarioHelper;
use App\Config\Schema\_generated\SamplesCols;

class SugerenciasController
{
    public static function registrarRutas(string $namespace): void
    {
        /* C140: Sugerencias "Más Ideas" */
        \register_rest_route($namespace, '/me/descargas/sugerencias', [
            'methods'             => 'GET',
            'callback'            => [self::class, 'sugerenciasDescargas'],
            'permission_callback' => [AuthMiddleware::class, 'requerirAuth'],
            'args'                => [
                'pagina' => ['required' => false, 'type' => 'integer', 'default' => 1],
                'limite' => ['required' => false, 'type' => 'integer', 'default' => 20],
            ],
        ]);

        \register_rest_route($namespace, '/me/favoritos/sugerencias', [
            'methods'             => 'GET',
            'callback'            => [self::class, 'sugerenciasFavoritos'],
            'permission_callback' => [AuthMiddleware::class, 'requerirAuth'],
            'args'                => [
                'pagina' => ['required' => false, 'type' => 'integer', 'default' => 1],
                'limite' => ['required' => false, 'type' => 'integer', 'default' => 20],
            ],
        ]);
    }

    /**
     * GET /me/descargas/sugerencias — "Más Ideas" basadas en descargas.
     */
    public static function sugerenciasDescargas(\WP_REST_Request $request): \WP_REST_Response
    {
        $userId = UsuarioHelper::obtenerIdPg();
        if (!$userId) return UsuarioHelper::respuestaNoEncontrado();
        return self::calcularSugerencias(
            "SELECT s.tags, s.bpm, s.key FROM samples s JOIN descargas d ON d.sample_id = s.id WHERE d.usuario_id = :uid AND s.estado = 'activo'",
            "SELECT sample_id FROM descargas WHERE usuario_id = :uid",
            $userId,
            $request
        );
    }

    /**
     * GET /me/favoritos/sugerencias — "Más Ideas" basadas en favoritos.
     */
    public static function sugerenciasFavoritos(\WP_REST_Request $request): \WP_REST_Response
    {
        $userId = UsuarioHelper::obtenerIdPg();
        if (!$userId) return UsuarioHelper::respuestaNoEncontrado();
        return self::calcularSugerencias(
            "SELECT s.tags, s.bpm, s.key FROM samples s JOIN likes l ON l.target_id = s.id AND l.tipo = 'sample' WHERE l.usuario_id = :uid AND s.estado = 'activo'",
            "SELECT target_id AS sample_id FROM likes WHERE tipo = 'sample' AND usuario_id = :uid",
            $userId,
            $request
        );
    }

    /**
     * Motor de sugerencias genérico: analiza tags/BPM/key del contexto del usuario
     * y devuelve samples similares excluyendo los ya vistos.
     */
    private static function calcularSugerencias(
        string $sqlContexto,
        string $sqlExcluir,
        int $userId,
        \WP_REST_Request $request
    ): \WP_REST_Response {
        $pagina = \max(1, (int) $request->get_param('pagina'));
        $limite = \min(50, \max(1, (int) $request->get_param('limite')));
        $offset = ($pagina - 1) * $limite;

        $contexto = PostgresService::consultar($sqlContexto, ['uid' => $userId]);

        if (empty($contexto)) {
            return new \WP_REST_Response(['data' => []], 200);
        }

        $allTags = [];
        $allBpms = [];
        $allKeys = [];
        foreach ($contexto as $row) {
            $tags = NormalizadorSample::pgArrayToPhp($row[SamplesCols::TAGS] ?? '');
            $allTags = \array_merge($allTags, $tags);
            if (!empty($row[SamplesCols::BPM])) $allBpms[] = (int) $row[SamplesCols::BPM];
            if (!empty($row[SamplesCols::KEY])) $allKeys[] = $row[SamplesCols::KEY];
        }

        /* Top 10 tags más frecuentes */
        $tagCounts = \array_count_values($allTags);
        \arsort($tagCounts);
        $topTags = \array_slice(\array_keys($tagCounts), 0, 10);

        /* IDs a excluir (ya descargados/favoritos) */
        $idsExistentes = PostgresService::consultar($sqlExcluir, ['uid' => $userId]);
        $idsExcluir = \array_map(fn($r) => (int) $r['sample_id'], $idsExistentes);

        $params = [];
        $excludePlaceholders = '';
        if (!empty($idsExcluir)) {
            $excludeParts = [];
            foreach ($idsExcluir as $idx => $exId) {
                $key = "excl{$idx}";
                $excludeParts[] = ":{$key}";
                $params[$key] = $exId;
            }
            $excludePlaceholders = \implode(',', $excludeParts);
        }
        $excludeClause = !empty($excludePlaceholders) ? "AND s.id NOT IN ({$excludePlaceholders})" : '';

        /* Scoring: tags + key + BPM proximity */
        $avgBpm = !empty($allBpms) ? (int) (\array_sum($allBpms) / \count($allBpms)) : 120;
        $topKey = !empty($allKeys) ? \array_count_values($allKeys) : [];
        \arsort($topKey);
        $dominantKey = !empty($topKey) ? \array_key_first($topKey) : null;

        $tagConditions = [];
        /* S21 fix: NO reinicializar $params — ya contiene los :excl* placeholders */
        $params['limit'] = $limite;
        $params['offset'] = $offset;
        $params['avgBpm'] = $avgBpm;
        foreach ($topTags as $i => $tag) {
            $tagConditions[] = "CASE WHEN :tag{$i} = ANY(s.tags) THEN 1 ELSE 0 END";
            $params["tag{$i}"] = $tag;
        }
        $tagScore = !empty($tagConditions) ? '(' . \implode(' + ', $tagConditions) . ')' : '0';

        $keyScore = $dominantKey ? "CASE WHEN s.key = :domKey THEN 3 ELSE 0 END" : "0";
        if ($dominantKey) $params['domKey'] = $dominantKey;

        $sql = NormalizadorSample::sqlSelectSamples()
             . " WHERE s.estado = 'activo' {$excludeClause}"
             . " ORDER BY ({$tagScore} + {$keyScore} + CASE WHEN s.bpm IS NOT NULL THEN GREATEST(0, 5 - ABS(s.bpm - :avgBpm) / 10) ELSE 0 END) DESC,"
             . " s.total_likes DESC, s.publicado_at DESC"
             . " LIMIT :limit OFFSET :offset";

        $samples = PostgresService::consultar($sql, $params);

        return new \WP_REST_Response([
            'data' => NormalizadorSample::normalizarLista($samples),
        ], 200);
    }
}
