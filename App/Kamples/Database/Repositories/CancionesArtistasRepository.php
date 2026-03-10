<?php

/**
 * CancionesArtistasRepository — Acceso a datos para tabla 'canciones_artistas'.
 *
 * SECCION AUTO-GENERADA: Los metodos base se regeneran con schema:generate.
 * SECCION CUSTOM: Todo debajo de la marca CUSTOM se preserva al regenerar.
 *
 * @package Kamples
 */

namespace App\Kamples\Database\Repositories;

use App\Config\Schema\_generated\CancionesArtistasCols;
use App\Config\Schema\_generated\CancionesArtistasEnums;
use App\Config\Schema\_generated\CancionesArtistasDTO;
use App\Config\Schema\_generated\ArtistasMusicalesCols;
use App\Config\Schema\_generated\CancionesCols;

class CancionesArtistasRepository extends BaseRepository
{
    protected static function tabla(): string
    {
        return CancionesArtistasCols::TABLA;
    }

    /* PK compuesta: no aplica colId para buscar por un solo ID */
    protected static function colId(): string
    {
        return CancionesArtistasCols::CANCION_ID;
    }


    /* === METODOS CUSTOM (seguro para editar debajo de esta linea) === */

        /**
     * Artistas de una canción con sus roles.
     */
    public static function artistasDeCancion(int $cancionId): array
    {
        $tr = CancionesArtistasCols::TABLA;
        $ta = ArtistasMusicalesCols::TABLA;

        return static::consultar(
            "SELECT ca.*, a.nombre AS nombre, a.slug AS slug
             FROM {$tr} ca
             JOIN {$ta} a ON ca." . CancionesArtistasCols::ARTISTA_ID . " = a.id
             WHERE ca." . CancionesArtistasCols::CANCION_ID . " = :cancion_id
             ORDER BY CASE ca." . CancionesArtistasCols::ROL . "
                WHEN '" . CancionesArtistasEnums::ROL_PRINCIPAL . "' THEN 1
                WHEN '" . CancionesArtistasEnums::ROL_FEATURING . "' THEN 2
                WHEN '" . CancionesArtistasEnums::ROL_PRODUCER . "' THEN 3
             END",
            ['cancion_id' => $cancionId]
        );
    }

    /**
     * Canciones de un artista (todos los roles).
     */
    public static function cancionesDeArtista(int $artistaId, int $limit = 50): array
    {
        $tr = CancionesArtistasCols::TABLA;
        $tc = CancionesCols::TABLA;

        return static::consultar(
            "SELECT DISTINCT ON (c.id) c.*, ca." . CancionesArtistasCols::ROL . " AS rol
             FROM {$tr} ca
             JOIN {$tc} c ON ca." . CancionesArtistasCols::CANCION_ID . " = c.id
             WHERE ca." . CancionesArtistasCols::ARTISTA_ID . " = :artista_id
             ORDER BY c.id, c.anio DESC NULLS LAST
             LIMIT :limit",
            ['artista_id' => $artistaId, 'limit' => $limit]
        );
    }

    /**
     * Insertar relación canción-artista ignorando duplicados (PK compuesta).
     */
    public static function insertarSiNoExiste(int $cancionId, int $artistaId, string $rol = CancionesArtistasEnums::ROL_PRINCIPAL): int
    {
        $tabla = CancionesArtistasCols::TABLA;

        return static::ejecutar(
            "INSERT INTO {$tabla} (" . CancionesArtistasCols::CANCION_ID . ", "
            . CancionesArtistasCols::ARTISTA_ID . ", " . CancionesArtistasCols::ROL . ") "
            . "VALUES (:cancion_id, :artista_id, :rol) "
            . "ON CONFLICT (" . CancionesArtistasCols::CANCION_ID . ", "
            . CancionesArtistasCols::ARTISTA_ID . ", " . CancionesArtistasCols::ROL . ") DO NOTHING",
            ['cancion_id' => $cancionId, 'artista_id' => $artistaId, 'rol' => $rol]
        );
    }
}
