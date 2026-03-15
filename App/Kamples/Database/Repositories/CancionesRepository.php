<?php

/**
 * CancionesRepository — Acceso a datos para tabla 'canciones'.
 *
 * SECCION AUTO-GENERADA: Los metodos base se regeneran con schema:generate.
 * SECCION CUSTOM: Todo debajo de la marca CUSTOM se preserva al regenerar.
 *
 * @package Kamples
 */

namespace App\Kamples\Database\Repositories;

use App\Config\Schema\_generated\CancionesCols;
use App\Config\Schema\_generated\CancionesDTO;
use App\Config\Schema\_generated\ArtistasMusicalesCols;
use App\Config\Schema\_generated\LikesCols;
use App\Config\Schema\_generated\LikesEnums;
use App\Config\Schema\_generated\SamplesCols;
use App\Config\Schema\_generated\SamplesEnums;

class CancionesRepository extends BaseRepository
{
    protected static function tabla(): string
    {
        return CancionesCols::TABLA;
    }

    protected static function colId(): string
    {
        return CancionesCols::ID;
    }

    /*
     * Buscar registros mas recientes.
     */
    public static function buscarRecientes(int $limit = 20): array
    {
        $tabla = CancionesCols::TABLA;

        return static::consultar(
            "SELECT * FROM {$tabla} ORDER BY " . CancionesCols::CREATED_AT . " DESC LIMIT :limit",
            ['limit' => $limit]
        );
    }

    /* === METODOS CUSTOM (seguro para editar debajo de esta linea) === */

                        /**
     * Buscar canción por URL de WhoSampled (dedup en scraping).
     */
    public static function buscarPorWhosampled(string $url): ?array
    {
        $cols = implode(', ', CancionesCols::TODAS);

        return static::consultarUno(
            "SELECT {$cols} FROM " . CancionesCols::TABLA
            . " WHERE " . CancionesCols::WHOSAMPLED_URL . " = :url",
            ['url' => $url]
        );
    }

    /**
     * Buscar canción por slug interno.
     */
    public static function buscarPorSlug(string $slug): ?array
    {
        return static::consultarUno(
            "SELECT * FROM " . CancionesCols::TABLA
            . " WHERE " . CancionesCols::SLUG . " = :slug",
            ['slug' => $slug]
        );
    }

    /**
     * Canción con info de artista principal.
     */
    public static function buscarConArtista(int $id): ?array
    {
        $tc = CancionesCols::TABLA;
        $ta = ArtistasMusicalesCols::TABLA;

        return static::consultarUno(
            "SELECT c.*, a." . ArtistasMusicalesCols::NOMBRE . " AS artista_nombre,
                    a." . ArtistasMusicalesCols::SLUG . " AS artista_slug
             FROM {$tc} c
             JOIN {$ta} a ON c." . CancionesCols::ARTISTA_ID . " = a." . ArtistasMusicalesCols::ID . "
             WHERE c." . CancionesCols::ID . " = :id",
            ['id' => $id]
        );
    }

    /**
     * Búsqueda fulltext en canciones (titulo + artista + album).
     * QK75: Split en dos tsvectors para que cada uno use su GIN index:
     *   - idx_canciones_busqueda_fts (titulo + album)
     *   - idx_artistas_nombre_fts (nombre artista)
     */
    public static function buscarTexto(string $query, int $limit = 20): array
    {
        $tc = CancionesCols::TABLA;
        $ta = ArtistasMusicalesCols::TABLA;

        return static::consultar(
            "SELECT c.*, a.nombre AS artista_nombre
             FROM {$tc} c
             JOIN {$ta} a ON c." . CancionesCols::ARTISTA_ID . " = a.id
             WHERE to_tsvector('simple', c." . CancionesCols::TITULO . " || ' ' || COALESCE(c." . CancionesCols::ALBUM . ", ''))
                @@ plainto_tsquery('simple', :query)
                OR to_tsvector('simple', a.nombre) @@ plainto_tsquery('simple', :queryArtista)
             ORDER BY (c." . CancionesCols::TOTAL_SAMPLEADA . " + c." . CancionesCols::TOTAL_SAMPLEA . ") DESC
             LIMIT :limit",
            ['query' => $query, 'queryArtista' => $query, 'limit' => $limit]
        );
    }

