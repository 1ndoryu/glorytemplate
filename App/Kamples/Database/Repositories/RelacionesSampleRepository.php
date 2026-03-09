<?php

/**
 * RelacionesSampleRepository — Acceso a datos para tabla 'relaciones_sample'.
 *
 * SECCION AUTO-GENERADA: Los metodos base se regeneran con schema:generate.
 * SECCION CUSTOM: Todo debajo de la marca CUSTOM se preserva al regenerar.
 *
 * @package Kamples
 */

namespace App\Kamples\Database\Repositories;

use App\Config\Schema\_generated\RelacionesSampleCols;
use App\Config\Schema\_generated\RelacionesSampleEnums;
use App\Config\Schema\_generated\RelacionesSampleDTO;

class RelacionesSampleRepository extends BaseRepository
{
    protected static function tabla(): string
    {
        return RelacionesSampleCols::TABLA;
    }

    protected static function colId(): string
    {
        return RelacionesSampleCols::ID;
    }

    /*
     * Buscar registros mas recientes.
     */
    public static function buscarRecientes(int $limit = 20): array
    {
        $tabla = RelacionesSampleCols::TABLA;

        return static::consultar(
            "SELECT * FROM {$tabla} ORDER BY " . RelacionesSampleCols::CREATED_AT . " DESC LIMIT :limit",
            ['limit' => $limit]
        );
    }

    /* === METODOS CUSTOM (seguro para editar debajo de esta linea) === */

        /**
     * Verificar si una relación de WhoSampled ya existe (dedup).
     */
    public static function buscarPorWhosampledId(int $wsId): ?array
    {
        return static::consultarUno(
            "SELECT * FROM " . RelacionesSampleCols::TABLA
            . " WHERE " . RelacionesSampleCols::WHOSAMPLED_ID . " = :ws_id",
            ['ws_id' => $wsId]
        );
    }

    /**
     * Relaciones donde una canción es DESTINO (usa samples de otras).
     * Incluye info de canción fuente y artista.
     */
    public static function samplesDe(int $cancionDestinoId, int $limit = 50): array
    {
        $tr = RelacionesSampleCols::TABLA;
        $tc = \App\Config\Schema\_generated\CancionesCols::TABLA;
        $ta = \App\Config\Schema\_generated\ArtistasMusicalesCols::TABLA;

        return static::consultar(
            "SELECT r.*, c.titulo AS fuente_titulo, c.slug AS fuente_slug,
                    c.anio AS fuente_anio, c.imagen_url AS fuente_imagen,
                    a.nombre AS fuente_artista
             FROM {$tr} r
             JOIN {$tc} c ON r." . RelacionesSampleCols::CANCION_FUENTE_ID . " = c.id
             JOIN {$ta} a ON c.artista_id = a.id
             WHERE r." . RelacionesSampleCols::CANCION_DESTINO_ID . " = :cancion_id
             ORDER BY r." . RelacionesSampleCols::CREATED_AT . " DESC
             LIMIT :limit",
            ['cancion_id' => $cancionDestinoId, 'limit' => $limit]
        );
    }

    /**
     * Relaciones donde una canción es FUENTE (sampleada por otras).
     * Incluye info de canción destino y artista.
     */
    public static function sampleadaEn(int $cancionFuenteId, int $limit = 50): array
    {
        $tr = RelacionesSampleCols::TABLA;
        $tc = \App\Config\Schema\_generated\CancionesCols::TABLA;
        $ta = \App\Config\Schema\_generated\ArtistasMusicalesCols::TABLA;

        return static::consultar(
            "SELECT r.*, c.titulo AS destino_titulo, c.slug AS destino_slug,
                    c.anio AS destino_anio, c.imagen_url AS destino_imagen,
                    a.nombre AS destino_artista
             FROM {$tr} r
             JOIN {$tc} c ON r." . RelacionesSampleCols::CANCION_DESTINO_ID . " = c.id
             JOIN {$ta} a ON c.artista_id = a.id
             WHERE r." . RelacionesSampleCols::CANCION_FUENTE_ID . " = :cancion_id
             ORDER BY r." . RelacionesSampleCols::CREATED_AT . " DESC
             LIMIT :limit",
            ['cancion_id' => $cancionFuenteId, 'limit' => $limit]
        );
    }

    /**
     * Insertar relación ignorando si ya existe (UNIQUE constraint).
     * Retorna ID si se insertó, null si ya existía.
     */
    public static function insertarSiNoExiste(array $datos): ?int
    {
        $tabla = RelacionesSampleCols::TABLA;
        $columnas = array_keys($datos);
        $placeholders = array_map(fn($c) => ':' . $c, $columnas);

        $sql = "INSERT INTO {$tabla} (" . implode(', ', $columnas) . ") "
             . "VALUES (" . implode(', ', $placeholders) . ") "
             . "ON CONFLICT (" . RelacionesSampleCols::WHOSAMPLED_ID . ") DO NOTHING "
             . "RETURNING " . RelacionesSampleCols::ID;

        return static::insertar($sql, $datos);
    }

    /**
     * Estadísticas generales: total por tipo_relacion.
     */
    public static function estadisticasPorTipo(): array
    {
        $tabla = RelacionesSampleCols::TABLA;

        return static::consultar(
            "SELECT " . RelacionesSampleCols::TIPO_RELACION . " AS tipo,
                    COUNT(*) AS total
             FROM {$tabla}
             GROUP BY " . RelacionesSampleCols::TIPO_RELACION
        );
    }
}
