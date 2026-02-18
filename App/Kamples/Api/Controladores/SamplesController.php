<?php

/**
 * SamplesController — Coordinador + lectura + feed de samples.
 *
 * A04 SOLID split: la lógica de upload, modificación, biblioteca
 * personal y sugerencias se delegó a sub-controllers dedicados.
 *
 * Endpoints propios:
 *   GET /samples          — Listado con filtros y paginación
 *   GET /samples/{slug}   — Detalle por slug o id_corto
 *   GET /feed             — Feed algorítmico
 *
 * Delega a:
 *   SamplesUploadController       — POST /samples/upload
 *   SamplesModificacionController — PUT + DELETE /samples/{slug}
 *   BibliotecaSamplesController   — GET /me/favoritos, /me/descargas, /me/coleccionados
 *   SugerenciasController         — GET /me/descargas/sugerencias, /me/favoritos/sugerencias
 *
 * @package Kamples
 */

namespace App\Kamples\Api\Controladores;

use App\Kamples\Api\Helpers\NormalizadorSample;
use App\Kamples\Api\Helpers\UsuarioHelper;
use App\Kamples\Api\Helpers\RateLimiter;
use App\Kamples\KamplesLogger;
use App\Kamples\Database\Repositories\SamplesRepository;

class SamplesController
{
    public static function registrarRutas(string $namespace): void
    {
        /* --- Rutas propias de lectura --- */
        \register_rest_route($namespace, '/samples', [
            'methods'             => 'GET',
            'callback'            => [self::class, 'listar'],
            'permission_callback' => '__return_true',
            'args'                => self::argsListar(),
        ]);

        /*
         * GET del slug; PUT + DELETE se registran desde SamplesModificacionController.
         * WP REST API merges handlers cuando se registra la misma ruta+namespace.
         */
        \register_rest_route($namespace, '/samples/(?P<slug>[a-zA-Z0-9_-]+)', [
            'methods'             => 'GET',
            'callback'            => [self::class, 'obtener'],
            'permission_callback' => '__return_true',
            'args'                => [
                'slug' => ['required' => true, 'type' => 'string', 'sanitize_callback' => 'sanitize_text_field'],
            ],
        ]);

        \register_rest_route($namespace, '/feed', [
            'methods'             => 'GET',
            'callback'            => [self::class, 'feed'],
            'permission_callback' => '__return_true',
            'args'                => [
                'tipo'     => ['required' => false, 'type' => 'string', 'default' => 'descubrir', 'enum' => ['descubrir', 'trending', 'recientes']],
                'page'     => ['required' => false, 'type' => 'integer', 'default' => 1, 'minimum' => 1],
                'per_page' => ['required' => false, 'type' => 'integer', 'default' => 20, 'minimum' => 1, 'maximum' => 100],
            ],
        ]);

        /* --- Delegar a sub-controllers --- */
        SamplesUploadController::registrarRutas($namespace);
        SamplesModificacionController::registrarRutas($namespace);
        BibliotecaSamplesController::registrarRutas($namespace);
        SugerenciasController::registrarRutas($namespace);
    }

    /**
     * GET /samples — Listado con filtros y paginación.
     */
    public static function listar(\WP_REST_Request $request): \WP_REST_Response
    {
        /* C202: Rate limit anti-scraping para usuarios anónimos (60 req/minuto por IP) */
        if (!get_current_user_id()) {
            $rl = RateLimiter::verificarIp('listar_samples', 60, 60);
            if ($rl) return $rl;
        }

        $page    = (int) $request->get_param('page');
        $perPage = (int) $request->get_param('per_page');
        $offset  = ($page - 1) * $perPage;

        $where  = ["s.estado = 'activo'"];
        $params = [];

        /*
         * Si se filtra por creador, mostrar también samples en procesamiento.
         * Solo excluir eliminados. Así el creador puede ver su propio contenido.
         */
        $creador = $request->get_param('creador');
        if (!empty($creador)) {
            $where  = ["s.estado NOT IN ('eliminado')"];
            $where[]  = "LOWER(u.username) = LOWER(:creador)";
            $params['creador'] = $creador;
        }

        $busqueda = $request->get_param('busqueda');
        if (!empty($busqueda)) {
            $where[]  = "(s.titulo ILIKE :busqueda OR s.descripcion ILIKE :busqueda)";
            $params['busqueda'] = '%' . $busqueda . '%';
        }

        $genero = $request->get_param('genero');
        if (!empty($genero)) {
            $where[]  = "s.metadata->'genero' ? :genero";
            $params['genero'] = $genero;
        }

        $bpmMin = $request->get_param('bpm_min');
        if ($bpmMin !== null) {
            $where[]  = "s.bpm >= :bpm_min";
            $params['bpm_min'] = (int) $bpmMin;
        }

        $bpmMax = $request->get_param('bpm_max');
        if ($bpmMax !== null) {
            $where[]  = "s.bpm <= :bpm_max";
            $params['bpm_max'] = (int) $bpmMax;
        }

        $key = $request->get_param('key');
        if (!empty($key)) {
            $where[]  = "s.key = :key";
            $params['key'] = $key;
        }

        $tipo = $request->get_param('tipo');
        if (!empty($tipo)) {
            $where[]  = "s.tipo = :tipo";
            $params['tipo'] = $tipo;
        }

        $whereSQL = \implode(' AND ', $where);

        $total = SamplesRepository::contarConFiltros($whereSQL, $params);

        /* Obtener userId para subquery liked — null si no autenticado */
        $userId = UsuarioHelper::obtenerIdPg();

        $samples = SamplesRepository::listarConFiltros($userId, $whereSQL, $params, 'ORDER BY s.publicado_at DESC NULLS LAST', $perPage, $offset);

        /*
         * Envolver data + pagination bajo una clave 'data' para que
         * apiPeticion (que extrae json.data) entregue el objeto completo
         * al frontend como RespuestaListaSamples { data, pagination }.
         */
        return new \WP_REST_Response([
            'data' => [
                'data'       => NormalizadorSample::normalizarLista($samples),
                'pagination' => [
                    'page'     => $page,
                    'per_page' => $perPage,
                    'total'    => $total,
                    'pages'    => $total > 0 ? (int) \ceil($total / $perPage) : 0,
                ],
            ],
        ], 200);
    }