    /**
     * Canciones más sampleadas (para exploración).
     */
    public static function masSampleadas(int $limit = 50): array
    {
        $tc = CancionesCols::TABLA;
        $ta = ArtistasMusicalesCols::TABLA;

        return static::consultar(
            "SELECT c.*, a.nombre AS artista_nombre
             FROM {$tc} c
             JOIN {$ta} a ON c." . CancionesCols::ARTISTA_ID . " = a.id
             ORDER BY c." . CancionesCols::TOTAL_SAMPLEADA . " DESC
             LIMIT :limit",
            ['limit' => $limit]
        );
    }

    /**
     * Upsert: insertar o retornar existente por whosampled_url.
     */
    public static function upsertPorWhosampled(array $datos): ?int
    {
        $existente = static::buscarPorWhosampled($datos[CancionesCols::WHOSAMPLED_URL] ?? '');
        if ($existente) {
            return (int) $existente[CancionesCols::ID];
        }

        return static::insertarRegistro($datos);
    }

    /**
     * Trunca (con CASCADE) todas las tablas del módulo Sample Discovery.
     * Exclusivo para entornos de desarrollo; DevController verifica WP_DEBUG antes de llamarlo.
     */
    public static function purgarModulo(): void
    {
        /* Orden: dependencias primero para documentación, CASCADE lo resuelve de todas formas */
        $tablas = implode(', ', [
            \App\Config\Schema\_generated\RelacionesSampleCols::TABLA,
            \App\Config\Schema\_generated\CancionesArtistasCols::TABLA,
            CancionesCols::TABLA,
            ArtistasMusicalesCols::TABLA,
            \App\Config\Schema\_generated\ScrapingLogCols::TABLA,
            \App\Config\Schema\_generated\ColaExtraccionSamplesCols::TABLA,
        ]);

        static::ejecutar("TRUNCATE {$tablas} CASCADE");
    }

    /**
     * Géneros predominantes de un artista (top N por frecuencia).
     * Se calcula al vuelo: con <100 canciones por artista es trivial.
     *
     * @return array<string> Lista de géneros ordenados por frecuencia DESC.
     */
    public static function generosPorArtista(int $artistaId, int $limit = 5): array
    {
        $tc = CancionesCols::TABLA;

        $rows = static::consultar(
            "SELECT " . CancionesCols::GENERO . " AS genero, COUNT(*) AS total
             FROM {$tc}
             WHERE " . CancionesCols::ARTISTA_ID . " = :artista_id
               AND " . CancionesCols::GENERO . " IS NOT NULL
               AND " . CancionesCols::GENERO . " != ''
             GROUP BY " . CancionesCols::GENERO . "
             ORDER BY total DESC
             LIMIT :limit",
            ['artista_id' => $artistaId, 'limit' => $limit]
        );

        return \array_map(fn($r) => $r['genero'], $rows);
    }

