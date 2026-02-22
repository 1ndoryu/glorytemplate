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
use App\Config\Schema\_generated\TransaccionesCols;
use App\Config\Schema\_generated\UsuariosExtCols;
use App\Kamples\Api\Helpers\NormalizadorSample;
use App\Kamples\Database\Repositories\LikesRepository;
use App\Kamples\Database\Repositories\ColeccionSamplesRepository;
use App\Kamples\Database\Repositories\ReproduccionesRepository;
use App\Kamples\Database\Repositories\DescargasRepository;

class SamplesRepository extends BaseRepository
{
    /* Carpeta por defecto para samples sin carpeta_primaria asignada en metadata */
    public const CARPETA_DEFAULT = 'Samples';

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
            "SELECT * FROM {$tabla} WHERE {$colEstado} = :estado ORDER BY " . SamplesCols::ID . " DESC LIMIT :limit OFFSET :offset",
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
            "SELECT * FROM {$tabla} WHERE {$col} = :creadorId ORDER BY " . SamplesCols::ID . " DESC LIMIT :limit OFFSET :offset",
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
            "SELECT * FROM {$tabla} ORDER BY " . SamplesCols::CREATED_AT . " DESC LIMIT :limit",
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
        $tt = TransaccionesCols::TABLA;

        return static::consultar(
            "SELECT s." . SamplesCols::ID . ", s." . SamplesCols::TITULO . ", s." . SamplesCols::SLUG
            . ", s." . SamplesCols::TOTAL_DESCARGAS . " as descargas"
            . ", s." . SamplesCols::TOTAL_REPRODUCCIONES . " as reproducciones"
            . ", s." . SamplesCols::TOTAL_LIKES . " as likes"
            . ", COALESCE((SELECT SUM(t." . TransaccionesCols::PAGO_CREADOR
            . ") FROM {$tt} t WHERE t." . TransaccionesCols::SAMPLE_ID . " = s." . SamplesCols::ID
            . " AND t." . TransaccionesCols::ESTADO . " = 'completed'), 0) as ingresos"
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
             . " JOIN " . LikesCols::TABLA . " l ON l."
             . LikesCols::TARGET_ID . " = s." . SamplesCols::ID
             . " AND l." . LikesCols::TIPO . " = '" . LikesEnums::TIPO_SAMPLE . "'"
             . " AND l." . LikesCols::USUARIO_ID . " = :favUser"
             . " WHERE s." . SamplesCols::ESTADO . " = '" . SamplesEnums::ESTADO_ACTIVO . "'"
             . " ORDER BY l." . LikesCols::CREATED_AT . " DESC LIMIT :limit OFFSET :offset";

        return static::consultar($sql, ['favUser' => $userId, 'limit' => $limit, 'offset' => $offset]);
    }

    /*
     * Listar samples descargados por un usuario (JOIN descargas).
     */
    public static function descargadosDeUsuario(int $userId, int $limit, int $offset): array
    {
        $sql = NormalizadorSample::sqlSelectSamples($userId)
             . " JOIN " . DescargasCols::TABLA . " d ON d."
             . DescargasCols::SAMPLE_ID . " = s." . SamplesCols::ID
             . " AND d." . DescargasCols::USUARIO_ID . " = :dlUser"
             . " WHERE s." . SamplesCols::ESTADO . " = '" . SamplesEnums::ESTADO_ACTIVO . "'"
             . " ORDER BY d." . DescargasCols::CREATED_AT . " DESC LIMIT :limit OFFSET :offset";

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
            /* C288: COALESCE para que samples sin carpeta_primaria se traten como carpeta por defecto */
            /* Soporta formato "primaria/subcarpeta" para filtrar ambos niveles */
            if (\str_contains($carpeta, '/')) {
                [$primaria, $secundaria] = \explode('/', $carpeta, 2);
                $carpetaClause = " AND COALESCE(s." . SamplesCols::METADATA . "->>'carpeta_primaria', '" . self::CARPETA_DEFAULT . "') = :carpeta_primaria"
                               . " AND s." . SamplesCols::METADATA . "->>'carpeta_secundaria' = :carpeta_secundaria";
                $params['carpeta_primaria'] = $primaria;
                $params['carpeta_secundaria'] = $secundaria;
            } else {
                $carpetaClause = " AND COALESCE(s." . SamplesCols::METADATA . "->>'carpeta_primaria', '" . self::CARPETA_DEFAULT . "') = :carpeta";
                $params['carpeta'] = $carpeta;
            }
        }

