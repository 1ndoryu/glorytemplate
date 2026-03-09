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
        return static::consultarUno(
            "SELECT * FROM " . ArtistasMusicalesCols::TABLA
            . " WHERE " . ArtistasMusicalesCols::WHOSAMPLED_SLUG . " = :slug",
            ['slug' => $slug]
        );
    }

    /**
     * Buscar artista por slug interno de Kamples.
     */
    public static function buscarPorSlug(string $slug): ?array
    {
        return static::consultarUno(
            "SELECT * FROM " . ArtistasMusicalesCols::TABLA
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

        return static::consultar(
            "SELECT * FROM {$tabla} ORDER BY "
            . ArtistasMusicalesCols::TOTAL_CANCIONES . " DESC LIMIT :limit",
            ['limit' => $limit]
        );
    }
}