    /*
     * C812: Feed paginado de canciones con 3 modos de ordenamiento.
     * - inteligente: ponderado por total_sampleada + freshness + diversidad genero
     * - top_sampleados: simple ORDER BY total_sampleada DESC
     * - hot: canciones con mas likes recientes (7 dias)
     *
     * @param string $orden    inteligente|top_sampleados|hot
     * @param int    $pagina   1-indexed
     * @param int    $porPagina registros por pagina
     * @return array{items: array, total: int}
     */
    /**
     * Feed paginado con 3 modos de ordenamiento: inteligente, top_sampleados, hot.
     * Si se pasa $userId, incluye subquery correlacionada para liked/reaccion del usuario.
     */
    public static function feed(string $orden, int $pagina = 1, int $porPagina = 20, ?int $userId = null): array
    {
        $tc = CancionesCols::TABLA;
        $offset = ($pagina - 1) * $porPagina;

        $baseSelect = self::buildSelectBase($userId);

        $countSql = "SELECT COUNT(*) FROM {$tc} c";

        switch ($orden) {
            case 'top_sampleados':
                $sql = $baseSelect . " ORDER BY c." . CancionesCols::TOTAL_SAMPLEADA . " DESC
                        LIMIT :limit OFFSET :offset";
                break;

            case 'hot':
                /*
                 * Hot = canciones con mas likes en los ultimos 7 dias.
                 * Likes usan tabla polimorfica: tipo='cancion' + target_id = cancion.id
                 * Fallback a total_sampleada para canciones sin likes recientes.
                 * Se reconstruye el SELECT con LEFT JOIN de likes recientes.
                 */
                $tc2 = CancionesCols::TABLA;
                $ta2 = ArtistasMusicalesCols::TABLA;
                $tl = LikesCols::TABLA;
                $tipoCancion = LikesEnums::TIPO_CANCION;
                $reaccionHot = self::buildReaccionExpr($userId);
                $sampleHot = self::buildSampleAdjuntoExpr();

                $sql = "SELECT c.*, a." . ArtistasMusicalesCols::NOMBRE . " AS artista_nombre,
                               a." . ArtistasMusicalesCols::SLUG . " AS artista_slug,
                               {$reaccionHot} AS reaccion_usuario,
                               {$sampleHot},
                               COALESCE(lr.likes_recientes, 0) AS likes_recientes
                        FROM {$tc2} c
                        JOIN {$ta2} a ON c." . CancionesCols::ARTISTA_ID . " = a." . ArtistasMusicalesCols::ID . "
                        LEFT JOIN (
                            SELECT " . LikesCols::TARGET_ID . " AS cancion_id,
                                   COUNT(*) AS likes_recientes
                            FROM {$tl}
                            WHERE " . LikesCols::TIPO . " = '{$tipoCancion}'
                              AND " . LikesCols::CREATED_AT . " > NOW() - INTERVAL '7 days'
                            GROUP BY " . LikesCols::TARGET_ID . "
                        ) lr ON lr.cancion_id = c." . CancionesCols::ID . "
                        ORDER BY likes_recientes DESC, c." . CancionesCols::TOTAL_SAMPLEADA . " DESC
                        LIMIT :limit OFFSET :offset";
                break;

            default: /* inteligente */
                /*
                 * Algoritmo heuristico: puntaje = log(total_sampleada+1) * 3 + freshness * 2 + random + bonus_sample.
                 * freshness = 1 - (dias_desde_creacion / 365), clamped 0..1.
                 * QL14: +3.0 bonus si la cancion tiene al menos un sample adjunto reproducible.
                 * Esto da ~2x prioridad a canciones con samples vs canciones sin.
                 */
                $ts = SamplesCols::TABLA;
                $eActivo = SamplesEnums::ESTADO_ACTIVO;
                $sql = $baseSelect . "
                        ORDER BY (
                            LN(c." . CancionesCols::TOTAL_SAMPLEADA . " + 1) * 3.0
                            + GREATEST(0, 1.0 - EXTRACT(EPOCH FROM (NOW() - c." . CancionesCols::CREATED_AT . ")) / 31536000.0) * 2.0
                            + RANDOM() * 1.5
                            + (CASE WHEN EXISTS (
                                SELECT 1 FROM {$ts} s
                                WHERE s." . SamplesCols::CANCION_ORIGEN_ID . " = c." . CancionesCols::ID . "
                                  AND s." . SamplesCols::ESTADO . " = '{$eActivo}'
                                  AND s." . SamplesCols::RUTA_PREVIEW . " IS NOT NULL
                            ) THEN 3.0 ELSE 0.0 END)
                        ) DESC
                        LIMIT :limit OFFSET :offset";
                break;
        }

        $total = (int) static::consultarValor($countSql);
        $items = static::consultar($sql, ['limit' => $porPagina, 'offset' => $offset]);

        return ['items' => $items, 'total' => $total];
    }

    /**
     * Lista canciones para el sitemap XML (campos mínimos: slug, updated_at).
     */
    public static function listarParaSitemap(int $limit = 2000, int $offset = 0): array
    {
        $tc = CancionesCols::TABLA;
        $sql = "SELECT " . CancionesCols::SLUG . ", " . CancionesCols::UPDATED_AT
             . " FROM {$tc}"
             . " ORDER BY " . CancionesCols::UPDATED_AT . " DESC"
             . " LIMIT :limit OFFSET :offset";

        return static::consultar($sql, ['limit' => $limit, 'offset' => $offset]);
    }

    /**
     * Cuenta total de canciones para paginación del sitemap.
     */
    public static function contarParaSitemap(): int
    {
        $tc = CancionesCols::TABLA;
        $sql = "SELECT COUNT(*) FROM {$tc}";
        return (int) (static::consultarValor($sql) ?? 0);
    }

