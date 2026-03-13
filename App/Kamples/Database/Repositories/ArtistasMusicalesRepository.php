<?php

/**
 * ArtistasMusicalesRepository — Acceso a datos para tabla 'artistas_musicales'.
 *
 * SECCION AUTO-GENERADA: Los metodos base se regeneran con schema:generate.
 * SECCION CUSTOM: Todo debajo de la marca CUSTOM se preserva al regenerar.
 *
 * @package Kamples
 */

namespace App\Kamples\Database\Repositories;

use App\Config\Schema\_generated\ArtistasMusicalesCols;
use App\Config\Schema\_generated\ArtistasMusicalesDTO;

class ArtistasMusicalesRepository extends BaseRepository
{
    protected static function tabla(): string
    {
        return ArtistasMusicalesCols::TABLA;
    }

    protected static function colId(): string
    {
        return ArtistasMusicalesCols::ID;
    }

    /*
     * Buscar registros mas recientes.
     */
    public static function buscarRecientes(int $limit = 20): array
    {
        $tabla = ArtistasMusicalesCols::TABLA;

        return static::consultar(
            "SELECT * FROM {$tabla} ORDER BY " . ArtistasMusicalesCols::CREATED_AT . " DESC LIMIT :limit",
            ['limit' => $limit]
        );
    }

    /* === METODOS CUSTOM (seguro para editar debajo de esta linea) === */

                        /**
     * Buscar artista por slug de WhoSampled (dedup en scraping).
     */
    public static function buscarPorSlugWhosampled(string $slug): ?array
    {
        $cols = implode(', ', ArtistasMusicalesCols::TODAS);

        return static::consultarUno(
            "SELECT {$cols} FROM " . ArtistasMusicalesCols::TABLA
            . " WHERE " . ArtistasMusicalesCols::WHOSAMPLED_SLUG . " = :slug",
            ['slug' => $slug]
        );
    }

    /**
     * Buscar artista por slug interno de Kamples.
     */
    public static function buscarPorSlug(string $slug): ?array
    {
        $cols = implode(', ', ArtistasMusicalesCols::TODAS);

        return static::consultarUno(
            "SELECT {$cols} FROM " . ArtistasMusicalesCols::TABLA
            . " WHERE " . ArtistasMusicalesCols::SLUG . " = :slug",
            ['slug' => $slug]
        );
    }

    /**
     * Upsert: insertar o actualizar artista por whosampled_slug.
     * Retorna el ID del artista (existente o nuevo).
     */
    public static function upsertPorWhosampled(array $datos): ?int
    {
        $tabla = ArtistasMusicalesCols::TABLA;
        $wsSlug = ArtistasMusicalesCols::WHOSAMPLED_SLUG;

        $existente = static::buscarPorSlugWhosampled($datos[$wsSlug] ?? '');
        if ($existente) {
            return (int) $existente[ArtistasMusicalesCols::ID];
        }

        return static::insertarRegistro($datos);
    }

    /**
     * Top artistas por total de canciones sampleadas.
     */
    public static function topPorCanciones(int $limit = 50): array
    {
        $tabla = ArtistasMusicalesCols::TABLA;
        $cols = implode(', ', ArtistasMusicalesCols::TODAS);

        return static::consultar(
            "SELECT {$cols} FROM {$tabla} ORDER BY "
            . ArtistasMusicalesCols::TOTAL_CANCIONES . " DESC LIMIT :limit",
            ['limit' => $limit]
        );
    }

    /**
     * Upsert artista por nombre (contribuciones manuales).
     * Busca por slug normalizado; si no existe lo crea.
     * Retorna el ID del artista o null si falla.
     */
    public static function upsertPorNombre(string $nombre, string $slug): ?int
    {
        $tabla = ArtistasMusicalesCols::TABLA;

        /* Buscar por slug (nombre normalizado) */
        $existente = static::consultarUno(
            "SELECT " . ArtistasMusicalesCols::ID . " FROM {$tabla} WHERE " . ArtistasMusicalesCols::SLUG . " = :slug LIMIT 1",
            ['slug' => $slug]
        );

        if ($existente) {
            return (int) $existente[ArtistasMusicalesCols::ID];
        }

        return static::insertarRegistro([
            ArtistasMusicalesCols::NOMBRE => $nombre,
            ArtistasMusicalesCols::SLUG   => $slug,
        ]);
    }

    /**
     * Lista artistas para el sitemap XML (campos mínimos: slug, updated_at).
     */
    public static function listarParaSitemap(int $limit = 2000, int $offset = 0): array
    {
        $ta = ArtistasMusicalesCols::TABLA;
        $sql = "SELECT " . ArtistasMusicalesCols::SLUG . ", " . ArtistasMusicalesCols::UPDATED_AT
             . " FROM {$ta}"
             . " ORDER BY " . ArtistasMusicalesCols::UPDATED_AT . " DESC"
             . " LIMIT :limit OFFSET :offset";

        return static::consultar($sql, ['limit' => $limit, 'offset' => $offset]);
    }

    /**
     * Cuenta total de artistas para paginación del sitemap.
     */
    public static function contarParaSitemap(): int
    {
        $ta = ArtistasMusicalesCols::TABLA;
        $sql = "SELECT COUNT(*) FROM {$ta}";
        return (int) (static::consultarValor($sql) ?? 0);
    }
}
