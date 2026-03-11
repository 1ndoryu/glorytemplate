<?php

/**
 * ColaExtraccionSamplesRepository — Acceso a datos para tabla 'cola_extraccion_samples'.
 *
 * SECCION AUTO-GENERADA: Los metodos base se regeneran con schema:generate.
 * SECCION CUSTOM: Todo debajo de la marca CUSTOM se preserva al regenerar.
 *
 * @package Kamples
 */

namespace App\Kamples\Database\Repositories;

use App\Config\Schema\_generated\ColaExtraccionSamplesCols;
use App\Config\Schema\_generated\ColaExtraccionSamplesEnums;
use App\Config\Schema\_generated\ColaExtraccionSamplesDTO;

class ColaExtraccionSamplesRepository extends BaseRepository
{
    protected static function tabla(): string
    {
        return ColaExtraccionSamplesCols::TABLA;
    }

    protected static function colId(): string
    {
        return ColaExtraccionSamplesCols::ID;
    }

    /*
     * Buscar registros mas recientes.
     */
    public static function buscarRecientes(int $limit = 20): array
    {
        $tabla = ColaExtraccionSamplesCols::TABLA;

        return static::consultar(
            "SELECT * FROM {$tabla} ORDER BY " . ColaExtraccionSamplesCols::CREATED_AT . " DESC LIMIT :limit",
            ['limit' => $limit]
        );
    }

    /* === METODOS CUSTOM (seguro para editar debajo de esta linea) === */

                        /**
     * Obtener elementos pendientes de la cola (para el pipeline de extracción).
     */
    public static function pendientes(int $limit = 10): array
    {
        $tabla = ColaExtraccionSamplesCols::TABLA;
        $cols = implode(', ', ColaExtraccionSamplesCols::TODAS);

        return static::consultar(
            "SELECT {$cols} FROM {$tabla} WHERE "
            . ColaExtraccionSamplesCols::ESTADO . " = :estado AND "
            . ColaExtraccionSamplesCols::INTENTOS . " < 3 "
            . "ORDER BY " . ColaExtraccionSamplesCols::CREATED_AT . " ASC "
            . "LIMIT :limit",
            ['estado' => ColaExtraccionSamplesEnums::ESTADO_PENDIENTE, 'limit' => $limit]
        );
    }

    /**
     * Actualizar estado de un elemento en la cola.
     */
    public static function actualizarEstado(int $id, string $estado, ?string $error = null): bool
    {
        $tabla = ColaExtraccionSamplesCols::TABLA;

        $params = ['id' => $id, 'estado' => $estado];
        $sets = [
            ColaExtraccionSamplesCols::ESTADO . " = :estado",
        ];

        if ($error !== null) {
            $sets[] = ColaExtraccionSamplesCols::ERROR_MENSAJE . " = :error";
            $params['error'] = $error;
        }

        if ($estado === ColaExtraccionSamplesEnums::ESTADO_COMPLETADO || $estado === ColaExtraccionSamplesEnums::ESTADO_ERROR) {
            $sets[] = ColaExtraccionSamplesCols::PROCESADO_AT . " = NOW()";
            $sets[] = ColaExtraccionSamplesCols::INTENTOS . " = " . ColaExtraccionSamplesCols::INTENTOS . " + 1";
        }

        $setSql = implode(', ', $sets);

        $afectadas = static::ejecutar(
            "UPDATE {$tabla} SET {$setSql} WHERE " . ColaExtraccionSamplesCols::ID . " = :id",
            $params
        );

        return $afectadas > 0;
    }

    /**
     * Vincular sample extraído a la relación.
     */
    public static function vincularSample(int $id, int $sampleId, array $datosBpm = []): bool
    {
        $tabla = ColaExtraccionSamplesCols::TABLA;

        $params = [
            'id' => $id,
            'sample_id' => $sampleId,
            'estado' => ColaExtraccionSamplesEnums::ESTADO_COMPLETADO,
        ];
        $sets = [
            ColaExtraccionSamplesCols::SAMPLE_ID . " = :sample_id",
            ColaExtraccionSamplesCols::ESTADO . " = :estado",
            ColaExtraccionSamplesCols::PROCESADO_AT . " = NOW()",
        ];

        if (isset($datosBpm['bpm'])) {
            $sets[] = ColaExtraccionSamplesCols::BPM_DETECTADO . " = :bpm";
            $params['bpm'] = $datosBpm['bpm'];
        }
        if (isset($datosBpm['duracion_compas'])) {
            $sets[] = ColaExtraccionSamplesCols::DURACION_COMPAS_SEG . " = :dur_compas";
            $params['dur_compas'] = $datosBpm['duracion_compas'];
        }
        if (isset($datosBpm['compas_inicio'])) {
            $sets[] = ColaExtraccionSamplesCols::COMPAS_INICIO_SEG . " = :inicio";
            $params['inicio'] = $datosBpm['compas_inicio'];
        }
        if (isset($datosBpm['compas_fin'])) {
            $sets[] = ColaExtraccionSamplesCols::COMPAS_FIN_SEG . " = :fin";
            $params['fin'] = $datosBpm['compas_fin'];
        }

        $setSql = implode(', ', $sets);

        $afectadas = static::ejecutar(
            "UPDATE {$tabla} SET {$setSql} WHERE " . ColaExtraccionSamplesCols::ID . " = :id",
            $params
        );

        return $afectadas > 0;
    }

