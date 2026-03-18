<?php

/**
 * ColeccionesRepository — Acceso a datos para tabla 'colecciones'.
 *
 * SECCION AUTO-GENERADA: Los metodos base se regeneran con schema:generate.
 * SECCION CUSTOM: Todo debajo de la marca CUSTOM se preserva al regenerar.
 *
 * @package Kamples
 */

namespace App\Kamples\Database\Repositories;

use App\Config\Schema\_generated\ColeccionesCols;
use App\Config\Schema\_generated\ColeccionesDTO;
use App\Config\Schema\_generated\ColeccionSamplesCols;
use App\Config\Schema\_generated\UsuariosExtCols;
use App\Config\Schema\_generated\SamplesCols;
use App\Config\Schema\_generated\SamplesEnums;
use App\Config\Schema\_generated\ColeccionesGuardadasCols;
use App\Config\Schema\_generated\LikesCols;
use App\Config\Schema\_generated\LikesEnums;
use App\Config\Schema\_generated\FollowsCols;
use App\Config\Schema\_generated\UsuariosExtEnums;
use App\Kamples\Services\ConstructorSenales;
use App\Kamples\Api\Helpers\NormalizadorSample;

class ColeccionesRepository extends BaseRepository
{
    protected static function tabla(): string
    {
        return ColeccionesCols::TABLA;
    }

    protected static function colId(): string
    {
        return ColeccionesCols::ID;
    }

    /*
     * Buscar registros del usuario dado.
     */
    public static function buscarPorUsuario(int $usuarioId, int $limit = 20, int $offset = 0): array
    {
        $tabla = ColeccionesCols::TABLA;
        $col = ColeccionesCols::USUARIO_ID;

        return static::consultar(
            "SELECT * FROM {$tabla} WHERE {$col} = :usuarioId ORDER BY " . static::colId() . " DESC LIMIT :limit OFFSET :offset",
            ['usuarioId' => $usuarioId, 'limit' => $limit, 'offset' => $offset]
        );
    }

    /*
     * Buscar registros mas recientes.
     */
    public static function buscarRecientes(int $limit = 20): array
    {
        $tabla = ColeccionesCols::TABLA;

        return static::consultar(
            "SELECT * FROM {$tabla} ORDER BY " . ColeccionesCols::CREATED_AT . " DESC LIMIT :limit",
            ['limit' => $limit]
        );
    }

    /* === METODOS CUSTOM (seguro para editar debajo de esta linea) === */

                        

        

    

    /*
     * Listar colecciones del usuario con conteo de items, tags agregados y búsqueda opcional.
     * Incluye subcolecciones anidadas en campo 'subcolecciones' para cada padre.
     * Si $busqueda está activo, busca en todo el árbol (padres + sub) y devuelve plano.
     * C388: Cada colección incluye 'tags' (array de tags distintos de sus samples).
     */
    public static function listarDelUsuario(int $userId, string $busqueda = ''): array
    {
        $t = ColeccionesCols::TABLA;
        $tcs = ColeccionSamplesCols::TABLA;
        $ts = SamplesCols::TABLA;

        $params = ['userId' => $userId];
        $where = "c." . ColeccionesCols::USUARIO_ID . " = :userId";

        if (!empty($busqueda)) {
            $colNombre = ColeccionesCols::NOMBRE;
            $colDesc = ColeccionesCols::DESCRIPCION;
            $where .= " AND (c.{$colNombre} ILIKE :busqueda OR c.{$colDesc} ILIKE :busqueda)";
            $params['busqueda'] = '%' . $busqueda . '%';
        }

        /*
         * QL81: Subquery para tags agregados de cada colección.
         * Usa metadata->'tags' (IA) con fallback a metadata->'tags_es',
         * misma fuente que tagsFrecuentesDelUsuario para que el filtrado funcione.
         */
        $sampleId = SamplesCols::ID;
        $sampleMeta = SamplesCols::METADATA;
        $sampleEstado = SamplesCols::ESTADO;
        $estadoActivo = SamplesEnums::ESTADO_ACTIVO;
        $csSampleId = ColeccionSamplesCols::SAMPLE_ID;
        $csColeccionId = ColeccionSamplesCols::COLECCION_ID;
        $colId = ColeccionesCols::ID;

        /*
         * QL114: total_items incluye samples propios + samples de subcolecciones.
         * Para padres (parent_id IS NULL), la subquery agrega samples de sus hijos.
         * Para subcolecciones, el IN no matchea nada adicional (profundidad max = 2).
         * [183A-23] JOIN a samples para filtrar solo estado=activo (mismo criterio que el detalle).
         */
        $parentIdCol = ColeccionesCols::PARENT_ID;

        $todas = static::consultar(
            "SELECT c.*,
                    (SELECT COUNT(*) FROM {$tcs} cs
                     JOIN {$ts} s_cnt ON cs.{$csSampleId} = s_cnt.{$sampleId} AND s_cnt.{$sampleEstado} = '{$estadoActivo}'
                     WHERE cs.{$csColeccionId} = c.{$colId}
                        OR cs.{$csColeccionId} IN (
                            SELECT sub.{$colId} FROM {$t} sub WHERE sub.{$parentIdCol} = c.{$colId}
                        )
                    ) as total_items,
                    COALESCE(
                        (SELECT array_agg(DISTINCT tag_val)
                         FROM {$tcs} cs2
                         JOIN {$ts} s ON cs2.{$csSampleId} = s.{$sampleId}
                         CROSS JOIN LATERAL jsonb_array_elements_text(
                             COALESCE(
                                 CASE WHEN jsonb_typeof(s.{$sampleMeta}->'tags') = 'array' THEN s.{$sampleMeta}->'tags' END,
                                 CASE WHEN jsonb_typeof(s.{$sampleMeta}->'tags_es') = 'array' THEN s.{$sampleMeta}->'tags_es' END,
                                 '[]'::jsonb
                             )
                         ) as tag_val
                         WHERE cs2.{$csColeccionId} = c.{$colId}
                           AND s.{$sampleEstado} = '{$estadoActivo}'
                           AND s.{$sampleMeta} IS NOT NULL),
                        ARRAY[]::TEXT[]
                    ) as tags
             FROM {$t} c WHERE {$where} ORDER BY c." . ColeccionesCols::UPDATED_AT . " DESC",
            $params
        );

        /* PG devuelve tags como string '{tag1,tag2}' — parsear a array PHP */
        foreach ($todas as &$row) {
            $row['tags'] = NormalizadorSample::pgArrayToPhp($row['tags'] ?? '{}');
        }
        unset($row);

        /* Si hay búsqueda, devolver plano (incluye padres + sub que matcheen) */
        if (!empty($busqueda)) {
            return $todas;
        }

        /* Agrupar: padres (parent_id IS NULL) con sus subcolecciones anidadas */
        $padres = [];
        $subsPorPadre = [];
        foreach ($todas as $col) {
            $parentId = $col[ColeccionesCols::PARENT_ID] ?? null;
            if ($parentId === null) {
                $padres[] = $col;
            } else {
                $subsPorPadre[(int) $parentId][] = $col;
            }
        }

        foreach ($padres as &$padre) {
            $id = (int) $padre[ColeccionesCols::ID];
            $padre['subcolecciones'] = $subsPorPadre[$id] ?? [];
        }
        unset($padre);

        return $padres;
    }

    /*
     * C388/QL23: Tags más frecuentes del usuario (agregados de sus colecciones).
     * Usa metadata JSONB (tags IA) en vez de s.tags (nombres de artistas WhoSampled).
     * QL30: Prioriza tags (inglés) con fallback a tags_es (español).
     */
    public static function tagsFrecuentesDelUsuario(int $userId, int $limite = 15): array
    {
        $t = ColeccionesCols::TABLA;
        $tcs = ColeccionSamplesCols::TABLA;
        $ts = SamplesCols::TABLA;

        $csColeccionId = ColeccionSamplesCols::COLECCION_ID;
        $csSampleId = ColeccionSamplesCols::SAMPLE_ID;
        $sampleId = SamplesCols::ID;
        $sampleMeta = SamplesCols::METADATA;
        $sampleEstado = SamplesCols::ESTADO;
        $estadoActivo = SamplesEnums::ESTADO_ACTIVO;
        $colUsuarioId = ColeccionesCols::USUARIO_ID;
        $colId = ColeccionesCols::ID;

        $rows = static::consultar(
            "SELECT tag_val, COUNT(*) as frecuencia
             FROM {$tcs} cs
             JOIN {$t} c ON cs.{$csColeccionId} = c.{$colId}
             JOIN {$ts} s ON cs.{$csSampleId} = s.{$sampleId}
             CROSS JOIN LATERAL jsonb_array_elements_text(
                 COALESCE(
                     CASE WHEN jsonb_typeof(s.{$sampleMeta}->'tags') = 'array' THEN s.{$sampleMeta}->'tags' END,
                     CASE WHEN jsonb_typeof(s.{$sampleMeta}->'tags_es') = 'array' THEN s.{$sampleMeta}->'tags_es' END,
                     '[]'::jsonb
                 )
             ) as tag_val
             WHERE c.{$colUsuarioId} = :userId
               AND s.{$sampleEstado} = '{$estadoActivo}'
               AND s.{$sampleMeta} IS NOT NULL
             GROUP BY tag_val
             ORDER BY frecuencia DESC
             LIMIT :limite",
            ['userId' => $userId, 'limite' => $limite]
        );

        return array_column($rows, 'tag_val');
    }

