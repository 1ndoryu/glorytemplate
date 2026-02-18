<?php

/**
 * BibliotecaSamplesController — Librería personal del usuario.
 *
 * Extraído de SamplesController (A04 SOLID split).
 *
 * Endpoints:
 *   GET /me/favoritos              — Samples likeados
 *   GET /me/descargas              — Samples descargados
 *   GET /me/coleccionados          — UNION descargas + subidos (C281)
 *   GET /me/coleccionados/carpetas — Carpetas con conteos (C281)
 *
 * @package Kamples
 */

namespace App\Kamples\Api\Controladores;

use App\Kamples\Database\PostgresService;
use App\Kamples\Auth\AuthMiddleware;
use App\Kamples\Api\Helpers\NormalizadorSample;
use App\Kamples\Api\Helpers\UsuarioHelper;

class BibliotecaSamplesController
{
    public static function registrarRutas(string $namespace): void
    {
        \register_rest_route($namespace, '/me/favoritos', [
            'methods'             => 'GET',
            'callback'            => [self::class, 'favoritos'],
            'permission_callback' => [AuthMiddleware::class, 'requerirAuth'],
            'args'                => [
                'page'     => ['required' => false, 'type' => 'integer', 'default' => 1],
                'per_page' => ['required' => false, 'type' => 'integer', 'default' => 20],
            ],
        ]);

        \register_rest_route($namespace, '/me/descargas', [
            'methods'             => 'GET',
            'callback'            => [self::class, 'misDescargas'],
            'permission_callback' => [AuthMiddleware::class, 'requerirAuth'],
            'args'                => [
                'page'     => ['required' => false, 'type' => 'integer', 'default' => 1],
                'per_page' => ['required' => false, 'type' => 'integer', 'default' => 20],
            ],
        ]);

        /* C281: Explorador */
        \register_rest_route($namespace, '/me/coleccionados', [
            'methods'             => 'GET',
            'callback'            => [self::class, 'coleccionados'],
            'permission_callback' => [AuthMiddleware::class, 'requerirAuth'],
            'args'                => [
                'carpeta'  => ['required' => false, 'type' => 'string', 'default' => ''],
                'page'     => ['required' => false, 'type' => 'integer', 'default' => 1],
                'per_page' => ['required' => false, 'type' => 'integer', 'default' => 100],
            ],
        ]);

        \register_rest_route($namespace, '/me/coleccionados/carpetas', [
            'methods'             => 'GET',
            'callback'            => [self::class, 'carpetasColeccionados'],
            'permission_callback' => [AuthMiddleware::class, 'requerirAuth'],
        ]);
    }

    /**
     * GET /me/favoritos — Samples que el usuario ha dado like.
     */
    public static function favoritos(\WP_REST_Request $request): \WP_REST_Response
    {
        $userId = UsuarioHelper::obtenerIdPg();
        if (!$userId) return UsuarioHelper::respuestaNoEncontrado();

        $page    = (int) $request->get_param('page');
        $perPage = (int) $request->get_param('per_page');
        $offset  = ($page - 1) * $perPage;

        $sql = NormalizadorSample::sqlSelectSamples($userId)
            . " JOIN likes l ON l.target_id = s.id AND l.tipo = 'sample' AND l.usuario_id = :favUser"
            . " WHERE s.estado = 'activo'"
            . " ORDER BY l.created_at DESC LIMIT :limit OFFSET :offset";

        $rows = PostgresService::consultar($sql, [
            'favUser' => $userId,
            'limit'   => $perPage,
            'offset'  => $offset,
        ]);

        $samples = NormalizadorSample::normalizarLista($rows);

        $total = PostgresService::consultarUno(
            "SELECT COUNT(*) as total FROM likes l JOIN samples s ON l.target_id = s.id WHERE l.tipo = 'sample' AND l.usuario_id = :uid AND s.estado = 'activo'",
            ['uid' => $userId]
        );

        return new \WP_REST_Response([
            'data' => [
                'data' => $samples,
                'pagination' => [
                    'page'     => $page,
                    'per_page' => $perPage,
                    'total'    => (int) ($total['total'] ?? 0),
                    'pages'    => \max(1, (int) \ceil(($total['total'] ?? 0) / $perPage)),
                ],
            ],
        ], 200);
    }

    /**
     * GET /me/descargas — Samples que el usuario ha descargado.
     */
    public static function misDescargas(\WP_REST_Request $request): \WP_REST_Response
    {
        $userId = UsuarioHelper::obtenerIdPg();
        if (!$userId) return UsuarioHelper::respuestaNoEncontrado();

        $page    = (int) $request->get_param('page');
        $perPage = (int) $request->get_param('per_page');
        $offset  = ($page - 1) * $perPage;

        $sql = NormalizadorSample::sqlSelectSamples($userId)
            . " JOIN descargas d ON d.sample_id = s.id AND d.usuario_id = :dlUser"
            . " WHERE s.estado = 'activo'"
            . " ORDER BY d.created_at DESC LIMIT :limit OFFSET :offset";

        $rows = PostgresService::consultar($sql, [
            'dlUser' => $userId,
            'limit'  => $perPage,
            'offset' => $offset,
        ]);

        $samples = NormalizadorSample::normalizarLista($rows);

        $total = PostgresService::consultarUno(
            "SELECT COUNT(*) as total FROM descargas d JOIN samples s ON d.sample_id = s.id WHERE d.usuario_id = :uid AND s.estado = 'activo'",
            ['uid' => $userId]
        );

        return new \WP_REST_Response([
            'data' => [
                'data' => $samples,
                'pagination' => [
                    'page'     => $page,
                    'per_page' => $perPage,
                    'total'    => (int) ($total['total'] ?? 0),
                    'pages'    => \max(1, (int) \ceil(($total['total'] ?? 0) / $perPage)),
                ],
            ],
        ], 200);
    }