    /**
     * Items con audio extraido listos para publicar via PipelineAudio PHP.
     */
    public static function extraidos(int $limit = 10): array
    {
        $tabla    = ColaExtraccionSamplesCols::TABLA;
        $tablaRs  = \App\Config\Schema\_generated\RelacionesSampleCols::TABLA;
        $colFuente = \App\Config\Schema\_generated\RelacionesSampleCols::CANCION_FUENTE_ID;
        $colDest   = \App\Config\Schema\_generated\RelacionesSampleCols::CANCION_DESTINO_ID;
        $colContrib = \App\Config\Schema\_generated\RelacionesSampleCols::CONTRIBUIDOR_ID;
        $colRsId   = \App\Config\Schema\_generated\RelacionesSampleCols::ID;
        $colVotos  = \App\Config\Schema\_generated\RelacionesSampleCols::VOTOS_TOTAL;

        return static::consultar(
            "SELECT ce.*, "
            . "rs.{$colFuente}, "
            . "rs.{$colDest}, "
            . "rs.{$colContrib} "
            . "FROM {$tabla} ce "
            . "JOIN {$tablaRs} rs "
            . "ON ce." . ColaExtraccionSamplesCols::RELACION_ID . " = rs.{$colRsId} "
            . "WHERE ce." . ColaExtraccionSamplesCols::ESTADO . " = :estado "
            . "ORDER BY rs.{$colVotos} DESC NULLS LAST, ce." . ColaExtraccionSamplesCols::CREATED_AT . " ASC "
            . "LIMIT :limit",
            ['estado' => ColaExtraccionSamplesEnums::ESTADO_EXTRAIDO, 'limit' => $limit]
        );
    }

    /**
     * Desvincula sample_id de las entradas de cola que lo referencian.
     * Debe llamarse ANTES de eliminar el sample para evitar FK violation.
     */
    public static function desvincularSampleId(int $sampleId): void
    {
        static::ejecutar(
            "UPDATE " . ColaExtraccionSamplesCols::TABLA
            . " SET " . ColaExtraccionSamplesCols::SAMPLE_ID . " = NULL"
            . " WHERE " . ColaExtraccionSamplesCols::SAMPLE_ID . " = :sid",
            ['sid' => $sampleId]
        );
    }

    /**
     * Estadísticas de la cola por estado.
     */
    public static function estadisticasPorEstado(): array
    {
        return static::consultar(
            "SELECT " . ColaExtraccionSamplesCols::ESTADO . " AS estado, COUNT(*) AS total "
            . "FROM " . ColaExtraccionSamplesCols::TABLA
            . " GROUP BY " . ColaExtraccionSamplesCols::ESTADO
        );
    }

    /**
     * Encolar extracción bilateral para una relación.
     * Crea hasta 2 entradas (fuente + destino) con dedup por UNIQUE(relacion_id, lado).
     *
     * @return array IDs de las entradas creadas en la cola.
     */
    public static function encolarBilateral(array $relacion): array
    {
        $tabla = ColaExtraccionSamplesCols::TABLA;
        $ids = [];

        $lados = [
            'fuente' => [
                'youtube_id'  => $relacion['fuente_youtube_id'] ?? null,
                'spotify_id'  => $relacion['fuente_spotify_id'] ?? null,
                'timings'     => $relacion['timings_fuente'] ?? [],
            ],
            'destino' => [
                'youtube_id'  => $relacion['destino_youtube_id'] ?? null,
                'spotify_id'  => $relacion['destino_spotify_id'] ?? null,
                'timings'     => $relacion['timings_destino'] ?? [],
            ],
        ];

        foreach ($lados as $lado => $datos) {
            $ytId = $datos['youtube_id'];
            $spId = $datos['spotify_id'];

            /* Sin fuente de audio, no se puede extraer */
            if (!$ytId && !$spId) {
                continue;
            }

            /* Si ya existe un sample publicado para este lado, no re-extraer */
            $campoSample = $lado === ColaExtraccionSamplesEnums::LADO_FUENTE ? 'sample_fuente_id' : 'sample_destino_id';
            if (!empty($relacion[$campoSample])) {
                continue;
            }

            $timings = \is_string($datos['timings'])
                ? (\json_decode($datos['timings'], true) ?: [])
                : ($datos['timings'] ?: []);
            $timing = !empty($timings) ? (int) $timings[0] : 0;

            /* ON CONFLICT: resetear a pendiente para permitir reprocesamiento */
            $id = static::insertar(
                "INSERT INTO {$tabla} ("
                . ColaExtraccionSamplesCols::RELACION_ID . ", "
                . ColaExtraccionSamplesCols::YOUTUBE_ID . ", "
                . ColaExtraccionSamplesCols::SPOTIFY_ID . ", "
                . ColaExtraccionSamplesCols::TIMING_INICIO_SEG . ", "
                . ColaExtraccionSamplesCols::LADO
                . ") VALUES (:relacion_id, :youtube_id, :spotify_id, :timing, :lado) "
                . "ON CONFLICT (" . ColaExtraccionSamplesCols::RELACION_ID . ", " . ColaExtraccionSamplesCols::LADO . ") DO UPDATE SET "
                . ColaExtraccionSamplesCols::ESTADO . " = '" . ColaExtraccionSamplesEnums::ESTADO_PENDIENTE . "', "
                . ColaExtraccionSamplesCols::RUTA_AUDIO_EXTRAIDO . " = NULL, "
                . ColaExtraccionSamplesCols::METADATA_EXTRACCION . " = NULL, "
                . ColaExtraccionSamplesCols::INTENTOS . " = 0, "
                . ColaExtraccionSamplesCols::ERROR_MENSAJE . " = NULL "
                . "RETURNING " . ColaExtraccionSamplesCols::ID,
                [
                    'relacion_id' => (int) $relacion['id'],
                    'youtube_id'  => $ytId,
                    'spotify_id'  => $spId,
                    'timing'      => $timing,
                    'lado'        => $lado,
                ]
            );

            if ($id) {
                $ids[] = $id;
            }
        }

        return $ids;
    }
}