    /*
     * Listar subcolecciones de un padre específico.
     * Retorna subcolecciones con conteo de items.
     */
    public static function listarSubcolecciones(int $parentId): array
    {
        $t = ColeccionesCols::TABLA;
        $tcs = ColeccionSamplesCols::TABLA;
        $ts = SamplesCols::TABLA;
        $estadoActivo = SamplesEnums::ESTADO_ACTIVO;
        /* [183A-23] JOIN a samples con filtro estado=activo para que total_items coincida con el detalle */
        $sql = "SELECT c.*,
                (SELECT COUNT(*) FROM {$tcs} cs
                 JOIN {$ts} s_cnt ON cs." . ColeccionSamplesCols::SAMPLE_ID . " = s_cnt." . SamplesCols::ID . " AND s_cnt." . SamplesCols::ESTADO . " = '{$estadoActivo}'
                 WHERE cs." . ColeccionSamplesCols::COLECCION_ID . " = c." . ColeccionesCols::ID . ") as total_items
                FROM {$t} c WHERE c." . ColeccionesCols::PARENT_ID . " = :parentId ORDER BY c." . ColeccionesCols::NOMBRE . " ASC";

        return static::consultar($sql, ['parentId' => $parentId]);
    }

    /*
     * Explorar colecciones públicas con algoritmo de relevancia personalizada.
     * Si el usuario está autenticado, ordena por afinidad de tags (CTE).
     * Sino, ordena por updated_at DESC (fallback).
     */
    public static function explorarPublicas(int $offset, string $busqueda = '', ?int $userId = null): array
    {
        $t = ColeccionesCols::TABLA;
        $tcs = ColeccionSamplesCols::TABLA;
        $tu = UsuariosExtCols::TABLA;
        $ts = SamplesCols::TABLA;
        $tf = FollowsCols::TABLA;
        $tl = LikesCols::TABLA;

        $params = ['offset' => $offset];
        $whereBusqueda = '';

        if (!empty($busqueda)) {
            $colNombre = ColeccionesCols::NOMBRE;
            $colDesc = ColeccionesCols::DESCRIPCION;
            $whereBusqueda = " AND (c.{$colNombre} ILIKE :busqueda OR c.{$colDesc} ILIKE :busqueda)";
            $params['busqueda'] = '%' . $busqueda . '%';
        }

        /*
         * Filtro de visibilidad: colecciones p\u00fablicas + propias del usuario (incluso privadas).
         * Las colecciones propias aparecen primero gracias al boost propio_boost en el scoring.
         */
        $colUsuarioId = ColeccionesCols::USUARIO_ID;
        $colPublica = ColeccionesCols::PUBLICA;
        $sampleMeta = SamplesCols::METADATA;

        /*
         * QL81: Subquery reutilizable para tags de metadata por colección.
         * Misma fuente que tagsFrecuentesExplorar (metadata->'tags' / 'tags_es').
         */
        $colId = ColeccionesCols::ID;
        $csSampleId = ColeccionSamplesCols::SAMPLE_ID;
        $csColeccionId = ColeccionSamplesCols::COLECCION_ID;
        $sampleId = SamplesCols::ID;
        $sampleEstado = SamplesCols::ESTADO;
        $estadoActivo = SamplesEnums::ESTADO_ACTIVO;

        $subqueryTagsMeta = "COALESCE(
            (SELECT array_agg(DISTINCT tag_val)
             FROM {$tcs} cs_t
             JOIN {$ts} s_t ON cs_t.{$csSampleId} = s_t.{$sampleId}
             CROSS JOIN LATERAL jsonb_array_elements_text(
                 COALESCE(
                     CASE WHEN jsonb_typeof(s_t.{$sampleMeta}->'tags') = 'array' THEN s_t.{$sampleMeta}->'tags' END,
                     CASE WHEN jsonb_typeof(s_t.{$sampleMeta}->'tags_es') = 'array' THEN s_t.{$sampleMeta}->'tags_es' END,
                     '[]'::jsonb
                 )
             ) as tag_val
             WHERE cs_t.{$csColeccionId} = c.{$colId}
               AND s_t.{$sampleEstado} = '{$estadoActivo}'
               AND s_t.{$sampleMeta} IS NOT NULL),
            ARRAY[]::TEXT[]
        )";

