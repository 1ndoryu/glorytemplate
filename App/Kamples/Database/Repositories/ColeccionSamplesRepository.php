<?php

/**
 * ColeccionSamplesRepository — Acceso a datos para tabla 'coleccion_samples'.
 *
 * SECCION AUTO-GENERADA: Los metodos base se regeneran con schema:generate.
 * SECCION CUSTOM: Todo debajo de la marca CUSTOM se preserva al regenerar.
 *
 * @package Kamples
 */

namespace App\Kamples\Database\Repositories;

use App\Config\Schema\_generated\ColeccionSamplesCols;
use App\Config\Schema\_generated\ColeccionSamplesDTO;
use App\Config\Schema\_generated\SamplesCols;
use App\Config\Schema\_generated\SamplesEnums;
use App\Kamples\Api\Helpers\NormalizadorSample;

class ColeccionSamplesRepository extends BaseRepository
{
    protected static function tabla(): string
    {
        return ColeccionSamplesCols::TABLA;
    }

    /* PK compuesta — colId no aplica directamente */
    protected static function colId(): string
    {
        return ColeccionSamplesCols::COLECCION_ID;
    }

    /*
     * Buscar registros del usuario dado.
     */
    public static function buscarPorUsuario(int $usuarioId, int $limit = 20, int $offset = 0): array
    {
        $tabla = ColeccionSamplesCols::TABLA;
        $col = ColeccionSamplesCols::USUARIO_ID;

        return static::consultar(
            "SELECT * FROM {$tabla} WHERE {$col} = :usuarioId ORDER BY " . static::colId() . " DESC LIMIT :limit OFFSET :offset",
            ['usuarioId' => $usuarioId, 'limit' => $limit, 'offset' => $offset]
        );
    }

    /* === METODOS CUSTOM (seguro para editar debajo de esta linea) === */

                        

        

    

    /*
     * Obtener samples de una colección con datos normalizados (JOIN samples + usuarios_ext).
     */
    public static function samplesDeColeccion(int $colId, ?int $userId = null): array
    {
        $t = ColeccionSamplesCols::TABLA;
        $estadoActivo = SamplesEnums::ESTADO_ACTIVO;

        $sql = NormalizadorSample::sqlSelectSamples($userId)
             . " JOIN {$t} cs ON cs." . ColeccionSamplesCols::SAMPLE_ID . " = s." . SamplesCols::ID
             . " WHERE cs." . ColeccionSamplesCols::COLECCION_ID . " = :colId AND s." . SamplesCols::ESTADO . " = '{$estadoActivo}'"
             . " ORDER BY cs." . ColeccionSamplesCols::POSICION . " ASC, cs." . ColeccionSamplesCols::ADDED_AT . " DESC";

        return static::consultar($sql, ['colId' => $colId]);
    }

    /*
     * Agregar sample a colección con posición atómica (INSERT...SELECT MAX+1).
     * D2: ON CONFLICT (usuario_id, sample_id) hace MOVE atomico si ya existe en otra coleccion del mismo usuario.
     * Diferentes usuarios pueden tener el mismo sample en sus propias colecciones.
     * La posición se calcula en la misma query para evitar race conditions.
     */
    public static function agregarAtomico(int $colId, int $sampleId, int $userId): void
    {
        $t = ColeccionSamplesCols::TABLA;
        $colIdCol = ColeccionSamplesCols::COLECCION_ID;
        $sampleIdCol = ColeccionSamplesCols::SAMPLE_ID;
        $userIdCol = ColeccionSamplesCols::USUARIO_ID;
        $posCol = ColeccionSamplesCols::POSICION;

        static::ejecutar(
            "INSERT INTO {$t} ({$colIdCol}, {$sampleIdCol}, {$userIdCol}, {$posCol})
             SELECT :colId, :sampleId, :userId, COALESCE(MAX({$posCol}), 0) + 1
             FROM {$t} WHERE {$colIdCol} = :colIdMax
             ON CONFLICT ({$userIdCol}, {$sampleIdCol}) DO UPDATE
             SET {$colIdCol} = EXCLUDED.{$colIdCol},
                 {$posCol} = EXCLUDED.{$posCol},
                 " . ColeccionSamplesCols::ADDED_AT . " = NOW()",
            ['colId' => $colId, 'sampleId' => $sampleId, 'userId' => $userId, 'colIdMax' => $colId]
        );
    }

