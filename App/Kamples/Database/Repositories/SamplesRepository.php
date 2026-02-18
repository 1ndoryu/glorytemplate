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

    /*
     * Obtener info mínima de un sample para notificaciones (creador_id, titulo, slug).
     */
    public static function buscarInfoNotificacion(int $id): ?array
    {
        $tabla = SamplesCols::TABLA;

        return static::consultarUno(
            "SELECT " . SamplesCols::CREADOR_ID . ", " . SamplesCols::TITULO . ", " . SamplesCols::SLUG
            . " FROM {$tabla} WHERE " . SamplesCols::ID . " = :id",
            ['id' => $id]
        );
    }

    /*
     * Buscar info resumida de un sample activo para compartir en mensajes/chat.
     */
    public static function buscarParaCompartir(int $id): ?array
    {
        $tabla = SamplesCols::TABLA;
        $activo = SamplesEnums::ESTADO_ACTIVO;

        return static::consultarUno(
            "SELECT " . SamplesCols::ID . ", " . SamplesCols::TITULO . ", " . SamplesCols::ID_CORTO
            . ", " . SamplesCols::SLUG . ", " . SamplesCols::TIPO . ", " . SamplesCols::BPM . ", " . SamplesCols::KEY
            . " FROM {$tabla} WHERE " . SamplesCols::ID . " = :id AND " . SamplesCols::ESTADO . " = '{$activo}'",
            ['id' => $id]
        );
    }

    /*
     * Total de reproducciones sumadas de todos los samples de un creador.
     */
    public static function totalReproduccionesCreador(int $creadorId): int
    {
        $tabla = SamplesCols::TABLA;

        $row = static::consultarUno(
            "SELECT COALESCE(SUM(" . SamplesCols::TOTAL_REPRODUCCIONES . "), 0) as total"
            . " FROM {$tabla} WHERE " . SamplesCols::CREADOR_ID . " = :userId",
            ['userId' => $creadorId]
        );
        return (int) ($row['total'] ?? 0);
    }

    /*
     * Top samples de un creador por descargas con ingresos.
     */
    public static function topSamplesCreador(int $creadorId, int $limit = 10): array
    {
        $ts = SamplesCols::TABLA;
        $tt = \App\Config\Schema\_generated\TransaccionesCols::TABLA;

        return static::consultar(
            "SELECT s." . SamplesCols::ID . ", s." . SamplesCols::TITULO . ", s." . SamplesCols::SLUG
            . ", s." . SamplesCols::TOTAL_DESCARGAS . " as descargas"
            . ", s." . SamplesCols::TOTAL_REPRODUCCIONES . " as reproducciones"
            . ", s." . SamplesCols::TOTAL_LIKES . " as likes"
            . ", COALESCE((SELECT SUM(t." . \App\Config\Schema\_generated\TransaccionesCols::PAGO_CREADOR
            . ") FROM {$tt} t WHERE t." . \App\Config\Schema\_generated\TransaccionesCols::SAMPLE_ID . " = s." . SamplesCols::ID
            . " AND t." . \App\Config\Schema\_generated\TransaccionesCols::ESTADO . " = 'completed'), 0) as ingresos"
            . " FROM {$ts} s WHERE s." . SamplesCols::CREADOR_ID . " = :userId AND s." . SamplesCols::ESTADO . " = '" . SamplesEnums::ESTADO_ACTIVO . "'"
            . " ORDER BY s." . SamplesCols::TOTAL_DESCARGAS . " DESC LIMIT :limit",
            ['userId' => $creadorId, 'limit' => $limit]
        );
    }

    /*
     * Incrementar total_reproducciones de un sample.
     */
    public static function incrementarReproducciones(int $sampleId): void
    {
        $tabla = SamplesCols::TABLA;

        static::ejecutar(
            "UPDATE {$tabla} SET " . SamplesCols::TOTAL_REPRODUCCIONES . " = "
            . SamplesCols::TOTAL_REPRODUCCIONES . " + 1 WHERE " . SamplesCols::ID . " = :id",
            ['id' => $sampleId]
        );
    }

    /*
     * Obtener metadata mínima de un sample para calcular similares.
     */
    public static function buscarMetadataParaSimilares(int $sampleId): ?array
    {
        $tabla = SamplesCols::TABLA;

        return static::consultarUno(
            "SELECT " . SamplesCols::TAGS . ", " . SamplesCols::BPM . ", "
            . SamplesCols::KEY . ", " . SamplesCols::TIPO
            . " FROM {$tabla} WHERE " . SamplesCols::ID . " = :id",
            ['id' => $sampleId]
        );
    }

    /*
     * Buscar samples similares por scoring de tags, key, tipo y proximidad BPM.
     * Se usa en el endpoint de similares y "También te podría gustar".
     */
    public static function buscarSimilares(int $sampleId, array $tags, int $bpm, ?string $key, string $tipo, int $limite = 5): array
    {
        $params = ['sampleId' => $sampleId, 'limit' => $limite, 'bpm' => $bpm];

        /* Scoring por coincidencia de tags */
        $tagScoreParts = [];
        foreach (array_slice($tags, 0, 8) as $i => $tag) {
            $tagScoreParts[] = "CASE WHEN :stag{$i} = ANY(s.tags) THEN 2 ELSE 0 END";
            $params["stag{$i}"] = $tag;
        }
        $tagScore = !empty($tagScoreParts) ? '(' . implode(' + ', $tagScoreParts) . ')' : '0';

        $keyScore = $key ? "CASE WHEN s." . SamplesCols::KEY . " = :skey THEN 5 ELSE 0 END" : "0";
        if ($key) $params['skey'] = $key;

        $tipoScore = "CASE WHEN s." . SamplesCols::TIPO . " = :stipo THEN 3 ELSE 0 END";
        $params['stipo'] = $tipo;

        $sql = NormalizadorSample::sqlSelectSamples()
             . " WHERE s." . SamplesCols::ESTADO . " = '" . SamplesEnums::ESTADO_ACTIVO . "' AND s." . SamplesCols::ID . " != :sampleId"
             . " ORDER BY ({$tagScore} + {$keyScore} + {$tipoScore}"
             . " + CASE WHEN s." . SamplesCols::BPM . " IS NOT NULL THEN GREATEST(0, 5 - ABS(s." . SamplesCols::BPM . " - :bpm) / 10) ELSE 0 END) DESC,"
             . " s." . SamplesCols::TOTAL_LIKES . " DESC LIMIT :limit";

        return static::consultar($sql, $params);
    }

    /*
     * Buscar sugerencias "Más Ideas" por scoring de tags/key/bpm.
     * Excluye IDs ya vistos y ordena por relevancia.
     */
    public static function buscarPorScoring(
        array $topTags,
        int $avgBpm,
        ?string $dominantKey,
        array $idsExcluir,
        int $limite,
        int $offset
    ): array {
        $params = ['limit' => $limite, 'offset' => $offset, 'avgBpm' => $avgBpm];

        /* Placeholders para IDs a excluir */
        $excludeClause = '';
        if (!empty($idsExcluir)) {
            $excludeParts = [];
            foreach ($idsExcluir as $idx => $exId) {
                $k = "excl{$idx}";
                $excludeParts[] = ":{$k}";
                $params[$k] = $exId;
            }
            $excludeClause = "AND s." . SamplesCols::ID . " NOT IN (" . implode(',', $excludeParts) . ")";
        }

        /* Tag scoring */
        $tagConditions = [];
        foreach ($topTags as $i => $tag) {
            $tagConditions[] = "CASE WHEN :tag{$i} = ANY(s." . SamplesCols::TAGS . ") THEN 1 ELSE 0 END";
            $params["tag{$i}"] = $tag;
        }
        $tagScore = !empty($tagConditions) ? '(' . implode(' + ', $tagConditions) . ')' : '0';

        $keyScore = $dominantKey ? "CASE WHEN s." . SamplesCols::KEY . " = :domKey THEN 3 ELSE 0 END" : "0";
        if ($dominantKey) $params['domKey'] = $dominantKey;

        $sql = NormalizadorSample::sqlSelectSamples()
             . " WHERE s." . SamplesCols::ESTADO . " = '" . SamplesEnums::ESTADO_ACTIVO . "' {$excludeClause}"
             . " ORDER BY ({$tagScore} + {$keyScore}"
             . " + CASE WHEN s." . SamplesCols::BPM . " IS NOT NULL THEN GREATEST(0, 5 - ABS(s." . SamplesCols::BPM . " - :avgBpm) / 10) ELSE 0 END) DESC,"
             . " s." . SamplesCols::TOTAL_LIKES . " DESC, s." . SamplesCols::PUBLICADO_AT . " DESC"
             . " LIMIT :limit OFFSET :offset";

        return static::consultar($sql, $params);
    }

    /*
     * Listar samples favoritos de un usuario (JOIN likes).
     */
    public static function favoritosDeUsuario(int $userId, int $limit, int $offset): array
    {
        $sql = NormalizadorSample::sqlSelectSamples($userId)
             . " JOIN " . \App\Config\Schema\_generated\LikesCols::TABLA . " l ON l."
             . \App\Config\Schema\_generated\LikesCols::TARGET_ID . " = s." . SamplesCols::ID
             . " AND l." . \App\Config\Schema\_generated\LikesCols::TIPO . " = 'sample'"
             . " AND l." . \App\Config\Schema\_generated\LikesCols::USUARIO_ID . " = :favUser"
             . " WHERE s." . SamplesCols::ESTADO . " = '" . SamplesEnums::ESTADO_ACTIVO . "'"
             . " ORDER BY l." . \App\Config\Schema\_generated\LikesCols::CREATED_AT . " DESC LIMIT :limit OFFSET :offset";

        return static::consultar($sql, ['favUser' => $userId, 'limit' => $limit, 'offset' => $offset]);
    }

    /*
     * Listar samples descargados por un usuario (JOIN descargas).
     */
    public static function descargadosDeUsuario(int $userId, int $limit, int $offset): array
    {
        $sql = NormalizadorSample::sqlSelectSamples($userId)
             . " JOIN " . \App\Config\Schema\_generated\DescargasCols::TABLA . " d ON d."
             . \App\Config\Schema\_generated\DescargasCols::SAMPLE_ID . " = s." . SamplesCols::ID
             . " AND d." . \App\Config\Schema\_generated\DescargasCols::USUARIO_ID . " = :dlUser"
             . " WHERE s." . SamplesCols::ESTADO . " = '" . SamplesEnums::ESTADO_ACTIVO . "'"
             . " ORDER BY d." . \App\Config\Schema\_generated\DescargasCols::CREATED_AT . " DESC LIMIT :limit OFFSET :offset";

        return static::consultar($sql, ['dlUser' => $userId, 'limit' => $limit, 'offset' => $offset]);
    }

    /*
     * Listar coleccionados (UNION descargas + subidos) con soporte de carpeta.
     */
    public static function coleccionadosDeUsuario(int $userId, int $limit, int $offset, string $carpeta = ''): array
    {
        $params = ['uid' => $userId, 'uid2' => $userId, 'limit' => $limit, 'offset' => $offset];
        $carpetaClause = '';
        if ($carpeta !== '') {
            $carpetaClause = " AND s." . SamplesCols::METADATA . "->>'carpeta_primaria' = :carpeta";
            $params['carpeta'] = $carpeta;
        }

        $sql = NormalizadorSample::sqlSelectSamples($userId)
             . " LEFT JOIN " . \App\Config\Schema\_generated\DescargasCols::TABLA . " d ON d."
             . \App\Config\Schema\_generated\DescargasCols::SAMPLE_ID . " = s." . SamplesCols::ID
             . " AND d." . \App\Config\Schema\_generated\DescargasCols::USUARIO_ID . " = :uid"
             . " WHERE s." . SamplesCols::ESTADO . " = '" . SamplesEnums::ESTADO_ACTIVO . "'{$carpetaClause}"
             . " AND (d." . \App\Config\Schema\_generated\DescargasCols::ID . " IS NOT NULL OR s." . SamplesCols::CREADOR_ID . " = :uid2)"
             . " ORDER BY GREATEST("
             . "   COALESCE(d." . \App\Config\Schema\_generated\DescargasCols::CREATED_AT . ", '1970-01-01'::timestamp),"
             . "   s." . SamplesCols::PUBLICADO_AT
             . " ) DESC"
             . " LIMIT :limit OFFSET :offset";

        return static::consultar($sql, $params);
    }

    /*
     * Contar coleccionados (descargas + subidos) para paginación.
     */
    public static function contarColeccionados(int $userId, string $carpeta = ''): int
    {
        $ts = SamplesCols::TABLA;
        $td = \App\Config\Schema\_generated\DescargasCols::TABLA;

        $params = ['uid' => $userId, 'uid2' => $userId];
        $carpetaClause = '';
        if ($carpeta !== '') {
            $carpetaClause = " AND s." . SamplesCols::METADATA . "->>'carpeta_primaria' = :carpeta";
            $params['carpeta'] = $carpeta;
        }

        $sql = "SELECT COUNT(DISTINCT s." . SamplesCols::ID . ") AS total"
             . " FROM {$ts} s"
             . " LEFT JOIN {$td} d ON d." . \App\Config\Schema\_generated\DescargasCols::SAMPLE_ID . " = s." . SamplesCols::ID
             . " AND d." . \App\Config\Schema\_generated\DescargasCols::USUARIO_ID . " = :uid"
             . " WHERE s." . SamplesCols::ESTADO . " = '" . SamplesEnums::ESTADO_ACTIVO . "'{$carpetaClause}"
             . " AND (d." . \App\Config\Schema\_generated\DescargasCols::ID . " IS NOT NULL OR s." . SamplesCols::CREADOR_ID . " = :uid2)";

        $row = static::consultarUno($sql, $params);
        return (int) ($row['total'] ?? 0);
    }

    /*
     * Obtener estructura de carpetas con conteos para el explorador.
     */
    public static function carpetasColeccionados(int $userId): array
    {
        $ts = SamplesCols::TABLA;
        $td = \App\Config\Schema\_generated\DescargasCols::TABLA;

        $sql = "SELECT"
             . "  COALESCE(s." . SamplesCols::METADATA . "->>'carpeta_primaria', 'Samples') AS primaria,"
             . "  s." . SamplesCols::METADATA . "->>'carpeta_secundaria' AS secundaria,"
             . "  COUNT(*) AS total"
             . " FROM ("
             . "  SELECT s." . SamplesCols::ID . ", s." . SamplesCols::METADATA . " FROM {$ts} s"
             . "  JOIN {$td} d ON d." . \App\Config\Schema\_generated\DescargasCols::SAMPLE_ID . " = s." . SamplesCols::ID
             . "  AND d." . \App\Config\Schema\_generated\DescargasCols::USUARIO_ID . " = :uid"
             . "  WHERE s." . SamplesCols::ESTADO . " = '" . SamplesEnums::ESTADO_ACTIVO . "'"
             . "  UNION"
             . "  SELECT s." . SamplesCols::ID . ", s." . SamplesCols::METADATA . " FROM {$ts} s"
             . "  WHERE s." . SamplesCols::ESTADO . " = '" . SamplesEnums::ESTADO_ACTIVO . "' AND s." . SamplesCols::CREADOR_ID . " = :uid2"
             . " ) s"
             . " GROUP BY primaria, secundaria"
             . " ORDER BY primaria, secundaria";

        return static::consultar($sql, ['uid' => $userId, 'uid2' => $userId]);
    }

    /*
     * Contar samples aplicando filtros dinámicos (para listado con paginación).
     * $whereSQL ya viene construido con alias s. y u. (JOIN a usuarios_ext).
     */
    public static function contarConFiltros(string $whereSQL, array $params): int
    {
        $ts = SamplesCols::TABLA;

        $row = static::consultarUno(
            "SELECT COUNT(*) as total FROM {$ts} s"
            . " LEFT JOIN usuarios_ext u ON s." . SamplesCols::CREADOR_ID . " = u.id"
            . " WHERE {$whereSQL}",
            $params
        );

        return (int) ($row['total'] ?? 0);
    }

    /*
     * Listar samples con filtros dinámicos usando NormalizadorSample.
     */
    public static function listarConFiltros(
        ?int $userId,
        string $whereSQL,
        array $params,
        string $orderBy = 'ORDER BY s.publicado_at DESC NULLS LAST',
        int $limit = 20,
        int $offset = 0
    ): array {
        $params['limit'] = $limit;
        $params['offset'] = $offset;

        $sql = \App\Kamples\Api\Helpers\NormalizadorSample::sqlSelectSamples($userId)
             . " WHERE {$whereSQL} {$orderBy} LIMIT :limit OFFSET :offset";

        return static::consultar($sql, $params);
    }

    /*
     * Obtener sample por slug o id_corto (lookup dual).
     * Excluye eliminados.
     */
    public static function obtenerPorSlugOIdCorto(string $slug, ?int $userId = null): ?array
    {
        $sql = \App\Kamples\Api\Helpers\NormalizadorSample::sqlSelectSamples($userId)
             . " WHERE (LOWER(s." . SamplesCols::SLUG . ") = LOWER(:slug) OR s."
             . SamplesCols::ID_CORTO . " = :slug)"
             . " AND s." . SamplesCols::ESTADO . " NOT IN ('eliminado')";

        return static::consultarUno($sql, ['slug' => $slug]);
    }

    /*
     * Feed de samples con ordenamiento dinámico.
     */
    public static function listarFeed(?int $userId, string $orderBy, int $limit, int $offset): array
    {
        $sql = \App\Kamples\Api\Helpers\NormalizadorSample::sqlSelectSamples($userId)
             . " WHERE s." . SamplesCols::ESTADO . " = '" . SamplesEnums::ESTADO_ACTIVO . "'"
             . " {$orderBy} LIMIT :limit OFFSET :offset";

        return static::consultar($sql, ['limit' => $limit, 'offset' => $offset]);
    }

    /*
     * Insertar sample nuevo (upload). Retorna el ID generado.
     */
    public static function insertarSample(array $datos): ?int
    {
        $ts = SamplesCols::TABLA;

        $row = static::consultarUno(
            "INSERT INTO {$ts} (" . SamplesCols::CREADOR_ID . ", " . SamplesCols::TITULO . ", "
            . SamplesCols::SLUG . ", " . SamplesCols::ID_CORTO . ", " . SamplesCols::DESCRIPCION . ", "
            . SamplesCols::FORMATO . ", " . SamplesCols::TAMANO . ", " . SamplesCols::RUTA_ORIGINAL . ", "
            . SamplesCols::ESTADO . ", " . SamplesCols::ES_PREMIUM . ", " . SamplesCols::PRECIO . ", "
            . SamplesCols::TAGS . ", " . SamplesCols::PERMITIR_DESCARGA . ", " . SamplesCols::LICENCIA_LIBRE
            . ", " . SamplesCols::MOSTRAR_EN_COMUNIDAD . ", " . SamplesCols::PUBLICADO_AT . ", "
            . SamplesCols::CREATED_AT . ", " . SamplesCols::UPDATED_AT . ")"
            . " VALUES (:creadorId, :titulo, :slug, :idCorto, :descripcion, :formato, :tamano,"
            . " :rutaOriginal, 'procesando', :esPremium, :precio, :tags, :descarga, :licencia, :comunidad, NOW(), NOW(), NOW())"
            . " RETURNING " . SamplesCols::ID,
            $datos
        );

        return $row ? (int) $row[SamplesCols::ID] : null;
    }

    /*
     * Limpiar todos los embeddings (para regeneración).
     */
    public static function limpiarEmbeddings(): void
    {
        $ts = SamplesCols::TABLA;

        static::ejecutar(
            "UPDATE {$ts} SET " . SamplesCols::EMBEDDING . " = NULL WHERE " . SamplesCols::EMBEDDING . " IS NOT NULL"
        );
    }

    /*
     * Estadísticas del estado de embeddings.
     */
    public static function estadisticasEmbeddings(): array
    {
        $ts = SamplesCols::TABLA;

        $row = static::consultarUno(
            "SELECT COUNT(*) as total_samples, COUNT(" . SamplesCols::EMBEDDING . ") as con_embedding,"
            . " COUNT(*) - COUNT(" . SamplesCols::EMBEDDING . ") as sin_embedding,"
            . " CASE WHEN COUNT(*) > 0 THEN ROUND(COUNT(" . SamplesCols::EMBEDDING . ")::numeric / COUNT(*)::numeric * 100, 1) ELSE 0 END as porcentaje"
            . " FROM {$ts} WHERE " . SamplesCols::ESTADO . " = '" . SamplesEnums::ESTADO_ACTIVO . "'"
        );

        return $row ?: ['total_samples' => 0, 'con_embedding' => 0, 'sin_embedding' => 0, 'porcentaje' => 0];
    }

    /*
     * Obtener rutas de archivo para streaming de descarga.
     */
    public static function buscarRutaDescarga(int $id): ?array
    {
        $ts = SamplesCols::TABLA;

        return static::consultarUno(
            "SELECT " . SamplesCols::RUTA_ORIGINAL . ", " . SamplesCols::RUTA_OPTIMIZADA . ", " . SamplesCols::TITULO
            . " FROM {$ts} WHERE " . SamplesCols::ID . " = :id",
            ['id' => $id]
        );
    }

    /*
     * Obtener último sample del creador (para experimentos).
     */
    public static function obtenerUltimoDelCreador(int $creadorId): ?array
    {
        $ts = SamplesCols::TABLA;

        return static::consultarUno(
            "SELECT " . SamplesCols::ID . " FROM {$ts} WHERE " . SamplesCols::CREADOR_ID . " = :userId"
            . " ORDER BY " . SamplesCols::CREATED_AT . " DESC LIMIT 1",
            ['userId' => $creadorId]
        );
    }
}