        if ($userId) {
            $params['userId'] = $userId;
            $params['userIdVisibilidad'] = $userId;
            $whereVisibilidad = "(c.{$colPublica} = true OR c.{$colUsuarioId} = :userIdVisibilidad)";
            $tg = ColeccionesGuardadasCols::TABLA;
            $gUsuarioId = ColeccionesGuardadasCols::USUARIO_ID;
            $gColeccionId = ColeccionesGuardadasCols::COLECCION_ID;
            $tagsLiked = ConstructorSenales::sqlTagsEnriquecidos('s_l');
            $tipoSample = LikesEnums::TIPO_SAMPLE;
            $reaccionLike = LikesEnums::REACCION_LIKE;
            $reaccionEncanta = LikesEnums::REACCION_ENCANTA;
            $estadoActivo = SamplesEnums::ESTADO_ACTIVO;
            $fSeguidorId = FollowsCols::SEGUIDOR_ID;
            $fSeguidoId = FollowsCols::SEGUIDO_ID;
            $coleccionId = ColeccionSamplesCols::COLECCION_ID;

            $sql = "
                WITH user_tags AS (
                    SELECT tag, SUM(peso) as afinidad
                    FROM (
                        SELECT UNNEST({$tagsLiked}) as tag,
                               CASE WHEN l.reaccion = '{$reaccionEncanta}' THEN 2.0 ELSE 1.0 END as peso
                        FROM {$tl} l
                        JOIN {$ts} s_l ON l.target_id = s_l.id
                        WHERE l.usuario_id = :userId AND l.tipo = '{$tipoSample}'
                          AND l.reaccion IN ('{$reaccionLike}','{$reaccionEncanta}')
                        LIMIT 200
                    ) liked_tags
                    GROUP BY tag ORDER BY afinidad DESC LIMIT 15
                ),
                coleccion_tags AS (
                    SELECT cs." . ColeccionSamplesCols::COLECCION_ID . ",
                           array_agg(DISTINCT tag_val) as todos_tags,
                           COUNT(DISTINCT cs." . ColeccionSamplesCols::SAMPLE_ID . ") as items
                    FROM {$tcs} cs
                    JOIN {$ts} s_c ON cs." . ColeccionSamplesCols::SAMPLE_ID . " = s_c." . SamplesCols::ID . "
                    CROSS JOIN LATERAL UNNEST(s_c." . SamplesCols::TAGS . ") as tag_val
                    WHERE s_c." . SamplesCols::ESTADO . " = '{$estadoActivo}'
                    GROUP BY cs." . ColeccionSamplesCols::COLECCION_ID . "
                )
                SELECT sub.* FROM (
                    SELECT c.*, u." . UsuariosExtCols::USERNAME . ", u." . UsuariosExtCols::NOMBRE_VISIBLE . ", u." . UsuariosExtCols::AVATAR_URL . ", u." . UsuariosExtCols::WP_USER_ID . ",
                           /* QL114+183A-23: total_items solo cuenta samples activos (mismo criterio que el detalle) */
                           (SELECT COUNT(*) FROM {$tcs} csx
                            JOIN {$ts} s_cnt ON csx.{$csSampleId} = s_cnt.{$sampleId} AND s_cnt.{$sampleEstado} = '{$estadoActivo}'
                            WHERE csx.{$coleccionId} = c." . ColeccionesCols::ID . "
                               OR csx.{$coleccionId} IN (
                                   SELECT sub_c." . ColeccionesCols::ID . " FROM {$t} sub_c WHERE sub_c." . ColeccionesCols::PARENT_ID . " = c." . ColeccionesCols::ID . "
                               )
                           ) as total_items,
                           EXISTS(
                               SELECT 1
                               FROM {$tg} guardadas
                               WHERE guardadas.{$gUsuarioId} = :userId
                                 AND guardadas.{$gColeccionId} = c." . ColeccionesCols::ID . "
                           ) as esta_guardada,
                           {$subqueryTagsMeta} as tags,
                           COALESCE((
                               SELECT SUM(ut.afinidad)
                               FROM user_tags ut
                               WHERE ut.tag = ANY(ct.todos_tags)
                           ), 0) / GREATEST(1.0, array_length(ct.todos_tags, 1)::float) as tag_score,
                           CASE WHEN EXISTS(
                               SELECT 1 FROM {$tf} WHERE {$fSeguidorId} = :userId AND {$fSeguidoId} = c." . ColeccionesCols::USUARIO_ID . "
                           ) THEN 1.3 ELSE 1.0 END as follow_boost,
                           1.0 / (1.0 + EXTRACT(EPOCH FROM NOW() - c." . ColeccionesCols::UPDATED_AT . ") / 86400.0) as frescura,
                           CASE WHEN c.{$colUsuarioId} = :userIdVisibilidad THEN 100.0 ELSE 0.0 END as propio_boost
                    FROM {$t} c
                    JOIN {$tu} u ON c." . ColeccionesCols::USUARIO_ID . " = u." . UsuariosExtCols::ID . "
                    LEFT JOIN coleccion_tags ct ON ct.{$coleccionId} = c." . ColeccionesCols::ID . "
                    WHERE {$whereVisibilidad}
                      AND u." . UsuariosExtCols::ESTADO . " = '" . UsuariosExtEnums::ESTADO_ACTIVO . "'
                      AND COALESCE(ct.items, (SELECT COUNT(*) FROM {$tcs} cs2
                           WHERE cs2." . ColeccionSamplesCols::COLECCION_ID . " = c." . ColeccionesCols::ID . "
                              OR cs2." . ColeccionSamplesCols::COLECCION_ID . " IN (
                                  SELECT sub3." . ColeccionesCols::ID . " FROM {$t} sub3 WHERE sub3." . ColeccionesCols::PARENT_ID . " = c." . ColeccionesCols::ID . "
                              )
                      )) >= 0
                      {$whereBusqueda}
                ) sub
                ORDER BY sub.propio_boost DESC,
                (
                    COALESCE(sub.tag_score, 0) * 0.60
                    * sub.follow_boost
                    + sub.frescura * 0.20
                    + LEAST(sub.total_items::float / 20.0, 1.0) * 0.20
                ) DESC,
                sub." . ColeccionesCols::UPDATED_AT . " DESC
                LIMIT 20 OFFSET :offset
            ";
        } else {
            /* QL114+183A-23: total_items y filtro > 0 solo cuentan samples activos */
            $sql = "
                SELECT c.*, u." . UsuariosExtCols::USERNAME . ", u." . UsuariosExtCols::NOMBRE_VISIBLE . ", u." . UsuariosExtCols::AVATAR_URL . ", u." . UsuariosExtCols::WP_USER_ID . ",
                       (SELECT COUNT(*) FROM {$tcs} cs
                        JOIN {$ts} s_cnt ON cs.{$csSampleId} = s_cnt.{$sampleId} AND s_cnt.{$sampleEstado} = '{$estadoActivo}'
                        WHERE cs." . ColeccionSamplesCols::COLECCION_ID . " = c." . ColeccionesCols::ID . "
                           OR cs." . ColeccionSamplesCols::COLECCION_ID . " IN (
                               SELECT sub." . ColeccionesCols::ID . " FROM {$t} sub WHERE sub." . ColeccionesCols::PARENT_ID . " = c." . ColeccionesCols::ID . "
                           )
                       ) as total_items,
                       {$subqueryTagsMeta} as tags
                FROM {$t} c
                JOIN {$tu} u ON c." . ColeccionesCols::USUARIO_ID . " = u." . UsuariosExtCols::ID . "
                WHERE c." . ColeccionesCols::PUBLICA . " = true
                  AND u." . UsuariosExtCols::ESTADO . " = '" . UsuariosExtEnums::ESTADO_ACTIVO . "'
                  AND (SELECT COUNT(*) FROM {$tcs} cs
                       JOIN {$ts} s_cnt2 ON cs.{$csSampleId} = s_cnt2.{$sampleId} AND s_cnt2.{$sampleEstado} = '{$estadoActivo}'
                       WHERE cs." . ColeccionSamplesCols::COLECCION_ID . " = c." . ColeccionesCols::ID . "
                          OR cs." . ColeccionSamplesCols::COLECCION_ID . " IN (
                              SELECT sub." . ColeccionesCols::ID . " FROM {$t} sub WHERE sub." . ColeccionesCols::PARENT_ID . " = c." . ColeccionesCols::ID . "
                          )
                  ) > 0
                  {$whereBusqueda}
                ORDER BY c." . ColeccionesCols::UPDATED_AT . " DESC
                LIMIT 20 OFFSET :offset
            ";
        }