    /*
     * D2: Mover sample a una coleccion. Retorna estado de la operacion.
     * Scoped al usuario: solo verifica colecciones del mismo usuario.
     * 'ya_en_coleccion' -> idempotente, 'movido' -> estaba en otra, 'agregado' -> no estaba en ninguna.
     */
    public static function moverAColeccion(int $colId, int $sampleId, int $userId): array
    {
        $t = ColeccionSamplesCols::TABLA;

        /* Verificar coleccion actual de este usuario para este sample */
        $actual = static::consultarUno(
            "SELECT " . ColeccionSamplesCols::COLECCION_ID
            . " FROM {$t} WHERE " . ColeccionSamplesCols::SAMPLE_ID . " = :sid"
            . " AND " . ColeccionSamplesCols::USUARIO_ID . " = :uid",
            ['sid' => $sampleId, 'uid' => $userId]
        );

        if ($actual) {
            $colActual = (int) $actual[ColeccionSamplesCols::COLECCION_ID];
            if ($colActual === $colId) {
                return ['accion' => 'ya_en_coleccion', 'coleccionAnterior' => null];
            }
        }

        $colAnterior = $actual ? (int) $actual[ColeccionSamplesCols::COLECCION_ID] : null;

        /* agregarAtomico maneja ON CONFLICT (usuario_id, sample_id) DO UPDATE */
        self::agregarAtomico($colId, $sampleId, $userId);

        return [
            'accion' => $actual ? 'movido' : 'agregado',
            'coleccionAnterior' => $colAnterior,
        ];
    }

    /*
     * Quitar sample de una colección.
     */
    public static function quitar(int $colId, int $sampleId): void
    {
        $t = ColeccionSamplesCols::TABLA;

        static::ejecutar(
            "DELETE FROM {$t} WHERE " . ColeccionSamplesCols::COLECCION_ID . " = :colId AND " . ColeccionSamplesCols::SAMPLE_ID . " = :sampleId",
            ['colId' => $colId, 'sampleId' => $sampleId]
        );
    }

    /*
     * Verificar si un sample ya está en una colección.
     */
    public static function contiene(int $colId, int $sampleId): bool
    {
        $t = ColeccionSamplesCols::TABLA;

        $row = static::consultarUno(
            "SELECT 1 FROM {$t} WHERE " . ColeccionSamplesCols::COLECCION_ID . " = :colId AND " . ColeccionSamplesCols::SAMPLE_ID . " = :sampleId",
            ['colId' => $colId, 'sampleId' => $sampleId]
        );

        return $row !== null;
    }

    /*
     * Obtener IDs de samples en una colección.
     */
    public static function idsDeColeccion(int $colId): array
    {
        $t = ColeccionSamplesCols::TABLA;

        return static::consultar(
            "SELECT " . ColeccionSamplesCols::SAMPLE_ID . " FROM {$t} WHERE " . ColeccionSamplesCols::COLECCION_ID . " = :colId",
            ['colId' => $colId]
        );
    }

    /*
     * Obtener contexto de tags/BPM/key de los samples de una colección (para sugerencias).
     */
    public static function contextoParaSugerencias(int $colId): array
    {
        $t = ColeccionSamplesCols::TABLA;
        $ts = SamplesCols::TABLA;
        $estadoActivo = SamplesEnums::ESTADO_ACTIVO;

        return static::consultar(
            "SELECT s." . SamplesCols::TAGS . ", s." . SamplesCols::BPM . ", s." . SamplesCols::KEY . ", s." . SamplesCols::TIPO . "
             FROM {$ts} s
             JOIN {$t} cs ON cs." . ColeccionSamplesCols::SAMPLE_ID . " = s." . SamplesCols::ID . "
             WHERE cs." . ColeccionSamplesCols::COLECCION_ID . " = :colId AND s." . SamplesCols::ESTADO . " = '{$estadoActivo}'",
            ['colId' => $colId]
        );
    }

    /*
     * Eliminar todas las relaciones de un sample en colecciones.
     * Usado en cascada al eliminar un sample.
     */
    public static function eliminarPorSample(int $sampleId): void
    {
        $t = ColeccionSamplesCols::TABLA;

        static::ejecutar(
            "DELETE FROM {$t} WHERE " . ColeccionSamplesCols::SAMPLE_ID . " = :id",
            ['id' => $sampleId]
        );
    }