    /**
     * GET /samples/{slug} — Detalle por slug o id_corto (lookup dual).
     */
    public static function obtener(\WP_REST_Request $request): \WP_REST_Response
    {
        $slug = $request->get_param('slug');

        /*
         * Lookup dual: intenta por slug primero, luego por id_corto.
         * No filtra por estado para permitir ver samples en procesamiento.
         * El frontend muestra badge de estado si no es 'activo'.
         */
        $userId = UsuarioHelper::obtenerIdPg();
        $sample = SamplesRepository::obtenerPorSlugOIdCorto($slug, $userId);

        if ($sample === null) {
            KamplesLogger::debug('Sample no encontrado', ['slug' => $slug]);
            return new \WP_REST_Response([
                'code'    => 'sample_no_encontrado',
                'message' => 'El sample no existe o no está disponible.',
            ], 404);
        }

        return new \WP_REST_Response(['data' => NormalizadorSample::normalizar($sample)], 200);
    }

    /**
     * GET /feed — Feed algorítmico con scoring.
     * Usa MotorRecomendacion cuando está disponible, con fallback a ORDER BY simple.
     */
    public static function feed(\WP_REST_Request $request): \WP_REST_Response
    {
        /* C202: Rate limit anti-scraping para usuarios anónimos (60 req/minuto por IP) */
        if (!get_current_user_id()) {
            $rl = RateLimiter::verificarIp('feed_samples', 60, 60);
            if ($rl) return $rl;
        }

        $tipo    = $request->get_param('tipo');
        $page    = (int) $request->get_param('page');
        $perPage = (int) $request->get_param('per_page');
        $offset  = ($page - 1) * $perPage;

        /* Intentar usar el motor de recomendación para 'descubrir' */
        if ($tipo === 'descubrir') {
            $userId = UsuarioHelper::obtenerIdPg();
            KamplesLogger::info('Feed descubrir solicitado', [
                'userId' => $userId, 'page' => $page, 'perPage' => $perPage,
            ], 'algoritmo');
            if ($userId) {
                try {
                    $recomendados = \App\Kamples\Services\MotorRecomendacion::feedPersonalizado(
                        $userId, $perPage, $offset
                    );
                    KamplesLogger::info('Feed descubrir: MotorRecomendacion retornó', [
                        'resultados' => \count($recomendados),
                    ], 'algoritmo');
                    if (!empty($recomendados)) {
                        return new \WP_REST_Response([
                            'data' => NormalizadorSample::normalizarLista($recomendados),
                            'feed' => 'descubrir',
                            'page' => $page,
                            'algoritmo' => true,
                        ], 200);
                    }
                } catch (\Throwable $e) {
                    /* Fallback al ORDER BY simple si el motor falla */
                    KamplesLogger::warning('Motor de recomendación falló, usando fallback', [
                        'error' => $e->getMessage(),
                        'trace' => $e->getTraceAsString(),
                    ], 'algoritmo');
                }
            } else {
                KamplesLogger::debug('Feed descubrir: Sin userId PG, usando fallback', [], 'algoritmo');
            }
        }

        $orderBy = match ($tipo) {
            'trending'  => 'ORDER BY (s.total_descargas + s.total_likes * 2 + s.total_reproducciones) DESC',
            'recientes' => 'ORDER BY s.publicado_at DESC NULLS LAST',
            default     => 'ORDER BY s.publicado_at DESC NULLS LAST',
        };

        /* Obtener userId para subquery liked en fallback */
        $userIdFallback = UsuarioHelper::obtenerIdPg();

        $samples = SamplesRepository::listarFeed($userIdFallback, $orderBy, $perPage, $offset);

        return new \WP_REST_Response([
            'data' => NormalizadorSample::normalizarLista($samples),
            'feed' => $tipo,
            'page' => $page,
        ], 200);
    }



    private static function argsListar(): array
    {
        return [
            'page'     => ['required' => false, 'type' => 'integer', 'default' => 1, 'minimum' => 1],
            'per_page' => ['required' => false, 'type' => 'integer', 'default' => 20, 'minimum' => 1, 'maximum' => 100],
            'busqueda' => ['required' => false, 'type' => 'string', 'sanitize_callback' => 'sanitize_text_field'],
            'genero'   => ['required' => false, 'type' => 'string', 'sanitize_callback' => 'sanitize_text_field'],
            'bpm_min'  => ['required' => false, 'type' => 'integer', 'minimum' => 1, 'maximum' => 999],
            'bpm_max'  => ['required' => false, 'type' => 'integer', 'minimum' => 1, 'maximum' => 999],
            'key'      => ['required' => false, 'type' => 'string', 'sanitize_callback' => 'sanitize_text_field'],
            'tipo'     => ['required' => false, 'type' => 'string', 'enum' => ['loop', 'oneshot', 'fx', 'vocal', 'stem', 'otro']],
            'creador'  => ['required' => false, 'type' => 'string', 'sanitize_callback' => 'sanitize_text_field'],
        ];
    }

}