        return static::consultar($sql, $params);
    }

    /*
     * B1/QL23: Tags más frecuentes de colecciones públicas (explorar).
     * Usa metadata JSONB (tags IA) en vez de s.tags (nombres de artistas WhoSampled).
     * QL30: Prioriza tags (inglés) con fallback a tags_es (español).
     */
    public static function tagsFrecuentesExplorar(int $limite = 15): array
    {
        $t = ColeccionesCols::TABLA;
        $tcs = ColeccionSamplesCols::TABLA;
        $ts = SamplesCols::TABLA;

        $csColeccionId = ColeccionSamplesCols::COLECCION_ID;
        $csSampleId = ColeccionSamplesCols::SAMPLE_ID;
        $sampleId = SamplesCols::ID;
        $sampleMeta = SamplesCols::METADATA;
        $sampleEstado = SamplesCols::ESTADO;
        $estadoActivo = SamplesEnums::ESTADO_ACTIVO;
        $colPublica = ColeccionesCols::PUBLICA;
        $colId = ColeccionesCols::ID;

        $rows = static::consultar(
            "SELECT tag_val, COUNT(*) as frecuencia
             FROM {$tcs} cs
             JOIN {$t} c ON cs.{$csColeccionId} = c.{$colId}
             JOIN " . UsuariosExtCols::TABLA . " u ON c." . ColeccionesCols::USUARIO_ID . " = u." . UsuariosExtCols::ID . "
             JOIN {$ts} s ON cs.{$csSampleId} = s.{$sampleId}
             CROSS JOIN LATERAL jsonb_array_elements_text(
                 COALESCE(
                     CASE WHEN jsonb_typeof(s.{$sampleMeta}->'tags') = 'array' THEN s.{$sampleMeta}->'tags' END,
                     CASE WHEN jsonb_typeof(s.{$sampleMeta}->'tags_es') = 'array' THEN s.{$sampleMeta}->'tags_es' END,
                     '[]'::jsonb
                 )
             ) as tag_val
             WHERE c.{$colPublica} = true
               AND u." . UsuariosExtCols::ESTADO . " = '" . UsuariosExtEnums::ESTADO_ACTIVO . "'
               AND s.{$sampleEstado} = '{$estadoActivo}'
               AND s.{$sampleMeta} IS NOT NULL
             GROUP BY tag_val
             ORDER BY frecuencia DESC
             LIMIT :limite",
            ['limite' => $limite]
        );

        return array_column($rows, 'tag_val');
    }

    /*
     * Obtener colección con datos del creador (JOIN usuarios_ext).
     */
    public static function obtenerConCreador(int $id): ?array
    {
        $t = ColeccionesCols::TABLA;
        $tu = UsuariosExtCols::TABLA;

        return static::consultarUno(
            "SELECT c.*, u." . UsuariosExtCols::USERNAME . ", u." . UsuariosExtCols::NOMBRE_VISIBLE . ", u." . UsuariosExtCols::AVATAR_URL . ", u." . UsuariosExtCols::WP_USER_ID . "
             FROM {$t} c JOIN {$tu} u ON c." . ColeccionesCols::USUARIO_ID . " = u." . UsuariosExtCols::ID . "
             WHERE c." . ColeccionesCols::ID . " = :id
               AND u." . UsuariosExtCols::ESTADO . " = '" . UsuariosExtEnums::ESTADO_ACTIVO . "'",
            ['id' => $id]
        );
    }

    /*
     * 183A-16: Resumen mínimo del padre para renderizar breadcrumbs sin roundtrip extra.
     */
    public static function obtenerResumen(int $id): ?array
    {
        $t = ColeccionesCols::TABLA;

        return static::consultarUno(
            "SELECT " . ColeccionesCols::ID . ", " . ColeccionesCols::NOMBRE . ", " . ColeccionesCols::SLUG
            . " FROM {$t} WHERE " . ColeccionesCols::ID . " = :id",
            ['id' => $id]
        );
    }

    /*
     * Verificar que una colección pertenece al usuario.
     * Retorna registro con id, nombre y version (necesario para changelog y optimistic locking).
     */
    public static function verificarPropiedad(int $id, int $userId): ?array
    {
        $t = ColeccionesCols::TABLA;

        return static::consultarUno(
            "SELECT " . ColeccionesCols::ID . ", " . ColeccionesCols::USUARIO_ID . ", " . ColeccionesCols::PARENT_ID . ", " . ColeccionesCols::NOMBRE . ", " . ColeccionesCols::VERSION
            . " FROM {$t} WHERE " . ColeccionesCols::ID . " = :id AND " . ColeccionesCols::USUARIO_ID . " = :userId",
            ['id' => $id, 'userId' => $userId]
        );
    }

    /*
     * Buscar colección por nombre dentro de la misma jerarquía (raíz o mismo padre).
     * Se usa como lectura de apoyo para dedup y conflictos de rename.
     */
    public static function buscarIdPorNombreEnJerarquia(int $userId, string $nombre, ?int $parentId, ?int $excluirId = null): ?int
    {
        $t = ColeccionesCols::TABLA;
        $params = ['userId' => $userId, 'nombre' => $nombre];
        $wherePadre = $parentId !== null
            ? 'c.' . ColeccionesCols::PARENT_ID . ' = :parentId'
            : 'c.' . ColeccionesCols::PARENT_ID . ' IS NULL';

        if ($parentId !== null) {
            $params['parentId'] = $parentId;
        }

        $sql = "SELECT c." . ColeccionesCols::ID . " FROM {$t} c"
            . " WHERE c." . ColeccionesCols::USUARIO_ID . " = :userId"
            . " AND LOWER(c." . ColeccionesCols::NOMBRE . ") = LOWER(:nombre)"
            . " AND {$wherePadre}";

        if ($excluirId !== null) {
            $sql .= " AND c." . ColeccionesCols::ID . " <> :excluirId";
            $params['excluirId'] = $excluirId;
        }

        $sql .= " LIMIT 1";

        $fila = static::consultarUno($sql, $params);

        return $fila ? (int) $fila[ColeccionesCols::ID] : null;
    }

    /*
     * Crear colección y retornar resultado.
     * Incluye dedup atómico apoyado en el índice único por (usuario, padre/raíz, LOWER(nombre)).
     * parentId: null = colección raíz, int = subcolección.
     * Validación de profundidad máxima (2 niveles) se realiza aquí:
     * si el padre ya tiene parent_id, se rechaza la creación.
     *
     * @return array{id: ?int, creada: bool, error: ?string}
     */
    public static function crear(int $userId, string $nombre, string $descripcion, bool $publica, ?int $parentId = null): array
    {
        $t = ColeccionesCols::TABLA;

        /* Validar profundidad: si parentId dado, verificar que el padre no sea subcolección */
        if ($parentId !== null) {
            $padre = static::consultarUno(
                "SELECT " . ColeccionesCols::ID . ", " . ColeccionesCols::PARENT_ID . ", " . ColeccionesCols::USUARIO_ID
                . " FROM {$t} WHERE " . ColeccionesCols::ID . " = :parentId",
                ['parentId' => $parentId]
            );

            if (!$padre) {
                return ['id' => null, 'creada' => false, 'error' => 'parent_invalido'];
            }

            /* Padre debe pertenecer al mismo usuario */
            if ((int) $padre[ColeccionesCols::USUARIO_ID] !== $userId) {
                return ['id' => null, 'creada' => false, 'error' => 'parent_invalido'];
            }

            /* Máximo 2 niveles: padre no puede tener parent_id */
            if (!empty($padre[ColeccionesCols::PARENT_ID])) {
                return ['id' => null, 'creada' => false, 'error' => 'parent_invalido'];
            }
        }

        $insertParams = [
            'userId' => $userId,
            'parentId' => $parentId,
            'nombre' => $nombre,
            'desc' => $descripcion,
            ColeccionesCols::PUBLICA => $publica ? 'true' : 'false',
        ];

        $insertada = static::consultarUno(
            "WITH insertada AS ("
            . " INSERT INTO {$t} (" . ColeccionesCols::USUARIO_ID . ", " . ColeccionesCols::PARENT_ID . ", " . ColeccionesCols::NOMBRE . ", " . ColeccionesCols::DESCRIPCION . ", " . ColeccionesCols::PUBLICA . ")"
            . " VALUES (:userId, :parentId, :nombre, :desc, :publica)"
            . " ON CONFLICT (" . ColeccionesCols::USUARIO_ID . ", (COALESCE(" . ColeccionesCols::PARENT_ID . ", 0)), (LOWER(" . ColeccionesCols::NOMBRE . "))) DO NOTHING"
            . " RETURNING " . ColeccionesCols::ID . " AS " . ColeccionesCols::ID
            . ")"
            . " SELECT " . ColeccionesCols::ID . " FROM insertada",
            $insertParams
        );

        $newId = $insertada ? (int) $insertada[ColeccionesCols::ID] : null;

        /* Generar y asignar slug con el ID recién creado */
        if ($newId) {
            $slug = self::generarSlug($nombre, $newId);
            static::ejecutar(
                "UPDATE {$t} SET " . ColeccionesCols::SLUG . " = :slug WHERE " . ColeccionesCols::ID . " = :id",
                ['slug' => $slug, 'id' => $newId]
            );

            return ['id' => $newId, 'creada' => true, 'error' => null];
        }

        $existenteId = self::buscarIdPorNombreEnJerarquia($userId, $nombre, $parentId);
        if ($existenteId !== null) {
            return ['id' => $existenteId, 'creada' => false, 'error' => null];
        }

        return ['id' => null, 'creada' => false, 'error' => 'insert_fallido'];
    }

    /*
     * Actualizar campos de una colección con optimistic locking (F5.2).
     *
     * Si $versionEsperada es proporcionada, verifica que la version en BD coincida.
     * Si no coincide, retorna false (conflicto). El caller debe responder 409.
     * Incrementa version automaticamente en cada update exitoso.
     *
     * $campos: array de pares SQL "columna = :param"
     * $params: array de parámetros
     * $versionEsperada: null = sin lock (backwards-compatible), int = optimistic lock
     */
    public static function actualizarCampos(int $id, array $campos, array $params, ?int $versionEsperada = null): bool
    {
        $t = ColeccionesCols::TABLA;
        $params['id'] = $id;

        /* Siempre incrementar version y updated_at */
        $setSql = implode(', ', $campos)
            . ", " . ColeccionesCols::VERSION . " = " . ColeccionesCols::VERSION . " + 1"
            . ", " . ColeccionesCols::UPDATED_AT . " = NOW()";

        $whereSql = ColeccionesCols::ID . " = :id";

        /* Optimistic locking: solo actualizar si la version coincide */
        if ($versionEsperada !== null) {
            $whereSql .= " AND " . ColeccionesCols::VERSION . " = :versionEsperada";
            $params['versionEsperada'] = $versionEsperada;
        }

        $afectadas = static::ejecutar(
            "UPDATE {$t} SET {$setSql} WHERE {$whereSql}",
            $params
        );

        return $afectadas > 0;
    }

    /*
     * Eliminar colección (admin: sin restricción de usuario).
     */
    public static function eliminarConSamples(int $id): int
    {
        $tcs = ColeccionSamplesCols::TABLA;
        $t = ColeccionesCols::TABLA;

        static::ejecutar(
            "DELETE FROM {$tcs} WHERE " . ColeccionSamplesCols::COLECCION_ID . " = :id",
            ['id' => $id]
        );

        return static::ejecutar(
            "DELETE FROM {$t} WHERE " . ColeccionesCols::ID . " = :id",
            ['id' => $id]
        );
    }

    /*
     * Eliminar colección solo si pertenece al usuario.
     * Cascada manual: borra coleccion_samples primero para evitar FK constraint violation.
     */
    public static function eliminarDelUsuario(int $id, int $userId): int
    {
        $t = ColeccionesCols::TABLA;
        $tcs = ColeccionSamplesCols::TABLA;

        /* Verificar propiedad antes de borrar samples (previene escalada de privilegios) */
        $col = static::consultarUno(
            "SELECT " . ColeccionesCols::ID . " FROM {$t} WHERE "
            . ColeccionesCols::ID . " = :id AND " . ColeccionesCols::USUARIO_ID . " = :userId",
            ['id' => $id, 'userId' => $userId]
        );

        if (!$col) return 0;

        static::ejecutar(
            "DELETE FROM {$tcs} WHERE " . ColeccionSamplesCols::COLECCION_ID . " = :id",
            ['id' => $id]
        );

        return static::ejecutar(
            "DELETE FROM {$t} WHERE " . ColeccionesCols::ID . " = :id",
            ['id' => $id]
        );
    }

    /*
     * QL119: Eliminar coleccion con opciones configurables.
     * @param int $id ID de la coleccion a eliminar
     * @param int $userId ID del usuario (para verificar propiedad, ignorado si esAdmin)
     * @param bool $esAdmin Si el usuario es admin (no verifica propiedad)
     * @param array $opciones {
     *   borrarSamples: bool (default false) — eliminar los samples de la BD,
     *   manejoHijas: 'eliminar'|'huerfanas' (default 'huerfanas'),
     *   borrarSamplesHijas: bool (default false) — solo si manejoHijas=eliminar
     * }
     * @return array{eliminada: bool, samplesEliminados: int, hijasEliminadas: int, hijasHuerfanas: int}
     */
    public static function eliminarConOpcionesEnTransaccion(
        int $id,
        int $userId,
        bool $esAdmin,
        array $opciones
    ): array {
        $t = ColeccionesCols::TABLA;
        $tcs = ColeccionSamplesCols::TABLA;

        $borrarSamples = $opciones['borrarSamples'] ?? false;
        $manejoHijas = $opciones['manejoHijas'] ?? 'huerfanas';
        /* 'borrarSamplesHijas' aplica solo si se eliminan las hijas */
        $borrarSamplesHijas = ($manejoHijas === 'eliminar') && ($opciones['borrarSamplesHijas'] ?? false);

        /* Verificar propiedad si no es admin */
        if (!$esAdmin) {
            $col = static::consultarUno(
                "SELECT " . ColeccionesCols::ID . " FROM {$t} WHERE "
                . ColeccionesCols::ID . " = :id AND " . ColeccionesCols::USUARIO_ID . " = :userId",
                ['id' => $id, 'userId' => $userId]
            );
            if (!$col) return ['eliminada' => false, 'samplesEliminados' => 0, 'hijasEliminadas' => 0, 'hijasHuerfanas' => 0];
        }

        $db = \App\Kamples\Database\PostgresService::class;
        $db::iniciarTransaccion();

        try {
            $resultado = ['eliminada' => false, 'samplesEliminados' => 0, 'hijasEliminadas' => 0, 'hijasHuerfanas' => 0];

            /* 1. Obtener IDs de samples de esta coleccion (antes de borrar relaciones) */
            $sampleIds = [];
            if ($borrarSamples) {
                $rows = static::consultar(
                    "SELECT " . ColeccionSamplesCols::SAMPLE_ID . " FROM {$tcs} WHERE "
                    . ColeccionSamplesCols::COLECCION_ID . " = :id",
                    ['id' => $id]
                );
                $sampleIds = array_column($rows, ColeccionSamplesCols::SAMPLE_ID);
            }

            /* 2. Manejar subcolecciones */
            $hijas = static::consultar(
                "SELECT " . ColeccionesCols::ID . " FROM {$t} WHERE "
                . ColeccionesCols::PARENT_ID . " = :id",
                ['id' => $id]
            );
            $hijasIds = array_column($hijas, ColeccionesCols::ID);

            if (!empty($hijasIds)) {
                if ($manejoHijas === 'eliminar') {
                    /* Eliminar cada hija (con o sin sus samples) */
                    foreach ($hijasIds as $hijaId) {
                        $hijaId = (int)$hijaId;

                        if ($borrarSamplesHijas) {
                            $rowsHija = static::consultar(
                                "SELECT " . ColeccionSamplesCols::SAMPLE_ID . " FROM {$tcs} WHERE "
                                . ColeccionSamplesCols::COLECCION_ID . " = :id",
                                ['id' => $hijaId]
                            );
                            foreach ($rowsHija as $row) {
                                SamplesRepository::eliminarConCascada((int)$row[ColeccionSamplesCols::SAMPLE_ID]);
                                $resultado['samplesEliminados']++;
                            }
                        }

                        /* Borrar relaciones sample-coleccion de la hija */
                        static::ejecutar(
                            "DELETE FROM {$tcs} WHERE " . ColeccionSamplesCols::COLECCION_ID . " = :id",
                            ['id' => $hijaId]
                        );
                        /* Borrar la hija */
                        static::ejecutar(
                            "DELETE FROM {$t} WHERE " . ColeccionesCols::ID . " = :id",
                            ['id' => $hijaId]
                        );
                        $resultado['hijasEliminadas']++;
                    }
                } else {
                    /* Dejar huerfanas: quitar parent_id */
                    static::ejecutar(
                        "UPDATE {$t} SET " . ColeccionesCols::PARENT_ID . " = NULL WHERE "
                        . ColeccionesCols::PARENT_ID . " = :id",
                        ['id' => $id]
                    );
                    $resultado['hijasHuerfanas'] = count($hijasIds);
                }
            }

            /* 3. Eliminar samples de la coleccion principal si se pidio */
            if ($borrarSamples && !empty($sampleIds)) {
                foreach ($sampleIds as $sampleId) {
                    SamplesRepository::eliminarConCascada((int)$sampleId);
                    $resultado['samplesEliminados']++;
                }
            }

            /* 4. Borrar relaciones sample-coleccion de la principal */
            static::ejecutar(
                "DELETE FROM {$tcs} WHERE " . ColeccionSamplesCols::COLECCION_ID . " = :id",
                ['id' => $id]
            );

            /* 5. Borrar la coleccion */
            $rows = static::ejecutar(
                "DELETE FROM {$t} WHERE " . ColeccionesCols::ID . " = :id",
                ['id' => $id]
            );
            $resultado['eliminada'] = $rows > 0;

            $db::confirmar();
            return $resultado;
        } catch (\Throwable $e) {
            $db::revertir();
            throw $e;
        }
    }

    /*
     * Obtener colecciones del usuario relevantes para un sample (ranking por tags comunes).
     */
    public static function relevantesParaSample(int $userId, array $sampleTags): array
    {
        $t = ColeccionesCols::TABLA;
        $tcs = ColeccionSamplesCols::TABLA;
        $ts = SamplesCols::TABLA;

        return static::consultar(
            "SELECT c.*,
                    (SELECT COUNT(*) FROM {$tcs} cs WHERE cs." . ColeccionSamplesCols::COLECCION_ID . " = c." . ColeccionesCols::ID . ") as total_items,
                    (SELECT COUNT(*) FROM {$tcs} cs2
                     JOIN {$ts} s2 ON cs2." . ColeccionSamplesCols::SAMPLE_ID . " = s2." . SamplesCols::ID . "
                     WHERE cs2." . ColeccionSamplesCols::COLECCION_ID . " = c." . ColeccionesCols::ID . " AND s2." . SamplesCols::TAGS . " && :tags) as tags_match
             FROM {$t} c
             WHERE c." . ColeccionesCols::USUARIO_ID . " = :userId
             ORDER BY tags_match DESC, c." . ColeccionesCols::UPDATED_AT . " DESC",
            ['userId' => $userId, SamplesCols::TAGS => '{' . implode(',', $sampleTags) . '}']
        );
    }

    /*
     * Tocar timestamp de updated_at (para cuando se agregan/quitan samples).
     */
    public static function tocarTimestamp(int $id): void
    {
        $t = ColeccionesCols::TABLA;

        static::ejecutar(
            "UPDATE {$t} SET " . ColeccionesCols::UPDATED_AT . " = NOW() WHERE " . ColeccionesCols::ID . " = :id",
            ['id' => $id]
        );
    }

    /*
     * Verificar si una colección es pública.
     */
    public static function esPublica(int $id): bool
    {
        $t = ColeccionesCols::TABLA;

        $row = static::consultarUno(
            "SELECT 1 FROM {$t} WHERE " . ColeccionesCols::ID . " = :id AND " . ColeccionesCols::PUBLICA . " = true",
            ['id' => $id]
        );

        return $row !== null;
    }

    /*
     * Obtener samples de una colección con datos para ZIP.
     */
    public static function samplesDeColeccion(int $coleccionId): array
    {
        $ts = SamplesCols::TABLA;
        $tcs = ColeccionSamplesCols::TABLA;

        return static::consultar(
            "SELECT s." . SamplesCols::ID
            . ", s." . SamplesCols::TITULO
            . ", s." . SamplesCols::RUTA_ORIGINAL
            . ", s." . SamplesCols::RUTA_OPTIMIZADA
            . ", s." . SamplesCols::ES_PREMIUM
            . ", s." . SamplesCols::CREADOR_ID
            . " FROM {$ts} s"
            . " INNER JOIN {$tcs} cs ON cs." . ColeccionSamplesCols::SAMPLE_ID . " = s." . SamplesCols::ID
            . " WHERE cs." . ColeccionSamplesCols::COLECCION_ID . " = :coleccionId"
            . " AND s." . SamplesCols::ESTADO . " = '" . SamplesEnums::ESTADO_ACTIVO . "'"
            . " ORDER BY cs." . ColeccionSamplesCols::ADDED_AT . " ASC",
            ['coleccionId' => $coleccionId]
        );
    }

    /*
     * D3: IDs de subcolecciones de un padre. Para vista virtual que agrega samples heredados.
     */
    public static function idsSubcolecciones(int $parentId): array
    {
        $t = ColeccionesCols::TABLA;

        $rows = static::consultar(
            "SELECT " . ColeccionesCols::ID . " FROM {$t} WHERE " . ColeccionesCols::PARENT_ID . " = :parentId",
            ['parentId' => $parentId]
        );

        return \array_map(fn($r) => (int) $r[ColeccionesCols::ID], $rows);
    }

    /**
     * Lista colecciones publicas para el sitemap XML.
     */
    public static function listarParaSitemap(int $limit = 2000, int $offset = 0): array
    {
        $t = ColeccionesCols::TABLA;
        $sql = "SELECT " . ColeccionesCols::ID . ", " . ColeccionesCols::SLUG . ", " . ColeccionesCols::UPDATED_AT . ", " . ColeccionesCols::CREATED_AT
             . " FROM {$t}"
             . " WHERE " . ColeccionesCols::PUBLICA . " = true"
             . " AND " . ColeccionesCols::TOTAL_SAMPLES . " > 0"
             . " ORDER BY " . ColeccionesCols::UPDATED_AT . " DESC"
             . " LIMIT :limit OFFSET :offset";

        return static::consultar($sql, ['limit' => $limit, 'offset' => $offset]);
    }

    /**
     * Cuenta total de colecciones publicas indexables para paginacion del sitemap.
     */
    public static function contarParaSitemap(): int
    {
        $t = ColeccionesCols::TABLA;
        $sql = "SELECT COUNT(*) FROM {$t}"
             . " WHERE " . ColeccionesCols::PUBLICA . " = true"
             . " AND " . ColeccionesCols::TOTAL_SAMPLES . " > 0";

        $resultado = static::consultarValor($sql, []);
        return (int) ($resultado ?? 0);
    }

    /*
     * Generar slug SEO para una colección: sanitize_title(nombre) + '-' + id.
     * Formato: "mi-coleccion-42"
     * [183A-51] sanitize_title convierte unicode multi-byte (ej: fraktur 𝔐𝔢𝔪) a
     * secuencias %XX que rompen el route pattern de WordPress REST. Se limpian
     * los percent-encoded chars para producir slugs ASCII puros.
     */
    public static function generarSlug(string $nombre, int $id): string
    {
        $base = \sanitize_title($nombre);
        /* Eliminar secuencias %XX que utf8_uri_encode genera para unicode */
        $base = preg_replace('/%[a-f0-9]{2}/i', '', $base);
        $base = preg_replace('/-+/', '-', $base);
        $base = trim($base, '-');
        if (empty($base)) {
            $base = 'coleccion';
        }
        return $base . '-' . $id;
    }

    /*
     * Buscar colección por slug. Retorna la fila completa con datos del creador.
     */
    public static function obtenerPorSlug(string $slug): ?array
    {
        $t = ColeccionesCols::TABLA;
        $tu = UsuariosExtCols::TABLA;

        return static::consultarUno(
            "SELECT c.*, u." . UsuariosExtCols::USERNAME
            . ", u." . UsuariosExtCols::NOMBRE_VISIBLE
            . ", u." . UsuariosExtCols::AVATAR_URL
            . ", u." . UsuariosExtCols::WP_USER_ID
            . " FROM {$t} c"
            . " JOIN {$tu} u ON c." . ColeccionesCols::USUARIO_ID . " = u." . UsuariosExtCols::ID
            . " WHERE c." . ColeccionesCols::SLUG . " = :slug",
            ['slug' => $slug]
        );
    }

    /* [183A-51] Actualizar slug de una colección existente. */
    public static function actualizarSlug(int $id, string $nuevoSlug): void
    {
        $t = ColeccionesCols::TABLA;
        static::ejecutar(
            "UPDATE {$t} SET " . ColeccionesCols::SLUG . " = :slug WHERE " . ColeccionesCols::ID . " = :id",
            ['slug' => $nuevoSlug, 'id' => $id]
        );
    }

    /*
     * Generar slugs faltantes o reparar slugs rotos para colecciones existentes.
     * [183A-51] También corrige slugs con secuencias %XX de unicode mal procesado.
     */
    public static function generarSlugsFaltantes(): int
    {
        $t = ColeccionesCols::TABLA;
        $sinSlug = static::consultar(
            "SELECT " . ColeccionesCols::ID . ", " . ColeccionesCols::NOMBRE
            . " FROM {$t} WHERE " . ColeccionesCols::SLUG . " IS NULL OR " . ColeccionesCols::SLUG . " = ''"
            . " OR " . ColeccionesCols::SLUG . " LIKE :patron",
            ['patron' => '%\\%%']
        );

        $actualizados = 0;
        foreach ($sinSlug as $col) {
            $slug = self::generarSlug($col[ColeccionesCols::NOMBRE], (int) $col[ColeccionesCols::ID]);
            static::ejecutar(
                "UPDATE {$t} SET " . ColeccionesCols::SLUG . " = :slug WHERE " . ColeccionesCols::ID . " = :id",
                ['slug' => $slug, 'id' => (int) $col[ColeccionesCols::ID]]
            );
            $actualizados++;
        }

        return $actualizados;
    }

    /*
     * QL115: Combinar colección origen → destino en una transaccion atómica.
     * Mueve samples, maneja subcolecciones y retorna datos de backup para undo.
     *
     * @param int $origenId       Colección que desaparece
     * @param int $destinoId      Colección que absorbe
     * @param string $nombreFinal Nombre a conservar
     * @param string|null $imagenFinal Imagen de portada a conservar
     * @param string $manejoHijas 'mover'|'aplanar' — mover hijas al destino o fusionar sus samples
     * @param int|null $usuarioDestinoId Si admin combina de distintos usuarios, ID del propietario final
     * @return array{backupMeta: array, samplesMovidos: int}|null  null si falla
     */
    public static function combinarEnTransaccion(
        int $origenId,
        int $destinoId,
        string $nombreFinal,
        ?string $imagenFinal,
        string $manejoHijas = 'mover',
        ?int $usuarioDestinoId = null
    ): ?array {
        $t = ColeccionesCols::TABLA;
        $tcs = ColeccionSamplesCols::TABLA;
        $colId = ColeccionesCols::ID;
        $csColId = ColeccionSamplesCols::COLECCION_ID;
        $csSampleId = ColeccionSamplesCols::SAMPLE_ID;
        $parentIdCol = ColeccionesCols::PARENT_ID;
        $colUsuarioId = ColeccionesCols::USUARIO_ID;

        /* Obtener datos de ambas colecciones para backup */
        $origen = static::buscarPorId($origenId);
        $destino = static::buscarPorId($destinoId);
        if (!$origen || !$destino) return null;

        /* IDs de samples en la colección origen (para backup) */
        $samplesOrigen = static::consultar(
            "SELECT {$csSampleId} FROM {$tcs} WHERE {$csColId} = :id",
            ['id' => $origenId]
        );
        $idsSamplesOrigen = \array_map(fn($r) => (int) $r[$csSampleId], $samplesOrigen);

        /* Hijas de la colección origen */
        $hijasOrigen = static::listarSubcolecciones($origenId);
        $idsHijas = \array_map(fn($h) => (int) $h[$colId], $hijasOrigen);

        /* Backup de hijas (nombre, samples) para undo */
        $hijasBackup = [];
        foreach ($hijasOrigen as $hija) {
            $hijaId = (int) $hija[$colId];
            $samplesHija = static::consultar(
                "SELECT {$csSampleId} FROM {$tcs} WHERE {$csColId} = :id",
                ['id' => $hijaId]
            );
            $hijasBackup[] = [
                'id' => $hijaId,
                'nombre' => $hija[ColeccionesCols::NOMBRE] ?? '',
                'parentId' => $origenId,
                'sampleIds' => \array_map(fn($r) => (int) $r[$csSampleId], $samplesHija),
            ];
        }

        /* Construir backup completo para undo */
        $backupMeta = [
            'tipo_operacion' => 'combinacion',
            'origenId' => $origenId,
            'origenNombre' => $origen[ColeccionesCols::NOMBRE],
            'origenDescripcion' => $origen[ColeccionesCols::DESCRIPCION] ?? '',
            'origenImagenUrl' => $origen[ColeccionesCols::IMAGEN_URL] ?? null,
            'origenPublica' => (bool) ($origen[ColeccionesCols::PUBLICA] ?? true),
            'origenParentId' => $origen[$parentIdCol] ?? null,
            'origenUsuarioId' => (int) $origen[$colUsuarioId],
            'destinoNombreAnterior' => $destino[ColeccionesCols::NOMBRE],
            'destinoImagenAnterior' => $destino[ColeccionesCols::IMAGEN_URL] ?? null,
            'destinoUsuarioId' => (int) $destino[$colUsuarioId],
            'samplesOrigenIds' => $idsSamplesOrigen,
            'hijasBackup' => $hijasBackup,
            'manejoHijas' => $manejoHijas,
            'combinadoEn' => date('c'),
        ];

        $db = \App\Kamples\Database\PostgresService::class;
        $db::iniciarTransaccion();

        try {
            /* 1. Mover samples de origen a destino (ON CONFLICT ignora duplicados) */
            if (!empty($idsSamplesOrigen)) {
                static::ejecutar(
                    "INSERT INTO {$tcs} ({$csColId}, {$csSampleId}, "
                    . ColeccionSamplesCols::USUARIO_ID . ", " . ColeccionSamplesCols::ADDED_AT . ")"
                    . " SELECT :destId, {$csSampleId}, "
                    . ColeccionSamplesCols::USUARIO_ID . ", " . ColeccionSamplesCols::ADDED_AT
                    . " FROM {$tcs} WHERE {$csColId} = :origId"
                    . " ON CONFLICT ({$csColId}, {$csSampleId}) DO NOTHING",
                    ['destId' => $destinoId, 'origId' => $origenId]
                );

                /* Limpiar samples del origen */
                static::ejecutar(
                    "DELETE FROM {$tcs} WHERE {$csColId} = :id",
                    ['id' => $origenId]
                );
            }

            /* 2. Manejar subcolecciones del origen */
            if (!empty($idsHijas)) {
                if ($manejoHijas === 'aplanar') {
                    /* Aplanar: mover samples de cada hija al destino, luego eliminar hijas */
                    foreach ($idsHijas as $hijaId) {
                        static::ejecutar(
                            "INSERT INTO {$tcs} ({$csColId}, {$csSampleId}, "
                            . ColeccionSamplesCols::USUARIO_ID . ", " . ColeccionSamplesCols::ADDED_AT . ")"
                            . " SELECT :destId, {$csSampleId}, "
                            . ColeccionSamplesCols::USUARIO_ID . ", " . ColeccionSamplesCols::ADDED_AT
                            . " FROM {$tcs} WHERE {$csColId} = :hijaId"
                            . " ON CONFLICT ({$csColId}, {$csSampleId}) DO NOTHING",
                            ['destId' => $destinoId, 'hijaId' => $hijaId]
                        );
                        static::ejecutar(
                            "DELETE FROM {$tcs} WHERE {$csColId} = :id",
                            ['id' => $hijaId]
                        );
                        static::ejecutar(
                            "DELETE FROM {$t} WHERE {$colId} = :id",
                            ['id' => $hijaId]
                        );
                    }
                } else {
                    /* Mover: reasignar parent_id de las hijas al destino */
                    static::ejecutar(
                        "UPDATE {$t} SET {$parentIdCol} = :destId WHERE {$parentIdCol} = :origId",
                        ['destId' => $destinoId, 'origId' => $origenId]
                    );

                    /* Si el destino es subcolección (tiene parent), las hijas no pueden ser sub-sub.
                       En ese caso, forzar aplanar */
                    if (!empty($destino[$parentIdCol])) {
                        foreach ($idsHijas as $hijaId) {
                            static::ejecutar(
                                "INSERT INTO {$tcs} ({$csColId}, {$csSampleId}, "
                                . ColeccionSamplesCols::USUARIO_ID . ", " . ColeccionSamplesCols::ADDED_AT . ")"
                                . " SELECT :destId, {$csSampleId}, "
                                . ColeccionSamplesCols::USUARIO_ID . ", " . ColeccionSamplesCols::ADDED_AT
                                . " FROM {$tcs} WHERE {$csColId} = :hijaId"
                                . " ON CONFLICT ({$csColId}, {$csSampleId}) DO NOTHING",
                                ['destId' => $destinoId, 'hijaId' => $hijaId]
                            );
                            static::ejecutar(
                                "DELETE FROM {$tcs} WHERE {$csColId} = :id",
                                ['id' => $hijaId]
                            );
                            static::ejecutar(
                                "DELETE FROM {$t} WHERE {$colId} = :id",
                                ['id' => $hijaId]
                            );
                        }
                    }
                }
            }

            /* 3. Si admin cambia el propietario de la colección destino */
            if ($usuarioDestinoId !== null && $usuarioDestinoId !== (int) $destino[$colUsuarioId]) {
                static::ejecutar(
                    "UPDATE {$t} SET {$colUsuarioId} = :nuevoUser WHERE {$colId} = :id",
                    ['nuevoUser' => $usuarioDestinoId, 'id' => $destinoId]
                );
            }

            /* [183A-53] 4. Eliminar la colección origen ANTES de actualizar destino.
             * El UNIQUE INDEX idx_colecciones_nombre_unico_por_padre impide renombrar
             * el destino al nombre del origen si este aún existe. CASCADE elimina
             * likes y guardados asociados. */
            static::ejecutar(
                "DELETE FROM {$t} WHERE {$colId} = :id",
                ['id' => $origenId]
            );

            /* 5. Actualizar nombre e imagen del destino */
            $setCampos = [ColeccionesCols::NOMBRE . " = :nombre"];
            $paramsUpd = ['nombre' => $nombreFinal, 'id' => $destinoId];

            if ($imagenFinal !== null) {
                $setCampos[] = ColeccionesCols::IMAGEN_URL . " = :imagen";
                $paramsUpd['imagen'] = $imagenFinal;
            }

            /* Regenerar slug con nuevo nombre */
            $nuevoSlug = static::generarSlug($nombreFinal, $destinoId);
            $setCampos[] = ColeccionesCols::SLUG . " = :slug";
            $paramsUpd['slug'] = $nuevoSlug;

            $setCampos[] = ColeccionesCols::UPDATED_AT . " = NOW()";
            static::ejecutar(
                "UPDATE {$t} SET " . implode(', ', $setCampos) . " WHERE {$colId} = :id",
                $paramsUpd
            );

            $db::confirmar();

            /* Contar samples movidos realmente (excluyendo duplicados) */
            $totalEnDestino = (int) static::consultarValor(
                "SELECT COUNT(*) FROM {$tcs} WHERE {$csColId} = :id",
                ['id' => $destinoId]
            );

            return [
                'backupMeta' => $backupMeta,
                'samplesMovidos' => count($idsSamplesOrigen),
                'totalEnDestino' => $totalEnDestino,
            ];
        } catch (\Throwable $e) {
            $db::revertir();
            throw $e;
        }
    }

    /*
     * QL115: Restaurar colección combinada usando datos de backup del changelog.
     * Recrea la colección origen, devuelve sus samples y restaura hijas.
     *
     * @param array $backupMeta Datos de backup guardados en sync_changelog.metadata
     * @return bool true si se restauró correctamente
     */
    public static function deshacerCombinacionEnTransaccion(array $backupMeta): bool
    {
        $t = ColeccionesCols::TABLA;
        $tcs = ColeccionSamplesCols::TABLA;
        $colId = ColeccionesCols::ID;
        $csColId = ColeccionSamplesCols::COLECCION_ID;
        $csSampleId = ColeccionSamplesCols::SAMPLE_ID;

        $origenId = (int) ($backupMeta['origenId'] ?? 0);
        $destinoId = (int) ($backupMeta['destinoId'] ?? 0);
        if ($origenId === 0 || $destinoId === 0) return false;

        /* Verificar que el destino todavía existe */
        $destino = static::buscarPorId($destinoId);
        if (!$destino) return false;

        $db = \App\Kamples\Database\PostgresService::class;
        $db::iniciarTransaccion();

        try {
            /* [183A-53] 1. Restaurar nombre e imagen del destino PRIMERO.
             * Evita UNIQUE conflict en idx_colecciones_nombre_unico_por_padre
             * si el destino fue renombrado al nombre del origen durante la combinación. */
            $setRestore = [ColeccionesCols::NOMBRE . " = :nombre"];
            $prRestore = ['nombre' => $backupMeta['destinoNombreAnterior'] ?? $destino[ColeccionesCols::NOMBRE], 'id' => $destinoId];

            if (isset($backupMeta['destinoImagenAnterior'])) {
                $setRestore[] = ColeccionesCols::IMAGEN_URL . " = :imagen";
                $prRestore['imagen'] = $backupMeta['destinoImagenAnterior'];
            }

            /* Restaurar slug */
            $slugRestore = static::generarSlug($prRestore['nombre'], $destinoId);
            $setRestore[] = ColeccionesCols::SLUG . " = :slug";
            $prRestore['slug'] = $slugRestore;

            $setRestore[] = ColeccionesCols::UPDATED_AT . " = NOW()";
            static::ejecutar(
                "UPDATE {$t} SET " . implode(', ', $setRestore) . " WHERE {$colId} = :id",
                $prRestore
            );

            /* 2. Recrear colección origen con ID original usando INSERT con id explícito */
            $origenNombre = $backupMeta['origenNombre'] ?? 'Colección restaurada';
            $origenUsuarioId = (int) ($backupMeta['origenUsuarioId'] ?? $destino[ColeccionesCols::USUARIO_ID]);
            $origenDesc = $backupMeta['origenDescripcion'] ?? '';
            $origenImagen = $backupMeta['origenImagenUrl'] ?? null;
            $origenPublica = ($backupMeta['origenPublica'] ?? true) ? 'true' : 'false';
            $origenParentId = $backupMeta['origenParentId'] ?? null;

            static::ejecutar(
                "INSERT INTO {$t} (" . ColeccionesCols::ID . ", " . ColeccionesCols::USUARIO_ID . ", "
                . ColeccionesCols::NOMBRE . ", " . ColeccionesCols::DESCRIPCION . ", "
                . ColeccionesCols::IMAGEN_URL . ", " . ColeccionesCols::PUBLICA . ", "
                . ColeccionesCols::PARENT_ID . ", " . ColeccionesCols::SLUG . ")"
                . " VALUES (:id, :userId, :nombre, :desc, :imagen, {$origenPublica}, :parentId, :slug)"
                . " ON CONFLICT (" . ColeccionesCols::ID . ") DO NOTHING",
                [
                    'id' => $origenId,
                    'userId' => $origenUsuarioId,
                    'nombre' => $origenNombre,
                    'desc' => $origenDesc,
                    'imagen' => $origenImagen,
                    'parentId' => $origenParentId,
                    'slug' => static::generarSlug($origenNombre, $origenId),
                ]
            );

            /* 2. Devolver samples al origen (copiar del destino, no mover — evita perder si hay error) */
            $samplesOrigenIds = $backupMeta['samplesOrigenIds'] ?? [];
            if (!empty($samplesOrigenIds)) {
                /* Mover de vuelta: los que aún existen en el destino */
                $placeholders = implode(',', array_map(fn($i) => ':s' . $i, range(0, count($samplesOrigenIds) - 1)));
                $p = ['origId' => $origenId, 'destId' => $destinoId];
                foreach ($samplesOrigenIds as $i => $sid) {
                    $p['s' . $i] = $sid;
                }

                /* Copiar al origen */
                static::ejecutar(
                    "INSERT INTO {$tcs} ({$csColId}, {$csSampleId}, "
                    . ColeccionSamplesCols::USUARIO_ID . ", " . ColeccionSamplesCols::ADDED_AT . ")"
                    . " SELECT :origId, {$csSampleId}, "
                    . ColeccionSamplesCols::USUARIO_ID . ", " . ColeccionSamplesCols::ADDED_AT
                    . " FROM {$tcs} WHERE {$csColId} = :destId AND {$csSampleId} IN ({$placeholders})"
                    . " ON CONFLICT ({$csColId}, {$csSampleId}) DO NOTHING",
                    $p
                );

                /* Quitar del destino */
                $pDel = ['destId' => $destinoId];
                foreach ($samplesOrigenIds as $i => $sid) {
                    $pDel['s' . $i] = $sid;
                }
                static::ejecutar(
                    "DELETE FROM {$tcs} WHERE {$csColId} = :destId AND {$csSampleId} IN ({$placeholders})",
                    $pDel
                );
            }

            /* 3. Restaurar hijas si corresponde */
            $hijasBackup = $backupMeta['hijasBackup'] ?? [];
            $manejoHijas = $backupMeta['manejoHijas'] ?? 'mover';

            foreach ($hijasBackup as $hijaData) {
                $hijaId = (int) ($hijaData['id'] ?? 0);
                if ($hijaId === 0) continue;

                if ($manejoHijas === 'aplanar') {
                    /* Las hijas fueron eliminadas + sus samples aplanados al destino.
                       Recrear la hija y devolver sus samples */
                    static::ejecutar(
                        "INSERT INTO {$t} (" . ColeccionesCols::ID . ", " . ColeccionesCols::USUARIO_ID . ", "
                        . ColeccionesCols::NOMBRE . ", " . ColeccionesCols::PARENT_ID . ", " . ColeccionesCols::SLUG . ")"
                        . " VALUES (:id, :userId, :nombre, :parentId, :slug)"
                        . " ON CONFLICT (" . ColeccionesCols::ID . ") DO NOTHING",
                        [
                            'id' => $hijaId,
                            'userId' => $origenUsuarioId,
                            'nombre' => $hijaData['nombre'] ?? 'Subcolección restaurada',
                            'parentId' => $origenId,
                            'slug' => static::generarSlug($hijaData['nombre'] ?? 'subcol', $hijaId),
                        ]
                    );

                    /* Devolver samples de la hija */
                    $hijaSampleIds = $hijaData['sampleIds'] ?? [];
                    if (!empty($hijaSampleIds)) {
                        $ph = implode(',', array_map(fn($i) => ':hs' . $i, range(0, count($hijaSampleIds) - 1)));
                        $hp = ['hijaId' => $hijaId, 'destId' => $destinoId];
                        foreach ($hijaSampleIds as $i => $sid) {
                            $hp['hs' . $i] = $sid;
                        }
                        static::ejecutar(
                            "INSERT INTO {$tcs} ({$csColId}, {$csSampleId}, "
                            . ColeccionSamplesCols::USUARIO_ID . ", " . ColeccionSamplesCols::ADDED_AT . ")"
                            . " SELECT :hijaId, {$csSampleId}, "
                            . ColeccionSamplesCols::USUARIO_ID . ", " . ColeccionSamplesCols::ADDED_AT
                            . " FROM {$tcs} WHERE {$csColId} = :destId AND {$csSampleId} IN ({$ph})"
                            . " ON CONFLICT ({$csColId}, {$csSampleId}) DO NOTHING",
                            $hp
                        );
                        $hpDel = ['destId' => $destinoId];
                        foreach ($hijaSampleIds as $i => $sid) {
                            $hpDel['hs' . $i] = $sid;
                        }
                        static::ejecutar(
                            "DELETE FROM {$tcs} WHERE {$csColId} = :destId AND {$csSampleId} IN ({$ph})",
                            $hpDel
                        );
                    }
                } else {
                    /* Las hijas fueron movidas al destino como parent — reasignar al origen */
                    static::ejecutar(
                        "UPDATE {$t} SET " . ColeccionesCols::PARENT_ID . " = :origId WHERE {$colId} = :hijaId",
                        ['origId' => $origenId, 'hijaId' => $hijaId]
                    );
                }
            }

            /* 5. Restaurar propietario si se cambió */
            if (isset($backupMeta['destinoUsuarioId'])) {
                $ownerAnterior = (int) $backupMeta['destinoUsuarioId'];
                $ownerActual = (int) ($destino[ColeccionesCols::USUARIO_ID] ?? 0);
                if ($ownerAnterior !== $ownerActual) {
                    static::ejecutar(
                        "UPDATE {$t} SET {$colId} = :userId WHERE {$colId} = :id",
                        ['userId' => $ownerAnterior, 'id' => $destinoId]
                    );
                }
            }

            $db::confirmar();
            return true;
        } catch (\Throwable $e) {
            $db::revertir();
            throw $e;
        }
    }
}
