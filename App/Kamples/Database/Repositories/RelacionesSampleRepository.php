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
use App\Config\Schema\_generated\CancionesCols;
use App\Config\Schema\_generated\ArtistasMusicalesCols;

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
        $cols = implode(', ', RelacionesSampleCols::TODAS);

        return static::consultarUno(
            "SELECT {$cols} FROM " . RelacionesSampleCols::TABLA
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
        $tc = CancionesCols::TABLA;
        $ta = ArtistasMusicalesCols::TABLA;

        return static::consultar(
            "SELECT r.*, c.titulo AS cancion_titulo, c.slug AS cancion_slug,
                    c.anio AS cancion_anio, c.imagen_url AS cancion_imagen_url,
                    a.nombre AS artista_nombre, a.slug AS artista_slug
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
        $tc = CancionesCols::TABLA;
        $ta = ArtistasMusicalesCols::TABLA;

        return static::consultar(
            "SELECT r.*, c.titulo AS cancion_titulo, c.slug AS cancion_slug,
                    c.anio AS cancion_anio, c.imagen_url AS cancion_imagen_url,
                    a.nombre AS artista_nombre, a.slug AS artista_slug
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
     * Insertar relación o actualizar timings/votos si ya existe (whosampled_id).
     * Retorna ID insertado o actualizado, null solo si falla.
     */
    public static function insertarOActualizar(array $datos): ?int
    {
        $tabla = RelacionesSampleCols::TABLA;
        $columnas = array_keys($datos);
        $placeholders = array_map(fn($c) => ':' . $c, $columnas);

        $camposActualizables = [
            RelacionesSampleCols::TIMINGS_DESTINO,
            RelacionesSampleCols::TIMINGS_FUENTE,
            RelacionesSampleCols::VOTOS_TOTAL,
            RelacionesSampleCols::VOTOS_PROMEDIO,
            RelacionesSampleCols::TIPO_ELEMENTO,
            RelacionesSampleCols::APARECE_EN_TODO,
        ];

        $setClausulas = [];
        foreach ($camposActualizables as $campo) {
            if (array_key_exists($campo, $datos)) {
                $setClausulas[] = "{$campo} = EXCLUDED.{$campo}";
            }
        }
        $setClausulas[] = RelacionesSampleCols::UPDATED_AT . " = NOW()";

        $sql = "INSERT INTO {$tabla} (" . implode(', ', $columnas) . ") "
             . "VALUES (" . implode(', ', $placeholders) . ") "
             . "ON CONFLICT (" . RelacionesSampleCols::WHOSAMPLED_ID . ") DO UPDATE SET "
             . implode(', ', $setClausulas) . " "
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
        $tc = CancionesCols::TABLA;
        $ta = ArtistasMusicalesCols::TABLA;

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
             WHERE r." . RelacionesSampleCols::SAMPLE_ID . " = :sample_id
                OR r." . RelacionesSampleCols::SAMPLE_FUENTE_ID . " = :sample_id
                OR r." . RelacionesSampleCols::SAMPLE_DESTINO_ID . " = :sample_id
             LIMIT 1",
            ['sample_id' => $sampleId]
        );
    }

    /**
     * Detalle completo de una relación por su ID.
     * Incluye info de canción fuente, destino, artistas y youtubeId.
     * Se usa para la vista de detalle de sampleo (/sampleo/{id}).
     */
    public static function porRelacionId(int $id): ?array
    {
        $tr = RelacionesSampleCols::TABLA;
        $tc = CancionesCols::TABLA;
        $ta = ArtistasMusicalesCols::TABLA;

        return static::consultarUno(
            "SELECT r.*,
                    cf." . CancionesCols::TITULO . " AS fuente_titulo,
                    cf." . CancionesCols::SLUG . " AS fuente_slug,
                    cf." . CancionesCols::ANIO . " AS fuente_anio,
                    cf." . CancionesCols::IMAGEN_URL . " AS fuente_imagen,
                    cf." . CancionesCols::YOUTUBE_ID . " AS fuente_youtube_id,
                    cf." . CancionesCols::SPOTIFY_ID . " AS fuente_spotify_id,
                    cf." . CancionesCols::ALBUM . " AS fuente_album,
                    cf." . CancionesCols::GENERO . " AS fuente_genero,
                    af." . ArtistasMusicalesCols::NOMBRE . " AS fuente_artista,
                    af." . ArtistasMusicalesCols::SLUG . " AS fuente_artista_slug,
                    cd." . CancionesCols::TITULO . " AS destino_titulo,
                    cd." . CancionesCols::SLUG . " AS destino_slug,
                    cd." . CancionesCols::ANIO . " AS destino_anio,
                    cd." . CancionesCols::IMAGEN_URL . " AS destino_imagen,
                    cd." . CancionesCols::YOUTUBE_ID . " AS destino_youtube_id,
                    cd." . CancionesCols::SPOTIFY_ID . " AS destino_spotify_id,
                    cd." . CancionesCols::ALBUM . " AS destino_album,
                    cd." . CancionesCols::GENERO . " AS destino_genero,
                    ad." . ArtistasMusicalesCols::NOMBRE . " AS destino_artista,
                    ad." . ArtistasMusicalesCols::SLUG . " AS destino_artista_slug
             FROM {$tr} r
             JOIN {$tc} cf ON r." . RelacionesSampleCols::CANCION_FUENTE_ID . " = cf.id
             JOIN {$ta} af ON cf.artista_id = af.id
             JOIN {$tc} cd ON r." . RelacionesSampleCols::CANCION_DESTINO_ID . " = cd.id
             JOIN {$ta} ad ON cd.artista_id = ad.id
             WHERE r." . RelacionesSampleCols::ID . " = :id",
            ['id' => $id]
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
        $tc = CancionesCols::TABLA;
        $ta = ArtistasMusicalesCols::TABLA;
        $tipoSample = RelacionesSampleEnums::TIPO_RELACION_SAMPLE;

        /* CTE recursivo: seguir relaciones fuente → destino (quién sampleó a quién) */
        $sql = "
            WITH RECURSIVE cadena AS (
                SELECT r.id, r.cancion_fuente_id, r.cancion_destino_id,
                       r.tipo_relacion, 1 AS nivel
                FROM {$tr} r
                WHERE r.cancion_fuente_id = :cancion_id
                  AND r.tipo_relacion = '{$tipoSample}'

                UNION ALL

                SELECT r.id, r.cancion_fuente_id, r.cancion_destino_id,
                       r.tipo_relacion, c.nivel + 1 AS nivel
                FROM {$tr} r
                JOIN cadena c ON r.cancion_fuente_id = c.cancion_destino_id
                WHERE c.nivel < :profundidad
                  AND r.tipo_relacion = '{$tipoSample}'
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

    /**
     * Relaciones donde un conjunto de canciones son FUENTE (sampleadas por otras).
     * Incluye info de canción destino y artista — muestra "Quién sampleó al artista".
     */
    public static function relacionesDeCancionesFuente(array $cancionIds, int $limit = 100): array
    {
        if (empty($cancionIds)) {
            return [];
        }

        $tr = RelacionesSampleCols::TABLA;
        $tc = CancionesCols::TABLA;
        $ta = ArtistasMusicalesCols::TABLA;

        /* array_values para reindexar, cast a int para seguridad */
        $idsLimpios = \array_values(\array_map('intval', $cancionIds));
        $placeholders = \implode(',', $idsLimpios);

        return static::consultar(
            "SELECT r.*,
                    cf." . CancionesCols::TITULO . " AS fuente_titulo,
                    cf." . CancionesCols::SLUG . " AS fuente_slug,
                    cf." . CancionesCols::ANIO . " AS fuente_anio,
                    cf." . CancionesCols::IMAGEN_URL . " AS fuente_imagen,
                    af." . ArtistasMusicalesCols::NOMBRE . " AS fuente_artista,
                    af." . ArtistasMusicalesCols::SLUG . " AS fuente_artista_slug,
                    cd." . CancionesCols::TITULO . " AS destino_titulo,
                    cd." . CancionesCols::SLUG . " AS destino_slug,
                    cd." . CancionesCols::ANIO . " AS destino_anio,
                    cd." . CancionesCols::IMAGEN_URL . " AS destino_imagen,
                    ad." . ArtistasMusicalesCols::NOMBRE . " AS destino_artista,
                    ad." . ArtistasMusicalesCols::SLUG . " AS destino_artista_slug
             FROM {$tr} r
             JOIN {$tc} cf ON r." . RelacionesSampleCols::CANCION_FUENTE_ID . " = cf.id
             JOIN {$ta} af ON cf.artista_id = af.id
             JOIN {$tc} cd ON r." . RelacionesSampleCols::CANCION_DESTINO_ID . " = cd.id
             JOIN {$ta} ad ON cd.artista_id = ad.id
             WHERE r." . RelacionesSampleCols::CANCION_FUENTE_ID . " = ANY(ARRAY[{$placeholders}]::int[])
             ORDER BY r." . RelacionesSampleCols::VOTOS_TOTAL . " DESC NULLS LAST
             LIMIT :limit",
            ['limit' => $limit]
        );
    }

    /**
     * Relaciones donde un conjunto de canciones son DESTINO (el artista sampleó a otros).
     * Incluye info de canción fuente y artista — muestra "A quién sampleó el artista".
     */
    public static function relacionesDeCancionesDestino(array $cancionIds, int $limit = 100): array
    {
        if (empty($cancionIds)) {
            return [];
        }

        $tr = RelacionesSampleCols::TABLA;
        $tc = CancionesCols::TABLA;
        $ta = ArtistasMusicalesCols::TABLA;

        $idsLimpios = \array_values(\array_map('intval', $cancionIds));
        $placeholders = \implode(',', $idsLimpios);

        return static::consultar(
            "SELECT r.*,
                    cf." . CancionesCols::TITULO . " AS fuente_titulo,
                    cf." . CancionesCols::SLUG . " AS fuente_slug,
                    cf." . CancionesCols::ANIO . " AS fuente_anio,
                    cf." . CancionesCols::IMAGEN_URL . " AS fuente_imagen,
                    af." . ArtistasMusicalesCols::NOMBRE . " AS fuente_artista,
                    af." . ArtistasMusicalesCols::SLUG . " AS fuente_artista_slug,
                    cd." . CancionesCols::TITULO . " AS destino_titulo,
                    cd." . CancionesCols::SLUG . " AS destino_slug,
                    cd." . CancionesCols::ANIO . " AS destino_anio,
                    cd." . CancionesCols::IMAGEN_URL . " AS destino_imagen,
                    ad." . ArtistasMusicalesCols::NOMBRE . " AS destino_artista,
                    ad." . ArtistasMusicalesCols::SLUG . " AS destino_artista_slug
             FROM {$tr} r
             JOIN {$tc} cf ON r." . RelacionesSampleCols::CANCION_FUENTE_ID . " = cf.id
             JOIN {$ta} af ON cf.artista_id = af.id
             JOIN {$tc} cd ON r." . RelacionesSampleCols::CANCION_DESTINO_ID . " = cd.id
             JOIN {$ta} ad ON cd.artista_id = ad.id
             WHERE r." . RelacionesSampleCols::CANCION_DESTINO_ID . " = ANY(ARRAY[{$placeholders}]::int[])
             ORDER BY r." . RelacionesSampleCols::VOTOS_TOTAL . " DESC NULLS LAST
             LIMIT :limit",
            ['limit' => $limit]
        );
    }

    /* --- Metodos de seed (atribucion legal retroactiva) --- */

    /*
     * Retorna array de IDs de relaciones sin contribuidor_id asignado.
     * Solo relaciones con fuente='scraping' (no tocar contribuciones reales).
     */
    public static function listarIdsSinContribuidor(): array
    {
        $tabla = RelacionesSampleCols::TABLA;

        $filas = static::consultar(
            "SELECT " . RelacionesSampleCols::ID . " FROM {$tabla}"
            . " WHERE " . RelacionesSampleCols::CONTRIBUIDOR_ID . " IS NULL"
            . " AND " . RelacionesSampleCols::FUENTE . " = :fuente",
            ['fuente' => RelacionesSampleEnums::FUENTE_SCRAPING]
        );

        return \array_column($filas, RelacionesSampleCols::ID);
    }

    /*
     * Asigna contribuidor_id a una relacion sin contribuidor y cambia fuente a 'comunidad'.
     * Solo actua si contribuidor_id sigue NULL (idempotente).
     */
    public static function asignarContribuidorSeed(int $relacionId, int $seedUserId): void
    {
        $tabla = RelacionesSampleCols::TABLA;

        static::ejecutar(
            "UPDATE {$tabla} SET "
            . RelacionesSampleCols::CONTRIBUIDOR_ID . " = :userId, "
            . RelacionesSampleCols::FUENTE . " = :fuente "
            . "WHERE " . RelacionesSampleCols::ID . " = :id "
            . "AND " . RelacionesSampleCols::CONTRIBUIDOR_ID . " IS NULL",
            [
                'userId' => $seedUserId,
                'fuente' => RelacionesSampleEnums::FUENTE_COMUNIDAD,
                'id'     => $relacionId,
            ]
        );
    }
}