    /*
     * D2: Obtener coleccion actual de un sample para un usuario.
     * Retorna null si el usuario no tiene este sample en ninguna coleccion.
     */
    public static function coleccionDeSample(int $sampleId, int $userId): ?int
    {
        $t = ColeccionSamplesCols::TABLA;

        $row = static::consultarUno(
            "SELECT " . ColeccionSamplesCols::COLECCION_ID
            . " FROM {$t} WHERE " . ColeccionSamplesCols::SAMPLE_ID . " = :sid"
            . " AND " . ColeccionSamplesCols::USUARIO_ID . " = :uid",
            ['sid' => $sampleId, 'uid' => $userId]
        );

        return $row ? (int) $row[ColeccionSamplesCols::COLECCION_ID] : null;
    }

    /*
     * Contexto de tags/BPM/key de TODOS los samples coleccionados de un usuario.
     * Usado por sugerencias "Más Ideas" en /descargas para considerar coleccionados además de descargas.
     */
    public static function contextoColeccionadosUsuario(int $userId): array
    {
        $t  = ColeccionSamplesCols::TABLA;
        $ts = SamplesCols::TABLA;
        $estadoActivo = SamplesEnums::ESTADO_ACTIVO;

        return static::consultar(
            "SELECT s." . SamplesCols::TAGS . ", s." . SamplesCols::BPM . ", s." . SamplesCols::KEY
            . " FROM {$ts} s"
            . " JOIN {$t} cs ON cs." . ColeccionSamplesCols::SAMPLE_ID . " = s." . SamplesCols::ID
            . " WHERE cs." . ColeccionSamplesCols::USUARIO_ID . " = :uid AND s." . SamplesCols::ESTADO . " = '{$estadoActivo}'",
            ['uid' => $userId]
        );
    }

    /*
     * IDs de samples coleccionados por un usuario (para exclusión en sugerencias).
     */
    public static function idsColeccionadosUsuario(int $userId): array
    {
        $t = ColeccionSamplesCols::TABLA;

        $rows = static::consultar(
            "SELECT DISTINCT " . ColeccionSamplesCols::SAMPLE_ID . " FROM {$t} WHERE " . ColeccionSamplesCols::USUARIO_ID . " = :uid",
            ['uid' => $userId]
        );

        return array_map(fn($r) => (int) $r[ColeccionSamplesCols::SAMPLE_ID], $rows);
    }

    /*
     * D3: Obtener samples de una coleccion padre incluyendo sus subcolecciones.
     * Agrega el campo 'coleccion_origen' para que el frontend distinga heredados.
     */
    public static function samplesConSubcolecciones(int $colId, array $subcoleccionIds, ?int $userId = null): array
    {
        $t = ColeccionSamplesCols::TABLA;
        $estadoActivo = SamplesEnums::ESTADO_ACTIVO;
        $csColId = ColeccionSamplesCols::COLECCION_ID;
        $csSampleId = ColeccionSamplesCols::SAMPLE_ID;
        $csPos = ColeccionSamplesCols::POSICION;
        $csAdded = ColeccionSamplesCols::ADDED_AT;
        $sId = SamplesCols::ID;
        $sEstado = SamplesCols::ESTADO;

        /* Combinar coleccion padre + hijas */
        $todosIds = \array_merge([$colId], $subcoleccionIds);
        $placeholders = [];
        $params = [];
        foreach ($todosIds as $i => $id) {
            $key = "col{$i}";
            $placeholders[] = ":{$key}";
            $params[$key] = (int) $id;
        }
        $inClause = \implode(', ', $placeholders);

        /*
         * sqlSelectSamples retorna "SELECT ... FROM samples s LEFT JOIN usuarios_ext u ON ..."
         * Concatenar columnas extra (cs.coleccion_id) con coma despues del FROM rompe el SQL.
         * Solucion: JOIN coleccion_samples PRIMERO, luego filtrar por estado en WHERE.
         */
        $sql = NormalizadorSample::sqlSelectSamples($userId)
             . " JOIN {$t} cs ON cs.{$csSampleId} = s.{$sId}"
             . " WHERE cs.{$csColId} IN ({$inClause})"
             . " AND s.{$sEstado} = '{$estadoActivo}'"
             . " ORDER BY cs.{$csPos} ASC, cs.{$csAdded} DESC";

        return static::consultar($sql, $params);
    }
}