        $sql = NormalizadorSample::sqlSelectSamples($userId)
             . " LEFT JOIN " . DescargasCols::TABLA . " d ON d."
             . DescargasCols::SAMPLE_ID . " = s." . SamplesCols::ID
             . " AND d." . DescargasCols::USUARIO_ID . " = :uid"
             . " WHERE s." . SamplesCols::ESTADO . " = '" . SamplesEnums::ESTADO_ACTIVO . "'{$carpetaClause}"
             . " AND (d." . DescargasCols::ID . " IS NOT NULL OR s." . SamplesCols::CREADOR_ID . " = :uid2)"
             . " ORDER BY GREATEST("
             . "   COALESCE(d." . DescargasCols::CREATED_AT . ", '1970-01-01'::timestamp),"
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
        $td = DescargasCols::TABLA;

        $params = ['uid' => $userId, 'uid2' => $userId];
        $carpetaClause = '';
        if ($carpeta !== '') {
            /* Soporta formato "primaria/subcarpeta" consistente con coleccionadosDeUsuario() */
            if (\str_contains($carpeta, '/')) {
                [$primaria, $secundaria] = \explode('/', $carpeta, 2);
                $carpetaClause = " AND COALESCE(s." . SamplesCols::METADATA . "->>'carpeta_primaria', '" . self::CARPETA_DEFAULT . "') = :carpeta_primaria"
                               . " AND s." . SamplesCols::METADATA . "->>'carpeta_secundaria' = :carpeta_secundaria";
                $params['carpeta_primaria'] = $primaria;
                $params['carpeta_secundaria'] = $secundaria;
            } else {
                $carpetaClause = " AND COALESCE(s." . SamplesCols::METADATA . "->>'carpeta_primaria', '" . self::CARPETA_DEFAULT . "') = :carpeta";
                $params['carpeta'] = $carpeta;
            }
        }

        $sql = "SELECT COUNT(DISTINCT s." . SamplesCols::ID . ") AS total"
             . " FROM {$ts} s"
             . " LEFT JOIN {$td} d ON d." . DescargasCols::SAMPLE_ID . " = s." . SamplesCols::ID
             . " AND d." . DescargasCols::USUARIO_ID . " = :uid"
             . " WHERE s." . SamplesCols::ESTADO . " = '" . SamplesEnums::ESTADO_ACTIVO . "'{$carpetaClause}"
             . " AND (d." . DescargasCols::ID . " IS NOT NULL OR s." . SamplesCols::CREADOR_ID . " = :uid2)";

