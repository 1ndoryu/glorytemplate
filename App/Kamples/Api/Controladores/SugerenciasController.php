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

use App\Kamples\Auth\AuthMiddleware;
use App\Kamples\Api\Helpers\NormalizadorSample;
use App\Kamples\Api\Helpers\UsuarioHelper;
use App\Config\Schema\_generated\SamplesCols;
use App\Kamples\Database\Repositories\DescargasRepository;
use App\Kamples\Database\Repositories\LikesRepository;
use App\Kamples\Database\Repositories\SamplesRepository;
use App\Kamples\KamplesLogger;

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
        try {
            $userId = UsuarioHelper::obtenerIdPg();
            if (!$userId) return UsuarioHelper::respuestaNoEncontrado();

            $contexto = DescargasRepository::contextoDescargas($userId);
            $idsExcluir = DescargasRepository::idsDescargados($userId);

            return self::calcularSugerencias($contexto, $idsExcluir, $request);
        } catch (\Throwable $e) {
            KamplesLogger::error('SugerenciasController::sugerenciasDescargas error', ['error' => $e->getMessage()]);
            return new \WP_REST_Response(['code' => 'error_interno', 'message' => 'Error interno del servidor'], 500);
        }
    }

    /**
     * GET /me/favoritos/sugerencias — "Más Ideas" basadas en favoritos.
     */
    public static function sugerenciasFavoritos(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            $userId = UsuarioHelper::obtenerIdPg();
            if (!$userId) return UsuarioHelper::respuestaNoEncontrado();

            $contexto = LikesRepository::contextoFavoritos($userId);
            $idsExcluir = LikesRepository::idsFavoritos($userId);

            return self::calcularSugerencias($contexto, $idsExcluir, $request);
        } catch (\Throwable $e) {
            KamplesLogger::error('SugerenciasController::sugerenciasFavoritos error', ['error' => $e->getMessage()]);
            return new \WP_REST_Response(['code' => 'error_interno', 'message' => 'Error interno del servidor'], 500);
        }
    }

    /**
     * Motor de sugerencias genérico: analiza tags/BPM/key del contexto del usuario
     * y devuelve samples similares excluyendo los ya vistos.
     */
    private static function calcularSugerencias(
        array $contexto,
        array $idsExcluir,
        \WP_REST_Request $request
    ): \WP_REST_Response {
        $pagina = \max(1, (int) $request->get_param('pagina'));
        $limite = \min(50, \max(1, (int) $request->get_param('limite')));
        $offset = ($pagina - 1) * $limite;

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

        /* BPM promedio y key dominante */
        $avgBpm = !empty($allBpms) ? (int) (\array_sum($allBpms) / \count($allBpms)) : 120;
        $topKey = !empty($allKeys) ? \array_count_values($allKeys) : [];
        \arsort($topKey);
        $dominantKey = !empty($topKey) ? \array_key_first($topKey) : null;

        $samples = SamplesRepository::buscarPorScoring($topTags, $avgBpm, $dominantKey, $idsExcluir, $limite, $offset);

        return new \WP_REST_Response([
            'data' => NormalizadorSample::normalizarLista($samples),
        ], 200);
    }
}