    /*
     * QK18/QK22: Secciones estilo Spotify para la pagina de musica.
     * Un solo request retorna multiples secciones con dedup entre ellas.
     * Cada seccion tiene tipo, titulo y lista de canciones o artistas.
     * Dedup: una cancion nunca aparece en dos secciones.
     *
     * @return array Lista de secciones [{tipo, titulo, canciones/artistas}]
     */
    public static function secciones(int $porSeccion = 15, ?int $userId = null): array
    {
        $idsUsados = [];
        $secciones = [];
        $selectBase = self::buildSelectBase($userId);

        /* 1. "Para Ti" — heuristico inteligente */
        $paraTi = self::fetchSeccionOrdenada($selectBase, 'inteligente', $porSeccion, $idsUsados);
        self::acumularIds($idsUsados, $paraTi);
        if (!empty($paraTi)) {
            $secciones[] = ['tipo' => 'para_ti', 'titulo' => 'Para Ti', 'canciones' => $paraTi];
        }

        /* 2. "Tendencia" — canciones mas populares por likes */
        $hot = self::fetchSeccionOrdenada($selectBase, 'tendencia', $porSeccion, $idsUsados);
        self::acumularIds($idsUsados, $hot);
        if (!empty($hot)) {
            $secciones[] = ['tipo' => 'tendencia', 'titulo' => 'Tendencia', 'canciones' => $hot];
        }

        /* 3. "Mas Sampleadas" — top all-time */
        $top = self::fetchSeccionOrdenada($selectBase, 'top', $porSeccion, $idsUsados);
        self::acumularIds($idsUsados, $top);
        if (!empty($top)) {
            $secciones[] = ['tipo' => 'top', 'titulo' => 'Más Sampleadas', 'canciones' => $top];
        }

        /* 4. Secciones por genero — top generos con minimo 5 canciones */
        $generos = self::generosPopulares(6);
        foreach ($generos as $genero) {
            $cancionesGenero = self::fetchSeccionGenero($selectBase, $genero, $porSeccion, $idsUsados);
            if (\count($cancionesGenero) >= 5) {
                self::acumularIds($idsUsados, $cancionesGenero);
                $secciones[] = [
                    'tipo'      => 'genero',
                    'titulo'    => $genero,
                    'genero'    => $genero,
                    'canciones' => $cancionesGenero,
                ];
            }
        }

        /* 5. Artistas populares */
        $artistas = ArtistasMusicalesRepository::topPorCanciones($porSeccion);
        if (!empty($artistas)) {
            $secciones[] = ['tipo' => 'artistas', 'titulo' => 'Artistas Populares', 'artistas' => $artistas];
        }

        return $secciones;
    }

    /*
     * SELECT base para canciones: artista JOIN + reaccion usuario + sample adjunto.
     * Extraido de feed() para reutilizar en secciones() (DRY QK18).
     */
    private static function buildSelectBase(?int $userId): string
    {
        $tc = CancionesCols::TABLA;
        $ta = ArtistasMusicalesCols::TABLA;
        $reaccionExpr = self::buildReaccionExpr($userId);
        $sampleExpr = self::buildSampleAdjuntoExpr();

        return "SELECT c.*, a." . ArtistasMusicalesCols::NOMBRE . " AS artista_nombre,
                a." . ArtistasMusicalesCols::SLUG . " AS artista_slug,
                {$reaccionExpr} AS reaccion_usuario,
                {$sampleExpr}
         FROM {$tc} c
         JOIN {$ta} a ON c." . CancionesCols::ARTISTA_ID . " = a." . ArtistasMusicalesCols::ID;
    }

    /* Subquery correlacionada: reaccion (like/encanta) del usuario sobre cancion */
    private static function buildReaccionExpr(?int $userId): string
    {
        if ($userId === null) {
            return 'NULL';
        }
        $tipoCancion = LikesEnums::TIPO_CANCION;
        return "(SELECT " . LikesCols::REACCION . " FROM " . LikesCols::TABLA
            . " WHERE " . LikesCols::USUARIO_ID . " = " . (int) $userId
            . " AND " . LikesCols::TIPO . " = '{$tipoCancion}'"
            . " AND " . LikesCols::TARGET_ID . " = c." . CancionesCols::ID . " LIMIT 1)";
    }

