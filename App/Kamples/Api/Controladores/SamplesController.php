<?php

/* sentinel-disable-file limite-lineas — 307 efectivas, ya dividido en 5 sub-controllers. Excedente minimo por busqueda full-text QK75. */

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
use App\Kamples\Services\MotorRecomendacion;
use App\Config\Schema\_generated\SamplesCols;
use App\Config\Schema\_generated\SamplesEnums;
use App\Config\Schema\_generated\UsuariosExtCols;
use App\Config\Schema\_generated\CancionesCols;

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
                'per_page' => ['required' => false, 'type' => 'integer', 'default' => 12, 'minimum' => 1, 'maximum' => 100],
            ],
        ]);

        /* C4: Endpoint de tags agregados para filtrado escalable */
        \register_rest_route($namespace, '/tags/aggregates', [
            'methods'             => 'GET',
            'callback'            => [self::class, 'tagsAgregados'],
            'permission_callback' => '__return_true',
            'args'                => self::argsListar(),
        ]);

        /* --- Delegar a sub-controllers --- */
        SamplesUploadController::registrarRutas($namespace);
        SamplesModificacionController::registrarRutas($namespace);
        BibliotecaSamplesController::registrarRutas($namespace);
        SugerenciasController::registrarRutas($namespace);
        ExtensionRecorteController::registrarRutas($namespace);
    }

    /**
     * GET /samples — Listado con filtros y paginación.
     */
    public static function listar(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
        /* C202: Rate limit anti-scraping para usuarios anónimos (60 req/minuto por IP) */
        if (!get_current_user_id()) {
            $rl = RateLimiter::verificarIp('listar_samples', 60, 60);
            if ($rl) return $rl;
        }

        $page    = (int) $request->get_param('page');
        $perPage = (int) $request->get_param('per_page');
        $offset  = ($page - 1) * $perPage;

        $sEstado = SamplesCols::ESTADO;
        $eActivo = SamplesEnums::ESTADO_ACTIVO;
        $eElim = SamplesEnums::ESTADO_ELIMINADO;
        $uUser = UsuariosExtCols::USERNAME;
        $sTitulo = SamplesCols::TITULO;
        $sDesc = SamplesCols::DESCRIPCION;
        $sTags = SamplesCols::TAGS;
        $sMeta = SamplesCols::METADATA;
        $sBpm = SamplesCols::BPM;
        $sKey = SamplesCols::KEY;
        $sTipo = SamplesCols::TIPO;
        $sPubAt = SamplesCols::PUBLICADO_AT;

        $where  = ["s.{$sEstado} = '{$eActivo}'"];
        $params = [];

        /*
         * Si se filtra por creador, mostrar también samples en procesamiento.
         * Solo excluir eliminados. Así el creador puede ver su propio contenido.
         */
        $creador = $request->get_param('creador');
        if (!empty($creador)) {
            $where  = ["s.{$sEstado} NOT IN ('{$eElim}')"];
            $where[]  = "LOWER(u.{$uUser}) = LOWER(:creador)";
            $params['creador'] = $creador;
        }

        $busqueda = $request->get_param('busqueda');
        if (!empty($busqueda)) {
            /* QK75: Full-text match como filtro principal — aprovecha GIN index idx_samples_busqueda_fts.
             * ILIKE como fallback para matches parciales que full-text no captura (substrings).
             * Tags via UNNEST como tercer criterio. Combinados con OR para máxima cobertura.
             * Con pg_trgm GIN index, el ILIKE también es rápido. */
            $where[] = "(to_tsvector('spanish', COALESCE(s.{$sTitulo}, '') || ' ' || COALESCE(s.{$sDesc}, '')) @@ plainto_tsquery('spanish', :busquedaFts)"
                     . " OR s.{$sTitulo} ILIKE :busqueda"
                     . " OR EXISTS (SELECT 1 FROM UNNEST(s.{$sTags}) tag WHERE tag ILIKE :busquedaTagWhere))";
            $params['busquedaFts'] = $busqueda;
            $params['busqueda'] = '%' . $busqueda . '%';
            $params['busquedaTagWhere'] = '%' . strtolower($busqueda) . '%';
        }

        $genero = $request->get_param('genero');
        if (!empty($genero)) {
            $gKey = CancionesCols::GENERO;
            $where[]  = "s.{$sMeta}->'{$gKey}' ? :genero";
            $params['genero'] = $genero;
        }

        $bpmMin = $request->get_param('bpm_min');
        if ($bpmMin !== null) {
            $where[]  = "s.{$sBpm} >= :bpm_min";
            $params['bpm_min'] = (int) $bpmMin;
        }

        $bpmMax = $request->get_param('bpm_max');
        if ($bpmMax !== null) {
            $where[]  = "s.{$sBpm} <= :bpm_max";
            $params['bpm_max'] = (int) $bpmMax;
        }

        $key = $request->get_param('key');
        if (!empty($key)) {
            $where[]  = "s.{$sKey} = :key";
            $params['key'] = $key;
        }

        $tipo = $request->get_param('tipo');
        if (!empty($tipo)) {
            $where[]  = "s.{$sTipo} = :tipo";
            $params['tipo'] = $tipo;
        }

        $whereSQL = \implode(' AND ', $where);

        $total = SamplesRepository::contarConFiltros($whereSQL, $params);

        /* Obtener userId para subquery liked — null si no autenticado */
        $userId = UsuarioHelper::obtenerIdPg();

        /*
         * Búsqueda con ranking de relevancia (algoritmoPesos['busqueda']).
         * Cuando hay término de búsqueda: scoring multi-factor via ts_rank + tag match + título boost.
         * Sin búsqueda: orden cronológico estándar (publicado_at DESC).
         *
         * ts_rank: relevancia full-text nativa de PostgreSQL (stemming, stop words).
         * Tag match: boost si el término coincide con algún tag del sample.
         * Título boost: ranking extra solo sobre título (mayor especificidad).
         */
        if (!empty($busqueda) && mb_strlen($busqueda) >= 2) {
            $config = require __DIR__ . '/../../Config/algoritmoPesos.php';
            $busquedaConfig = $config['busqueda'] ?? [];

            $tsWeight = (float) ($busquedaConfig['ts_rank_weight'] ?? 1.0);
            $tagBoost = (float) ($busquedaConfig['tag_match_boost'] ?? 0.8);
            $tituloBoost = (float) ($busquedaConfig['titulo_boost'] ?? 0.5);
            $idioma = $busquedaConfig['idioma_ts'] ?? 'spanish';

            /* Whitelist de configuraciones de idioma PG para prevenir inyección */
            $idiomasValidos = ['simple', 'english', 'spanish', 'french', 'german', 'portuguese', 'italian'];
            if (!\in_array($idioma, $idiomasValidos, true)) $idioma = 'spanish';

            /* ts_rank sobre título+descripción combinados — usa GIN index idx_samples_busqueda_fts */
            $sqlTsRank = "ts_rank(to_tsvector('{$idioma}', COALESCE(s.{$sTitulo}, '') || ' ' || COALESCE(s.{$sDesc}, '')), plainto_tsquery('{$idioma}', :busquedaRank))";
            /* ts_rank solo sobre título (mayor peso) — usa GIN index idx_samples_titulo_fts */
            $sqlTituloRank = "ts_rank(to_tsvector('{$idioma}', COALESCE(s.{$sTitulo}, '')), plainto_tsquery('{$idioma}', :busquedaTituloRank))";
            /* Boost por coincidencia en tags */
            $sqlTagMatch = "CASE WHEN s.{$sTags} IS NOT NULL AND EXISTS (SELECT 1 FROM UNNEST(s.{$sTags}) tag WHERE tag ILIKE :busquedaTagLike) THEN 1.0 ELSE 0.0 END";

            $orderBy = "ORDER BY ({$tsWeight} * {$sqlTsRank} + {$tagBoost} * {$sqlTagMatch} + {$tituloBoost} * {$sqlTituloRank}) DESC, s.{$sPubAt} DESC NULLS LAST";

            /* Params separados — PDO EMULATE_PREPARES=false exige nombres únicos */
            $params['busquedaRank'] = $busqueda;
            $params['busquedaTituloRank'] = $busqueda;
            $params['busquedaTagLike'] = '%' . strtolower($busqueda) . '%';
        } else {
            $orderBy = 'ORDER BY s.' . $sPubAt . ' DESC NULLS LAST';
        }

        $samples = SamplesRepository::listarConFiltros($userId, $whereSQL, $params, $orderBy, $perPage, $offset);

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
        } catch (\Throwable $e) {
            KamplesLogger::error('SamplesController::listar error', ['error' => $e->getMessage()]);
            return new \WP_REST_Response(['code' => 'error_interno', 'message' => 'Error interno del servidor'], 500);
        }
    }

    /**
     * GET /samples/{slug} — Detalle por slug o id_corto (lookup dual).
     */
    public static function obtener(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
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
        } catch (\Throwable $e) {
            KamplesLogger::error('SamplesController::obtener error', ['error' => $e->getMessage()]);
            return new \WP_REST_Response(['code' => 'error_interno', 'message' => 'Error interno del servidor'], 500);
        }
    }

    /**
     * GET /feed — Feed algorítmico con scoring.
     * Usa MotorRecomendacion cuando está disponible, con fallback a ORDER BY simple.
     */
    public static function feed(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
        /* C202: Rate limit anti-scraping para usuarios anónimos (60 req/minuto por IP) */
        if (!get_current_user_id()) {
            $rl = RateLimiter::verificarIp('feed_samples', 60, 60);
            if ($rl) return $rl;
        }

        $tipo    = $request->get_param('tipo');
        $page    = (int) $request->get_param('page');
        $perPage = (int) $request->get_param('per_page');
        $offset  = ($page - 1) * $perPage;

        /* QQ2: Total de samples activos para el contador del feed (solo en page 1 para evitar query extra) */
        $sEstadoFeed = SamplesCols::ESTADO;
        $eActivoFeed = SamplesEnums::ESTADO_ACTIVO;
        $totalActivos = ($page === 1)
            ? SamplesRepository::contarConFiltros("s.{$sEstadoFeed} = '{$eActivoFeed}'", [])
            : null;

        /* Intentar usar el motor de recomendación para 'descubrir' */
        if ($tipo === 'descubrir') {
            $userId = UsuarioHelper::obtenerIdPg();
            KamplesLogger::info('Feed descubrir solicitado', [
                'userId' => $userId, 'page' => $page, 'perPage' => $perPage,
            ], 'algoritmo');
            if ($userId) {
                try {
                    $recomendados = MotorRecomendacion::feedPersonalizado(
                        $userId, $perPage, $offset
                    );
                    KamplesLogger::info('Feed descubrir: MotorRecomendacion retornó', [
                        'resultados' => \count($recomendados),
                    ], 'algoritmo');
                    if (!empty($recomendados)) {
                        $resp = [
                            'data' => NormalizadorSample::normalizarLista($recomendados),
                            'feed' => 'descubrir',
                            'page' => $page,
                            'algoritmo' => true,
                        ];
                        if ($totalActivos !== null) $resp['total'] = $totalActivos;
                        return new \WP_REST_Response($resp, 200);
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

        $sTotDesc = SamplesCols::TOTAL_DESCARGAS;
        $sTotLk = SamplesCols::TOTAL_LIKES;
        $sTotRepro = SamplesCols::TOTAL_REPRODUCCIONES;
        $sPubAt = SamplesCols::PUBLICADO_AT;

        $orderBy = match ($tipo) {
            'trending'  => "ORDER BY (s.{$sTotDesc} + s.{$sTotLk} * 2 + s.{$sTotRepro}) DESC",
            'recientes' => "ORDER BY s.{$sPubAt} DESC NULLS LAST",
            default     => "ORDER BY s.{$sPubAt} DESC NULLS LAST",
        };

        /* Obtener userId para subquery liked en fallback */
        $userIdFallback = UsuarioHelper::obtenerIdPg();

        $samples = SamplesRepository::listarFeed($userIdFallback, $orderBy, $perPage, $offset);

        $resp = [
            'data' => NormalizadorSample::normalizarLista($samples),
            'feed' => $tipo,
            'page' => $page,
        ];
        if ($totalActivos !== null) $resp['total'] = $totalActivos;
        return new \WP_REST_Response($resp, 200);
        } catch (\Throwable $e) {
            KamplesLogger::error('SamplesController::feed error', ['error' => $e->getMessage()]);
            return new \WP_REST_Response(['code' => 'error_interno', 'message' => 'Error interno del servidor'], 500);
        }
    }



    /*
     * C4: GET /tags/aggregates — Tags agregados con conteo, aplicando los mismos filtros del listado.
     * Permite al frontend mostrar tags disponibles sin cargar todos los samples.
     */
    public static function tagsAgregados(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            $sEstado = SamplesCols::ESTADO;
            $eActivo = SamplesEnums::ESTADO_ACTIVO;
            $sMeta = SamplesCols::METADATA;
            $sBpm = SamplesCols::BPM;
            $sKey = SamplesCols::KEY;
            $sTipo = SamplesCols::TIPO;

            $where  = ["s.{$sEstado} = '{$eActivo}'"];
            $params = [];

            $genero = $request->get_param('genero');
            if (!empty($genero)) {
                $gKey = CancionesCols::GENERO;
                $where[]  = "s.{$sMeta}->'{$gKey}' ? :genero";
                $params['genero'] = $genero;
            }

            $bpmMin = $request->get_param('bpm_min');
            if ($bpmMin !== null) {
                $where[]  = "s.{$sBpm} >= :bpm_min";
                $params['bpm_min'] = (int) $bpmMin;
            }

            $bpmMax = $request->get_param('bpm_max');
            if ($bpmMax !== null) {
                $where[]  = "s.{$sBpm} <= :bpm_max";
                $params['bpm_max'] = (int) $bpmMax;
            }

            $key = $request->get_param('key');
            if (!empty($key)) {
                $where[]  = "s.{$sKey} = :key";
                $params['key'] = $key;
            }

            $tipo = $request->get_param('tipo');
            if (!empty($tipo)) {
                $where[]  = "s.{$sTipo} = :tipo";
                $params['tipo'] = $tipo;
            }

            $whereSQL = \implode(' AND ', $where);
            $resultado = SamplesRepository::tagsAgregados($whereSQL, $params);

            return new \WP_REST_Response($resultado, 200);
        } catch (\Throwable $e) {
            KamplesLogger::error('SamplesController::tagsAgregados error', ['error' => $e->getMessage()]);
            return new \WP_REST_Response(['code' => 'error_interno', 'message' => 'Error interno del servidor'], 500);
        }
    }

    private static function argsListar(): array
    {
        return [
            'page'     => ['required' => false, 'type' => 'integer', 'default' => 1, 'minimum' => 1],
            'per_page' => ['required' => false, 'type' => 'integer', 'default' => 12, 'minimum' => 1, 'maximum' => 100],
            'busqueda' => ['required' => false, 'type' => 'string', 'sanitize_callback' => 'sanitize_text_field'],
            'genero'   => ['required' => false, 'type' => 'string', 'sanitize_callback' => 'sanitize_text_field'],
            'bpm_min'  => ['required' => false, 'type' => 'integer', 'minimum' => 1, 'maximum' => 999],
            'bpm_max'  => ['required' => false, 'type' => 'integer', 'minimum' => 1, 'maximum' => 999],
            'key'      => ['required' => false, 'type' => 'string', 'sanitize_callback' => 'sanitize_text_field'],
            'tipo'     => ['required' => false, 'type' => 'string', 'enum' => ['loop', 'oneshot']],
            'creador'  => ['required' => false, 'type' => 'string', 'sanitize_callback' => 'sanitize_text_field'],
        ];
    }

}
