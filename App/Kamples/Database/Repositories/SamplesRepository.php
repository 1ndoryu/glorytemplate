<?php

/**
 * SamplesRepository — Acceso a datos para tabla 'samples'.
 *
 * SECCION AUTO-GENERADA: Los metodos base se regeneran con schema:generate.
 * SECCION CUSTOM: Todo debajo de la marca CUSTOM se preserva al regenerar.
 *
 * @package Kamples
 */

namespace App\Kamples\Database\Repositories;

use App\Config\Schema\_generated\SamplesCols;
use App\Config\Schema\_generated\SamplesEnums;
use App\Config\Schema\_generated\SamplesDTO;
use App\Config\Schema\_generated\LikesCols;
use App\Config\Schema\_generated\LikesEnums;
use App\Config\Schema\_generated\ColeccionSamplesCols;
use App\Config\Schema\_generated\ReproduccionesCols;
use App\Config\Schema\_generated\DescargasCols;
use App\Kamples\Api\Helpers\NormalizadorSample;
use App\Kamples\Database\Repositories\LikesRepository;
use App\Kamples\Database\Repositories\ColeccionSamplesRepository;
use App\Kamples\Database\Repositories\ReproduccionesRepository;
use App\Kamples\Database\Repositories\DescargasRepository;

class SamplesRepository extends BaseRepository
{
    protected static function tabla(): string
    {
        return SamplesCols::TABLA;
    }

    protected static function colId(): string
    {
        return SamplesCols::ID;
    }

    /*
     * Buscar registros con estado activo, paginados.
     */
    public static function buscarActivos(int $limit = 20, int $offset = 0): array
    {
        $tabla = SamplesCols::TABLA;
        $colEstado = SamplesCols::ESTADO;

        return static::consultar(
            "SELECT * FROM {$tabla} WHERE {$colEstado} = :estado ORDER BY id DESC LIMIT :limit OFFSET :offset",
            [
                'estado' => SamplesEnums::ESTADO_ACTIVO,
                'limit' => $limit,
                'offset' => $offset,
            ]
        );
    }

    /*
     * Buscar registros del creador dado.
     */
    public static function buscarPorCreador(int $creadorId, int $limit = 20, int $offset = 0): array
    {
        $tabla = SamplesCols::TABLA;
        $col = SamplesCols::CREADOR_ID;

        return static::consultar(
            "SELECT * FROM {$tabla} WHERE {$col} = :creadorId ORDER BY id DESC LIMIT :limit OFFSET :offset",
            ['creadorId' => $creadorId, 'limit' => $limit, 'offset' => $offset]
        );
    }

    /*
     * Buscar registros mas recientes.
     */
    public static function buscarRecientes(int $limit = 20): array
    {
        $tabla = SamplesCols::TABLA;

        return static::consultar(
            "SELECT * FROM {$tabla} ORDER BY created_at DESC LIMIT :limit",
            ['limit' => $limit]
        );
    }

    /* === METODOS CUSTOM (seguro para editar debajo de esta linea) === */

    /*
     * Obtener solo las tags de un sample.
     */
    public static function obtenerTags(int $id): ?array
    {
        $tabla = SamplesCols::TABLA;

        return static::consultarUno(
            "SELECT " . SamplesCols::TAGS . " FROM {$tabla} WHERE " . SamplesCols::ID . " = :id",
            ['id' => $id]
        );
    }

    /*
     * Buscar sugerencias de samples basadas en contexto de tags, BPM y key.
     * Excluye IDs dados. Scoring: tags comunes + proximidad BPM + match key.
     *
     * @param array $topTags Tags más frecuentes del contexto
     * @param int $avgBpm BPM promedio del contexto
     * @param string|null $dominantKey Key dominante
     * @param array $idsExcluir IDs de samples a excluir
     * @param int $limit
     * @param int $offset
     */
    public static function sugerenciasPorContexto(
        array $topTags,
        int $avgBpm,
        ?string $dominantKey,
        array $idsExcluir,
        int $limit,
        int $offset
    ): array {
        $estadoActivo = SamplesEnums::ESTADO_ACTIVO;
        $params = ['limit' => $limit, 'offset' => $offset, 'avgBpm' => $avgBpm];

        /* Construir exclusiones parametrizadas */
        $excludeClause = '';
        if (!empty($idsExcluir)) {
            $excludeParts = [];
            foreach ($idsExcluir as $idx => $exId) {
                $key = "excl{$idx}";
                $excludeParts[] = ":{$key}";
                $params[$key] = (int) $exId;
            }
            $excludeClause = "AND s." . SamplesCols::ID . " NOT IN (" . implode(',', $excludeParts) . ")";
        }

        /* Scoring por tags */
        $tagConditions = [];
        foreach ($topTags as $i => $tag) {
            $tagConditions[] = "CASE WHEN :tag{$i} = ANY(s." . SamplesCols::TAGS . ") THEN 1 ELSE 0 END";
            $params["tag{$i}"] = $tag;
        }
        $tagScore = !empty($tagConditions) ? '(' . implode(' + ', $tagConditions) . ')' : '0';

        /* Scoring por key */
        $keyScore = '0';
        if ($dominantKey) {
            $keyScore = "CASE WHEN s." . SamplesCols::KEY . " = :domKey THEN 3 ELSE 0 END";
            $params['domKey'] = $dominantKey;
        }

        $sql = NormalizadorSample::sqlSelectSamples()
             . " WHERE s." . SamplesCols::ESTADO . " = '{$estadoActivo}' {$excludeClause}"
             . " ORDER BY ({$tagScore} + {$keyScore} + CASE WHEN s." . SamplesCols::BPM . " IS NOT NULL THEN GREATEST(0, 5 - ABS(s." . SamplesCols::BPM . " - :avgBpm) / 10) ELSE 0 END) DESC,"
             . " s." . SamplesCols::TOTAL_LIKES . " DESC, s." . SamplesCols::PUBLICADO_AT . " DESC"
             . " LIMIT :limit OFFSET :offset";

        return static::consultar($sql, $params);
    }

