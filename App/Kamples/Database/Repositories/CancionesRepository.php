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
     */
    public static function buscarTexto(string $query, int $limit = 20): array
    {
        $tc = CancionesCols::TABLA;
        $ta = ArtistasMusicalesCols::TABLA;

        return static::consultar(
            "SELECT c.*, a.nombre AS artista_nombre
             FROM {$tc} c
             JOIN {$ta} a ON c." . CancionesCols::ARTISTA_ID . " = a.id
             WHERE to_tsvector('simple', c." . CancionesCols::TITULO . " || ' ' || a.nombre || ' ' || COALESCE(c." . CancionesCols::ALBUM . ", ''))
                @@ plainto_tsquery('simple', :query)
             ORDER BY (c." . CancionesCols::TOTAL_SAMPLEADA . " + c." . CancionesCols::TOTAL_SAMPLEA . ") DESC
             LIMIT :limit",
            ['query' => $query, 'limit' => $limit]
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
        $ta = ArtistasMusicalesCols::TABLA;
        $offset = ($pagina - 1) * $porPagina;

        /*
         * Subquery correlacionada para reaccion del usuario autenticado.
         * Misma tecnica que NormalizadorSample::sqlSelectSamples().
         * $userId es ?int tipado estricto, casteado a int por seguridad.
         */
        $tipoCancion = LikesEnums::TIPO_CANCION;
        $reaccionExpr = $userId !== null
            ? "(SELECT " . LikesCols::REACCION . " FROM " . LikesCols::TABLA
              . " WHERE " . LikesCols::USUARIO_ID . " = " . (int) $userId
              . " AND " . LikesCols::TIPO . " = '{$tipoCancion}'"
              . " AND " . LikesCols::TARGET_ID . " = c." . CancionesCols::ID . " LIMIT 1)"
            : "NULL";

        /*
         * Subquery correlacionada: primer sample activo con preview vinculado a la cancion.
         * Devuelve JSON con los campos minimos para construir un SampleResumen en el frontend.
         * Usa samples.cancion_origen_id = cancion.id (vinculo directo sample -> cancion).
         */
        $ts = SamplesCols::TABLA;
        $eActivo = SamplesEnums::ESTADO_ACTIVO;
        $sampleAdjuntoExpr = "(SELECT row_to_json(sq) FROM (
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

        $baseSelect = "SELECT c.*, a." . ArtistasMusicalesCols::NOMBRE . " AS artista_nombre,
                        a." . ArtistasMusicalesCols::SLUG . " AS artista_slug,
                        {$reaccionExpr} AS reaccion_usuario,
                        {$sampleAdjuntoExpr}
                 FROM {$tc} c
                 JOIN {$ta} a ON c." . CancionesCols::ARTISTA_ID . " = a." . ArtistasMusicalesCols::ID;

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
                 */
                $tl = LikesCols::TABLA;
                $sql = "SELECT c.*, a." . ArtistasMusicalesCols::NOMBRE . " AS artista_nombre,
                               a." . ArtistasMusicalesCols::SLUG . " AS artista_slug,
                               {$reaccionExpr} AS reaccion_usuario,
                               {$sampleAdjuntoExpr},
                               COALESCE(lr.likes_recientes, 0) AS likes_recientes
                        FROM {$tc} c
                        JOIN {$ta} a ON c." . CancionesCols::ARTISTA_ID . " = a." . ArtistasMusicalesCols::ID . "
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
                 * Algoritmo heuristico: puntaje = log(total_sampleada+1) * 3 + freshness * 2 + random.
                 * freshness = 1 - (dias_desde_creacion / 365), clamped 0..1.
                 * Variable aleatoria (md5 rotativo) para diversidad sin ser completamente random.
                 * Esto produce un feed mezclado que prioriza canciones relevantes + recientes.
                 */
                $sql = $baseSelect . "
                        ORDER BY (
                            LN(c." . CancionesCols::TOTAL_SAMPLEADA . " + 1) * 3.0
                            + GREATEST(0, 1.0 - EXTRACT(EPOCH FROM (NOW() - c." . CancionesCols::CREATED_AT . ")) / 31536000.0) * 2.0
                            + RANDOM() * 1.5
                        ) DESC
                        LIMIT :limit OFFSET :offset";
                break;
        }

        $total = (int) static::consultarValor($countSql);
        $items = static::consultar($sql, ['limit' => $porPagina, 'offset' => $offset]);

        return ['items' => $items, 'total' => $total];
    }
}