    /**
     * GET /me/coleccionados — UNION de descargas + samples propios.
     * C281: Soporta filtro por carpeta_primaria (metadata JSONB).
     */
    public static function coleccionados(\WP_REST_Request $request): \WP_REST_Response
    {
        $userId = UsuarioHelper::obtenerIdPg();
        if (!$userId) return UsuarioHelper::respuestaNoEncontrado();

        $page    = \max(1, (int) $request->get_param('page'));
        $perPage = \min(200, \max(1, (int) $request->get_param('per_page')));
        $offset  = ($page - 1) * $perPage;
        $carpeta = \trim((string) $request->get_param('carpeta'));

        $carpetaClause = '';
        $params = ['uid' => $userId, 'uid2' => $userId, 'limit' => $perPage, 'offset' => $offset];
        if ($carpeta !== '') {
            $carpetaClause = " AND s.metadata->>'carpeta_primaria' = :carpeta";
            $params['carpeta'] = $carpeta;
        }

        $sql = NormalizadorSample::sqlSelectSamples($userId)
             . " LEFT JOIN descargas d ON d.sample_id = s.id AND d.usuario_id = :uid"
             . " WHERE s.estado = 'activo'{$carpetaClause}"
             . " AND (d.id IS NOT NULL OR s.creador_id = :uid2)"
             . " ORDER BY GREATEST("
             . "   COALESCE(d.created_at, '1970-01-01'::timestamp),"
             . "   s.publicado_at"
             . " ) DESC"
             . " LIMIT :limit OFFSET :offset";

        $rows = PostgresService::consultar($sql, $params);
        $samples = NormalizadorSample::normalizarLista($rows);

        $sqlTotal = "SELECT COUNT(DISTINCT s.id) AS total"
                  . " FROM samples s"
                  . " LEFT JOIN descargas d ON d.sample_id = s.id AND d.usuario_id = :uid"
                  . " WHERE s.estado = 'activo'{$carpetaClause}"
                  . " AND (d.id IS NOT NULL OR s.creador_id = :uid2)";

        $totalParams = ['uid' => $userId, 'uid2' => $userId];
        if ($carpeta !== '') $totalParams['carpeta'] = $carpeta;
        $total = PostgresService::consultarUno($sqlTotal, $totalParams);

        return new \WP_REST_Response([
            'data' => [
                'data' => $samples,
                'pagination' => [
                    'page'     => $page,
                    'per_page' => $perPage,
                    'total'    => (int) ($total['total'] ?? 0),
                    'pages'    => \max(1, (int) \ceil(($total['total'] ?? 0) / $perPage)),
                ],
            ],
        ], 200);
    }

    /**
     * GET /me/coleccionados/carpetas — Estructura de carpetas con conteos.
     */
    public static function carpetasColeccionados(\WP_REST_Request $request): \WP_REST_Response
    {
        $userId = UsuarioHelper::obtenerIdPg();
        if (!$userId) return UsuarioHelper::respuestaNoEncontrado();

        $sql = "SELECT"
             . "  COALESCE(s.metadata->>'carpeta_primaria', 'Samples') AS primaria,"
             . "  s.metadata->>'carpeta_secundaria' AS secundaria,"
             . "  COUNT(*) AS total"
             . " FROM ("
             . "  SELECT s.id, s.metadata FROM samples s"
             . "  JOIN descargas d ON d.sample_id = s.id AND d.usuario_id = :uid"
             . "  WHERE s.estado = 'activo'"
             . "  UNION"
             . "  SELECT s.id, s.metadata FROM samples s"
             . "  WHERE s.estado = 'activo' AND s.creador_id = :uid2"
             . " ) s"
             . " GROUP BY primaria, secundaria"
             . " ORDER BY primaria, secundaria";

        $rows = PostgresService::consultar($sql, ['uid' => $userId, 'uid2' => $userId]);

        /* Construir árbol jerárquico */
        $arbol = [];
        $indice = [];
        foreach ($rows as $row) {
            $pri = $row['primaria'] ?? 'Samples';
            $sec = $row['secundaria'] ?? null;
            $cnt = (int) ($row['total'] ?? 0);

            if (!isset($indice[$pri])) {
                $indice[$pri] = \count($arbol);
                $arbol[] = ['primaria' => $pri, 'total' => 0, 'subcarpetas' => []];
            }

            $arbol[$indice[$pri]]['total'] += $cnt;

            if ($sec) {
                $arbol[$indice[$pri]]['subcarpetas'][] = ['nombre' => $sec, 'total' => $cnt];
            }
        }

        return new \WP_REST_Response(['data' => $arbol], 200);
    }
}