    /*
     * Buscar sample activo para descarga (campos mínimos necesarios).
     */
    public static function buscarParaDescarga(int $id): ?array
    {
        $tabla = SamplesCols::TABLA;
        $activo = SamplesEnums::ESTADO_ACTIVO;

        return static::consultarUno(
            "SELECT " . SamplesCols::ID . ", " . SamplesCols::TITULO
            . ", " . SamplesCols::RUTA_ORIGINAL . ", " . SamplesCols::RUTA_OPTIMIZADA
            . ", " . SamplesCols::PERMITIR_DESCARGA . ", " . SamplesCols::ES_PREMIUM
            . ", " . SamplesCols::CREADOR_ID
            . " FROM {$tabla} WHERE " . SamplesCols::ID . " = :id AND " . SamplesCols::ESTADO . " = '{$activo}'",
            ['id' => $id]
        );
    }

    /*
     * Incrementar contador de descargas del sample.
     */
    public static function incrementarDescargas(int $id): void
    {
        $tabla = SamplesCols::TABLA;

        static::ejecutar(
            "UPDATE {$tabla} SET " . SamplesCols::TOTAL_DESCARGAS . " = " . SamplesCols::TOTAL_DESCARGAS . " + 1 WHERE " . SamplesCols::ID . " = :id",
            ['id' => $id]
        );
    }

    /*
     * Buscar sample para modificacion (verificar propiedad).
     * Solo devuelve id y creador_id de samples no eliminados.
     */
    public static function buscarParaModificacion(int $id): ?array
    {
        $tabla = SamplesCols::TABLA;
        $eliminado = SamplesEnums::ESTADO_ELIMINADO;

        return static::consultarUno(
            "SELECT " . SamplesCols::ID . ", " . SamplesCols::CREADOR_ID
            . ", " . SamplesCols::TITULO . ", " . SamplesCols::SLUG
            . " FROM {$tabla} WHERE " . SamplesCols::ID . " = :id AND " . SamplesCols::ESTADO . " != '{$eliminado}'",
            ['id' => $id]
        );
    }

    /*
     * Actualizar campos dinámicos de un sample.
     * $campos es array de "columna = :param", $params incluye los valores + id.
     */
    public static function actualizarCampos(int $id, array $campos, array $params): void
    {
        $tabla = SamplesCols::TABLA;
        $params['id'] = $id;

        static::ejecutar(
            "UPDATE {$tabla} SET " . implode(', ', $campos) . ", " . SamplesCols::UPDATED_AT . " = NOW() WHERE " . SamplesCols::ID . " = :id",
            $params
        );
    }

    /*
     * Buscar sample completo para eliminación (incluye rutas de archivos).
     */
    public static function buscarParaEliminar(int $id): ?array
    {
        $tabla = SamplesCols::TABLA;

        return static::consultarUno(
            "SELECT " . SamplesCols::ID . ", " . SamplesCols::CREADOR_ID
            . ", " . SamplesCols::RUTA_ORIGINAL . ", " . SamplesCols::RUTA_OPTIMIZADA
            . ", " . SamplesCols::RUTA_PREVIEW . ", " . SamplesCols::RUTA_WAVEFORM
            . ", " . SamplesCols::TITULO
            . " FROM {$tabla} WHERE " . SamplesCols::ID . " = :id",
            ['id' => $id]
        );
    }

    /*
     * Eliminar un sample y sus registros relacionados en cascada.
     * Delega las eliminaciones dependientes a cada repositorio.
     */
    public static function eliminarConCascada(int $sampleId): void
    {
        LikesRepository::eliminarPorSample($sampleId);
        ColeccionSamplesRepository::eliminarPorSample($sampleId);
        ReproduccionesRepository::eliminarPorSample($sampleId);
        DescargasRepository::eliminarPorSample($sampleId);

        $tabla = SamplesCols::TABLA;
        static::ejecutar(
            "DELETE FROM {$tabla} WHERE " . SamplesCols::ID . " = :id",
            ['id' => $sampleId]
        );
    }

    /*
     * Obtener sample normalizado por ID (con datos de usuario via NormalizadorSample).
     */
    public static function buscarNormalizadoPorId(int $id, ?int $usuarioId = null): ?array
    {
        return static::consultarUno(
            NormalizadorSample::sqlSelectSamples($usuarioId) . " WHERE s." . SamplesCols::ID . " = :id",
            ['id' => $id]
        );
    }
}
