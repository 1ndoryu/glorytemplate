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
     * Buscar relación que vincula un sample de Kamples (tabla samples) con canciones.
     * El campo sample_id se establece al extraer audio y crear el sample.
     * Incluye info de canción fuente, destino y artistas.
     */
    public static function porSampleId(int $sampleId): ?array
    {
        $tr = RelacionesSampleCols::TABLA;
        $tc = \App\Config\Schema\_generated\CancionesCols::TABLA;
        $ta = \App\Config\Schema\_generated\ArtistasMusicalesCols::TABLA;

        return static::consultarUno(
            "SELECT r.*,
                    cf.titulo AS fuente_titulo, cf.slug AS fuente_slug,
                    cf.anio AS fuente_anio, cf.imagen_url AS fuente_imagen,
                    af.nombre AS fuente_artista, af.slug AS fuente_artista_slug,
                    cd.titulo AS destino_titulo, cd.slug AS destino_slug,
                    cd.anio AS destino_anio, cd.imagen_url AS destino_imagen,
                    ad.nombre AS destino_artista, ad.slug AS destino_artista_slug
             FROM {$tr} r
             JOIN {$tc} cf ON r." . RelacionesSampleCols::CANCION_FUENTE_ID . " = cf.id
             JOIN {$ta} af ON cf.artista_id = af.id
             JOIN {$tc} cd ON r." . RelacionesSampleCols::CANCION_DESTINO_ID . " = cd.id
             JOIN {$ta} ad ON cd.artista_id = ad.id
             WHERE r." . RelacionesSampleCols::SAMPLE_ID . " = :sample_id",
            ['sample_id' => $sampleId]
        );
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

    /**
     * Cadena de samples: dada una canción, seguir la cadena de relaciones.
     * Explora: canción → fue sampleada por → esa también fue sampleada por → ...
     * Usa CTE recursivo con profundidad máxima para evitar ciclos.
     */
    public static function cadena(int $cancionId, int $profundidad = 5): array
    {
        $tr = RelacionesSampleCols::TABLA;
        $tc = \App\Config\Schema\_generated\CancionesCols::TABLA;
        $ta = \App\Config\Schema\_generated\ArtistasMusicalesCols::TABLA;

        /* CTE recursivo: seguir relaciones fuente → destino (quién sampleó a quién) */
        $sql = "
            WITH RECURSIVE cadena AS (
                SELECT r.id, r.cancion_fuente_id, r.cancion_destino_id,
                       r.tipo_relacion, 1 AS nivel
                FROM {$tr} r
                WHERE r.cancion_fuente_id = :cancion_id
                  AND r.tipo_relacion = 'sample'

                UNION ALL

                SELECT r.id, r.cancion_fuente_id, r.cancion_destino_id,
                       r.tipo_relacion, c.nivel + 1 AS nivel
                FROM {$tr} r
                JOIN cadena c ON r.cancion_fuente_id = c.cancion_destino_id
                WHERE c.nivel < :profundidad
                  AND r.tipo_relacion = 'sample'
            )
            SELECT DISTINCT ON (ca.cancion_destino_id)
                   ca.id, ca.cancion_fuente_id, ca.cancion_destino_id,
                   ca.tipo_relacion, ca.nivel,
                   cf.titulo AS fuente_titulo, cf.slug AS fuente_slug,
                   af.nombre AS fuente_artista,
                   cd.titulo AS destino_titulo, cd.slug AS destino_slug,
                   ad.nombre AS destino_artista
            FROM cadena ca
            JOIN {$tc} cf ON ca.cancion_fuente_id = cf.id
            JOIN {$ta} af ON cf.artista_id = af.id
            JOIN {$tc} cd ON ca.cancion_destino_id = cd.id
            JOIN {$ta} ad ON cd.artista_id = ad.id
            ORDER BY ca.cancion_destino_id, ca.nivel ASC
        ";

        return static::consultar($sql, [
            'cancion_id'  => $cancionId,
            'profundidad' => $profundidad,
        ]);
    }
}