        $row = static::consultarUno($sql, $params);
        return (int) ($row['total'] ?? 0);
    }

    /*
     * Obtener estructura de carpetas con conteos para el explorador.
     */
    public static function carpetasColeccionados(int $userId): array
    {
        $ts = SamplesCols::TABLA;
        $td = DescargasCols::TABLA;

        $sql = "SELECT"
             . "  COALESCE(s." . SamplesCols::METADATA . "->>'carpeta_primaria', '" . self::CARPETA_DEFAULT . "') AS primaria,"
             . "  s." . SamplesCols::METADATA . "->>'carpeta_secundaria' AS secundaria,"
             . "  COUNT(*) AS total"
             . " FROM ("
             . "  SELECT s." . SamplesCols::ID . ", s." . SamplesCols::METADATA . " FROM {$ts} s"
             . "  JOIN {$td} d ON d." . DescargasCols::SAMPLE_ID . " = s." . SamplesCols::ID
             . "  AND d." . DescargasCols::USUARIO_ID . " = :uid"
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
            . " LEFT JOIN " . UsuariosExtCols::TABLA . " u ON s." . SamplesCols::CREADOR_ID . " = u." . UsuariosExtCols::ID
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

        $sql = NormalizadorSample::sqlSelectSamples($userId)
             . " WHERE {$whereSQL} {$orderBy} LIMIT :limit OFFSET :offset";

        return static::consultar($sql, $params);
    }

    /*
     * Obtener sample por slug o id_corto (lookup dual).
     * Excluye eliminados.
     */
    public static function obtenerPorSlugOIdCorto(string $slug, ?int $userId = null): ?array
    {
        $sql = NormalizadorSample::sqlSelectSamples($userId)
             . " WHERE (LOWER(s." . SamplesCols::SLUG . ") = LOWER(:slug) OR s."
             . SamplesCols::ID_CORTO . " = :slug)"
             . " AND s." . SamplesCols::ESTADO . " NOT IN ('" . SamplesEnums::ESTADO_ELIMINADO . "')";

        return static::consultarUno($sql, ['slug' => $slug]);
    }

    /*
     * Feed de samples con ordenamiento dinámico.
     */
    public static function listarFeed(?int $userId, string $orderBy, int $limit, int $offset): array
    {
        $sql = NormalizadorSample::sqlSelectSamples($userId)
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
            . " :rutaOriginal, '" . SamplesEnums::ESTADO_PROCESANDO . "', :esPremium, :precio, :tags, :descarga, :licencia, :comunidad, NOW(), NOW(), NOW())"
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
            "SELECT COUNT(*) as " . UsuariosExtCols::TOTAL_SAMPLES . ", COUNT(" . SamplesCols::EMBEDDING . ") as con_embedding,"
            . " COUNT(*) - COUNT(" . SamplesCols::EMBEDDING . ") as sin_embedding,"
            . " CASE WHEN COUNT(*) > 0 THEN ROUND(COUNT(" . SamplesCols::EMBEDDING . ")::numeric / COUNT(*)::numeric * 100, 1) ELSE 0 END as porcentaje"
            . " FROM {$ts} WHERE " . SamplesCols::ESTADO . " = '" . SamplesEnums::ESTADO_ACTIVO . "'"
        );

        return $row ?: [UsuariosExtCols::TOTAL_SAMPLES => 0, 'con_embedding' => 0, 'sin_embedding' => 0, 'porcentaje' => 0];
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

    /*
     * Obtener campos minimos para generar embedding (GeneradorEmbeddings).
     */
    public static function buscarParaEmbedding(int $id): ?array
    {
        $ts = SamplesCols::TABLA;

        return static::consultarUno(
            "SELECT " . SamplesCols::BPM . ", " . SamplesCols::KEY . ", " . SamplesCols::ESCALA
            . ", " . SamplesCols::TIPO . ", " . SamplesCols::DURACION . ", " . SamplesCols::ES_PREMIUM
            . ", " . SamplesCols::TAGS
            . " FROM {$ts} WHERE " . SamplesCols::ID . " = :id",
            ['id' => $id]
        );
    }

    /*
     * Actualizar el embedding vectorial de un sample.
     * $vectorStr debe ser string formato PostgreSQL: '[0.5,0,1,...]'.
     */
    public static function actualizarEmbedding(int $id, string $vectorStr): bool
    {
        $ts = SamplesCols::TABLA;

        return static::ejecutar(
            "UPDATE {$ts} SET " . SamplesCols::EMBEDDING . " = :" . SamplesCols::EMBEDDING . "::vector WHERE " . SamplesCols::ID . " = :id",
            [SamplesCols::EMBEDDING => $vectorStr, 'id' => $id]
        ) >= 0;
    }

    /*
     * Obtener todos los samples activos sin embedding para generacion batch.
     */
    public static function buscarSinEmbeddingActivos(): array
    {
        $ts = SamplesCols::TABLA;

        return static::consultar(
            "SELECT " . SamplesCols::ID . ", " . SamplesCols::BPM . ", " . SamplesCols::KEY
            . ", " . SamplesCols::ESCALA . ", " . SamplesCols::TIPO . ", " . SamplesCols::DURACION
            . ", " . SamplesCols::ES_PREMIUM . ", " . SamplesCols::TAGS
            . " FROM {$ts} WHERE " . SamplesCols::EMBEDDING . " IS NULL AND "
            . SamplesCols::ESTADO . " = '" . SamplesEnums::ESTADO_ACTIVO . "'"
        );
    }

    /*
     * Obtener embeddings de samples con los que el usuario interactuó.
     * Usado por GeneradorEmbeddings::perfilUsuario para construir perfil vectorial.
     * Retorna filas con: embedding::text, tipo_interaccion, peso.
     */
    public static function buscarInteraccionesParaPerfil(int $userId): array
    {
        $sql = "SELECT s." . SamplesCols::EMBEDDING . "::text, tipo_interaccion, peso FROM ("
             . " SELECT " . LikesCols::TARGET_ID . " as sample_id, '" . LikesEnums::REACCION_LIKE . "' as tipo_interaccion, 3 as peso"
             . " FROM " . LikesCols::TABLA . " WHERE " . LikesCols::USUARIO_ID . " = :userId AND " . LikesCols::TIPO . " = '" . LikesEnums::TIPO_SAMPLE . "'"
             . " UNION ALL"
             . " SELECT " . DescargasCols::SAMPLE_ID . ", 'descarga', 5"
             . " FROM " . DescargasCols::TABLA . " WHERE " . DescargasCols::USUARIO_ID . " = :userId"
             . " UNION ALL"
             . " SELECT " . ReproduccionesCols::SAMPLE_ID . ","
             . " CASE WHEN " . ReproduccionesCols::COMPLETADA . " THEN 'reproduccion_completa' ELSE 'reproduccion' END,"
             . " CASE WHEN " . ReproduccionesCols::COMPLETADA . " THEN 2 ELSE 1 END"
             . " FROM " . ReproduccionesCols::TABLA . " WHERE " . ReproduccionesCols::USUARIO_ID . " = :userId"
             . ") interacciones"
             . " JOIN " . SamplesCols::TABLA . " s ON s." . SamplesCols::ID . " = interacciones.sample_id"
             . " WHERE s." . SamplesCols::EMBEDDING . " IS NOT NULL";

        return static::consultar($sql, ['userId' => $userId]);
    }

    /*
     * Verificar si pgvector esta activo (extension existe y columna embedding existe).
     * Usado por MotorRecomendacion para condicionar el uso de similitud coseno.
     */
    public static function verificarPgvector(): bool
    {
        try {
            $ext = static::consultarUno("SELECT 1 FROM pg_extension WHERE extname = 'vector'");
            $col = static::consultarUno(
                "SELECT 1 FROM information_schema.columns WHERE table_name = '" . SamplesCols::TABLA . "' AND column_name = '" . SamplesCols::EMBEDDING . "'"
            );
            return ($ext !== null && $col !== null);
        } catch (\Exception $e) {
            return false;
        }
    }

    /*
     * Verificar si un sample tiene embedding calculado.
     */
    public static function verificarTieneEmbedding(int $id): bool
    {
        $ts = SamplesCols::TABLA;

        $row = static::consultarUno(
            "SELECT " . SamplesCols::EMBEDDING . " IS NOT NULL as tiene FROM {$ts} WHERE " . SamplesCols::ID . " = :id",
            ['id' => $id]
        );

        return (bool) ($row['tiene'] ?? false);
    }

    /*
     * Buscar samples duplicados por audio_hash (excluye el sample original).
     * Usado por DeduplicadorAudio.
     */
    public static function buscarConHash(string $hash, int $excluirId): array
    {
        $ts = SamplesCols::TABLA;

        return static::consultar(
            "SELECT " . SamplesCols::ID . ", " . SamplesCols::CREADOR_ID . ", " . SamplesCols::TITULO
            . " FROM {$ts} WHERE " . SamplesCols::AUDIO_HASH . " = :hash AND " . SamplesCols::ID . " != :id"
            . " AND " . SamplesCols::ESTADO . " = '" . SamplesEnums::ESTADO_ACTIVO . "'",
            ['hash' => $hash, 'id' => $excluirId]
        );
    }

    /*
     * Guardar hash perceptual de audio.
     */
    public static function actualizarHash(int $id, string $hash): void
    {
        $ts = SamplesCols::TABLA;

        static::ejecutar(
            "UPDATE {$ts} SET " . SamplesCols::AUDIO_HASH . " = :hash WHERE " . SamplesCols::ID . " = :id",
            ['hash' => $hash, 'id' => $id]
        );
    }

    /*
     * Marcar sample como 'en_supervision' por deteccion de duplicado.
     */
    public static function marcarEnSupervision(int $id): void
    {
        $ts = SamplesCols::TABLA;

        static::ejecutar(
            "UPDATE {$ts} SET " . SamplesCols::ESTADO . " = '" . SamplesEnums::ESTADO_EN_SUPERVISION . "' WHERE " . SamplesCols::ID . " = :id",
            ['id' => $id]
        );
    }

    /*
     * Obtener campos de un sample para DeduplicadorAudio.
     */
    public static function buscarParaDeduplicacion(int $id): ?array
    {
        $ts = SamplesCols::TABLA;

        return static::consultarUno(
            "SELECT " . SamplesCols::ID . ", " . SamplesCols::CREADOR_ID
            . ", " . SamplesCols::RUTA_ORIGINAL . ", " . SamplesCols::DURACION
            . " FROM {$ts} WHERE " . SamplesCols::ID . " = :id",
            ['id' => $id]
        );
    }

    /*
     * Verificar si un id_corto ya existe en la tabla samples.
     * Usado por GeneradorIdCorto para garantizar unicidad antes de asignar.
     */
    public static function existeIdCorto(string $idCorto): bool
    {
        $ts = SamplesCols::TABLA;
        $resultado = static::consultarUno(
            "SELECT 1 FROM {$ts} WHERE " . SamplesCols::ID_CORTO . " = :id LIMIT 1",
            ['id' => $idCorto]
        );
        return $resultado !== null;
    }

    /*
     * Mover un sample a otra carpeta actualizando metadata JSONB.
     * Usa jsonb_set para actualizar carpeta_primaria y carpeta_secundaria
     * atómicamente sin sobreescribir el resto del metadata.
     */
    public static function moverACarpeta(int $sampleId, string $carpetaPrimaria, string $carpetaSecundaria = ''): bool
    {
        $ts = SamplesCols::TABLA;
        $meta = SamplesCols::METADATA;

        /* Construir metadata actualizada con jsonb_set encadenado */
        $sql = "UPDATE {$ts} SET "
             . "{$meta} = jsonb_set("
             . "  jsonb_set(COALESCE({$meta}, '{}'), '{carpeta_primaria}', :primaria::jsonb),"
             . "  '{carpeta_secundaria}', :secundaria::jsonb"
             . "), " . SamplesCols::UPDATED_AT . " = NOW()"
             . " WHERE " . SamplesCols::ID . " = :id";

        $filas = static::ejecutar($sql, [
            'id'         => $sampleId,
            'primaria'   => json_encode($carpetaPrimaria),
            'secundaria' => json_encode($carpetaSecundaria),
        ]);

        return $filas > 0;
    }

    /*
     * Verificar que un sample pertenece al usuario (es creador o lo descargó).
     */
    public static function esColeccionadoPorUsuario(int $sampleId, int $userId): bool
    {
        $ts = SamplesCols::TABLA;
        $td = DescargasCols::TABLA;

        $sql = "SELECT 1 FROM {$ts} s"
             . " LEFT JOIN {$td} d ON d." . DescargasCols::SAMPLE_ID . " = s." . SamplesCols::ID
             . " AND d." . DescargasCols::USUARIO_ID . " = :uid"
             . " WHERE s." . SamplesCols::ID . " = :sid"
             . " AND s." . SamplesCols::ESTADO . " = '" . SamplesEnums::ESTADO_ACTIVO . "'"
             . " AND (d." . DescargasCols::ID . " IS NOT NULL OR s." . SamplesCols::CREADOR_ID . " = :uid2)"
             . " LIMIT 1";

        $row = static::consultarUno($sql, ['sid' => $sampleId, 'uid' => $userId, 'uid2' => $userId]);
        return $row !== null;
    }
}