    /* Subquery correlacionada: primer sample activo con preview vinculado a la cancion */
    private static function buildSampleAdjuntoExpr(): string
    {
        $ts = SamplesCols::TABLA;
        $eActivo = SamplesEnums::ESTADO_ACTIVO;
        return "(SELECT row_to_json(sq) FROM (
            SELECT s." . SamplesCols::ID . ",
                   s." . SamplesCols::TITULO . ",
                   s." . SamplesCols::SLUG . ",
                   s." . SamplesCols::RUTA_PREVIEW . ",
                   s." . SamplesCols::IMAGEN_URL . ",
                   s." . SamplesCols::CREADOR_ID . ",
                   s." . SamplesCols::ID_CORTO . ",
                   s." . SamplesCols::DURACION . ",
                   s." . SamplesCols::TIPO . "
            FROM {$ts} s
            WHERE s." . SamplesCols::CANCION_ORIGEN_ID . " = c." . CancionesCols::ID . "
              AND s." . SamplesCols::ESTADO . " = '{$eActivo}'
              AND s." . SamplesCols::RUTA_PREVIEW . " IS NOT NULL
            ORDER BY s." . SamplesCols::TOTAL_REPRODUCCIONES . " DESC NULLS LAST
            LIMIT 1
        ) sq) AS sample_adjunto_json";
    }

    /* Fetch una seccion con orden especifico, excluyendo IDs ya usados (dedup) */
    private static function fetchSeccionOrdenada(
        string $selectBase,
        string $tipo,
        int $limit,
        array $idsUsados
    ): array {
        $exclusion = self::buildExclusion($idsUsados);
        $params = \array_merge(['limit' => $limit], $exclusion['params']);

        switch ($tipo) {
            case 'inteligente':
                /* QL14: +3.0 bonus para canciones con sample adjunto reproducible */
                $ts = SamplesCols::TABLA;
                $eActivo = SamplesEnums::ESTADO_ACTIVO;
                $order = "ORDER BY (
                    LN(c." . CancionesCols::TOTAL_SAMPLEADA . " + 1) * 3.0
                    + GREATEST(0, 1.0 - EXTRACT(EPOCH FROM (NOW() - c." . CancionesCols::CREATED_AT . ")) / 31536000.0) * 2.0
                    + RANDOM() * 1.5
                    + (CASE WHEN EXISTS (
                        SELECT 1 FROM {$ts} s
                        WHERE s." . SamplesCols::CANCION_ORIGEN_ID . " = c." . CancionesCols::ID . "
                          AND s." . SamplesCols::ESTADO . " = '{$eActivo}'
                          AND s." . SamplesCols::RUTA_PREVIEW . " IS NOT NULL
                    ) THEN 3.0 ELSE 0.0 END)
                ) DESC";
                break;
            case 'tendencia':
                $order = "ORDER BY c." . CancionesCols::TOTAL_LIKES . " DESC, c." . CancionesCols::TOTAL_SAMPLEADA . " DESC";
                break;
            default: /* top */
                $order = "ORDER BY c." . CancionesCols::TOTAL_SAMPLEADA . " DESC";
                break;
        }

        $sql = "{$selectBase} WHERE 1=1 {$exclusion['sql']} {$order} LIMIT :limit";
        return static::consultar($sql, $params);
    }

    /* Fetch canciones de un genero especifico con dedup */
    private static function fetchSeccionGenero(
        string $selectBase,
        string $genero,
        int $limit,
        array $idsUsados
    ): array {
        $exclusion = self::buildExclusion($idsUsados);
        $params = \array_merge(
            ['genero' => $genero, 'limit' => $limit],
            $exclusion['params']
        );

        $sql = "{$selectBase}
                WHERE c." . CancionesCols::GENERO . " = :genero
                {$exclusion['sql']}
                ORDER BY c." . CancionesCols::TOTAL_SAMPLEADA . " DESC
                LIMIT :limit";

        return static::consultar($sql, $params);
    }

    /* Top generos por cantidad de canciones, minimo 5 para que la seccion tenga contenido */
    private static function generosPopulares(int $limit = 6): array
    {
        $tc = CancionesCols::TABLA;
        $rows = static::consultar(
            "SELECT " . CancionesCols::GENERO . " AS genero, COUNT(*) AS total
             FROM {$tc}
             WHERE " . CancionesCols::GENERO . " IS NOT NULL
               AND " . CancionesCols::GENERO . " != ''
             GROUP BY " . CancionesCols::GENERO . "
             HAVING COUNT(*) >= 5
             ORDER BY total DESC
             LIMIT :limit",
            ['limit' => $limit]
        );
        return \array_map(fn($r) => $r['genero'], $rows);
    }

    /* Exclusion parametrizada con array PG para dedup entre secciones */
    private static function buildExclusion(array $idsUsados): array
    {
        if (empty($idsUsados)) {
            return ['sql' => '', 'params' => []];
        }
        $pgArray = '{' . \implode(',', \array_map('intval', $idsUsados)) . '}';
        return [
            'sql'    => ' AND NOT (c.' . CancionesCols::ID . ' = ANY(:ids_excluidos::int[]))',
            'params' => ['ids_excluidos' => $pgArray],
        ];
    }

    /* Acumula IDs de canciones para tracking de dedup entre secciones */
    private static function acumularIds(array &$idsUsados, array $items): void
    {
        foreach ($items as $item) {
            $idsUsados[] = (int) $item['id'];
        }
    }
}
