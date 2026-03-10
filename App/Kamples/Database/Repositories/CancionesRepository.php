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
}
