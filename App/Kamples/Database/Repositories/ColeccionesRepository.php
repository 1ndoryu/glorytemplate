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
use App\Config\Schema\_generated\LikesCols;
use App\Config\Schema\_generated\LikesEnums;
use App\Config\Schema\_generated\FollowsCols;
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
            "SELECT * FROM {$tabla} WHERE {$col} = :usuarioId ORDER BY " . ColeccionesCols::ID . " DESC LIMIT :limit OFFSET :offset",
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
         * C388: Subquery para tags agregados de cada colección.
         * UNNEST + DISTINCT sobre los tags de samples activos vinculados.
         */
        $sampleId = SamplesCols::ID;
        $sampleTags = SamplesCols::TAGS;
        $sampleEstado = SamplesCols::ESTADO;
        $estadoActivo = SamplesEnums::ESTADO_ACTIVO;
        $csSampleId = ColeccionSamplesCols::SAMPLE_ID;
        $csColeccionId = ColeccionSamplesCols::COLECCION_ID;
        $colId = ColeccionesCols::ID;

        $todas = static::consultar(
            "SELECT c.*,
                    (SELECT COUNT(*) FROM {$tcs} cs WHERE cs.{$csColeccionId} = c.{$colId}) as total_items,
                    COALESCE(
                        (SELECT array_agg(DISTINCT tag_val)
                         FROM {$tcs} cs2
                         JOIN {$ts} s ON cs2.{$csSampleId} = s.{$sampleId}
                         CROSS JOIN LATERAL UNNEST(s.{$sampleTags}) as tag_val
                         WHERE cs2.{$csColeccionId} = c.{$colId}
                           AND s.{$sampleEstado} = '{$estadoActivo}'),
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
     * C388: Tags más frecuentes del usuario (agregados de sus colecciones).
     * Devuelve array de strings ordenados por frecuencia descendente.
     */
    public static function tagsFrecuentesDelUsuario(int $userId, int $limite = 15): array
    {
        $t = ColeccionesCols::TABLA;
        $tcs = ColeccionSamplesCols::TABLA;
        $ts = SamplesCols::TABLA;

        $csColeccionId = ColeccionSamplesCols::COLECCION_ID;
        $csSampleId = ColeccionSamplesCols::SAMPLE_ID;
        $sampleId = SamplesCols::ID;
        $sampleTags = SamplesCols::TAGS;
        $sampleEstado = SamplesCols::ESTADO;
        $estadoActivo = SamplesEnums::ESTADO_ACTIVO;
        $colUsuarioId = ColeccionesCols::USUARIO_ID;
        $colId = ColeccionesCols::ID;

        $rows = static::consultar(
            "SELECT tag_val, COUNT(*) as frecuencia
             FROM {$tcs} cs
             JOIN {$t} c ON cs.{$csColeccionId} = c.{$colId}
             JOIN {$ts} s ON cs.{$csSampleId} = s.{$sampleId}
             CROSS JOIN LATERAL UNNEST(s.{$sampleTags}) as tag_val
             WHERE c.{$colUsuarioId} = :userId
               AND s.{$sampleEstado} = '{$estadoActivo}'
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

        return static::consultar(
            "SELECT c.*, (SELECT COUNT(*) FROM {$tcs} cs WHERE cs." . ColeccionSamplesCols::COLECCION_ID . " = c." . ColeccionesCols::ID . ") as total_items
             FROM {$t} c WHERE c." . ColeccionesCols::PARENT_ID . " = :parentId ORDER BY c." . ColeccionesCols::NOMBRE . " ASC",
            ['parentId' => $parentId]
        );
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

        if ($userId) {
            $params['userId'] = $userId;
            $params['userIdVisibilidad'] = $userId;
            $whereVisibilidad = "(c.{$colPublica} = true OR c.{$colUsuarioId} = :userIdVisibilidad)";
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
                           COALESCE(ct.items, 0) as total_items,
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
                      AND COALESCE(ct.items, (SELECT COUNT(*) FROM {$tcs} cs2 WHERE cs2." . ColeccionSamplesCols::COLECCION_ID . " = c." . ColeccionesCols::ID . ")) >= 0
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
            $sql = "
                SELECT c.*, u." . UsuariosExtCols::USERNAME . ", u." . UsuariosExtCols::NOMBRE_VISIBLE . ", u." . UsuariosExtCols::AVATAR_URL . ", u." . UsuariosExtCols::WP_USER_ID . ",
                       (SELECT COUNT(*) FROM {$tcs} cs WHERE cs." . ColeccionSamplesCols::COLECCION_ID . " = c." . ColeccionesCols::ID . ") as total_items
                FROM {$t} c
                JOIN {$tu} u ON c." . ColeccionesCols::USUARIO_ID . " = u." . UsuariosExtCols::ID . "
                WHERE c." . ColeccionesCols::PUBLICA . " = true
                  AND (SELECT COUNT(*) FROM {$tcs} cs WHERE cs." . ColeccionSamplesCols::COLECCION_ID . " = c." . ColeccionesCols::ID . ") > 0
                  {$whereBusqueda}
                ORDER BY c." . ColeccionesCols::UPDATED_AT . " DESC
                LIMIT 20 OFFSET :offset
            ";
        }

        return static::consultar($sql, $params);
    }

    /*
     * B1: Tags más frecuentes de colecciones públicas (explorar).
     * Agrega tags de todos los samples activos en colecciones públicas.
     */
    public static function tagsFrecuentesExplorar(int $limite = 15): array
    {
        $t = ColeccionesCols::TABLA;
        $tcs = ColeccionSamplesCols::TABLA;
        $ts = SamplesCols::TABLA;

        $csColeccionId = ColeccionSamplesCols::COLECCION_ID;
        $csSampleId = ColeccionSamplesCols::SAMPLE_ID;
        $sampleId = SamplesCols::ID;
        $sampleTags = SamplesCols::TAGS;
        $sampleEstado = SamplesCols::ESTADO;
        $estadoActivo = SamplesEnums::ESTADO_ACTIVO;
        $colPublica = ColeccionesCols::PUBLICA;
        $colId = ColeccionesCols::ID;

        $rows = static::consultar(
            "SELECT tag_val, COUNT(*) as frecuencia
             FROM {$tcs} cs
             JOIN {$t} c ON cs.{$csColeccionId} = c.{$colId}
             JOIN {$ts} s ON cs.{$csSampleId} = s.{$sampleId}
             CROSS JOIN LATERAL UNNEST(s.{$sampleTags}) as tag_val
             WHERE c.{$colPublica} = true
               AND s.{$sampleEstado} = '{$estadoActivo}'
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
             FROM {$t} c JOIN {$tu} u ON c." . ColeccionesCols::USUARIO_ID . " = u." . UsuariosExtCols::ID . " WHERE c." . ColeccionesCols::ID . " = :id",
            ['id' => $id]
        );
    }

    /*
     * Verificar que una colección pertenece al usuario.
     * Retorna el registro mínimo o null.
     */
    public static function verificarPropiedad(int $id, int $userId): ?array
    {
        $t = ColeccionesCols::TABLA;

        return static::consultarUno(
            "SELECT " . ColeccionesCols::ID . " FROM {$t} WHERE " . ColeccionesCols::ID . " = :id AND " . ColeccionesCols::USUARIO_ID . " = :userId",
            ['id' => $id, 'userId' => $userId]
        );
    }

    /*
     * Crear colección y retornar ID.
     * Incluye dedup: si ya existe una colección con el mismo nombre
     * (case-insensitive) para el mismo usuario dentro del mismo padre, retorna el ID existente.
     * parentId: null = colección raíz, int = subcolección.
     * Validación de profundidad máxima (2 niveles) se realiza aquí:
     * si el padre ya tiene parent_id, se rechaza la creación.
     */
    public static function crear(int $userId, string $nombre, string $descripcion, bool $publica, ?int $parentId = null): ?int
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
                return null;
            }

            /* Padre debe pertenecer al mismo usuario */
            if ((int) $padre[ColeccionesCols::USUARIO_ID] !== $userId) {
                return null;
            }

            /* Máximo 2 niveles: padre no puede tener parent_id */
            if (!empty($padre[ColeccionesCols::PARENT_ID])) {
                return null;
            }
        }

        /* Dedup: verificar existencia por (usuario, nombre, padre) — case-insensitive */
        $parentCondition = $parentId !== null
            ? ColeccionesCols::PARENT_ID . " = :parentId"
            : ColeccionesCols::PARENT_ID . " IS NULL";

        $params = ['userId' => $userId, 'nombre' => $nombre];
        if ($parentId !== null) {
            $params['parentId'] = $parentId;
        }

        $existente = static::consultarUno(
            "SELECT " . ColeccionesCols::ID . " FROM {$t} WHERE " . ColeccionesCols::USUARIO_ID . " = :userId AND LOWER(" . ColeccionesCols::NOMBRE . ") = LOWER(:nombre) AND {$parentCondition} LIMIT 1",
            $params
        );
        if ($existente) {
            return (int) $existente[ColeccionesCols::ID];
        }

        $insertParams = [
            'userId' => $userId,
            'nombre' => $nombre,
            'desc' => $descripcion,
            ColeccionesCols::PUBLICA => $publica ? 'true' : 'false',
        ];

        if ($parentId !== null) {
            $insertParams['parentId'] = $parentId;
            return static::insertar(
                "INSERT INTO {$t} (" . ColeccionesCols::USUARIO_ID . ", " . ColeccionesCols::PARENT_ID . ", " . ColeccionesCols::NOMBRE . ", " . ColeccionesCols::DESCRIPCION . ", " . ColeccionesCols::PUBLICA . ")
                 VALUES (:userId, :parentId, :nombre, :desc, :publica) RETURNING " . ColeccionesCols::ID,
                $insertParams
            );
        }

        return static::insertar(
            "INSERT INTO {$t} (" . ColeccionesCols::USUARIO_ID . ", " . ColeccionesCols::NOMBRE . ", " . ColeccionesCols::DESCRIPCION . ", " . ColeccionesCols::PUBLICA . ")
             VALUES (:userId, :nombre, :desc, :publica) RETURNING " . ColeccionesCols::ID,
            $insertParams
        );
    }

    /*
     * Actualizar campos de una colección.
     * $campos: array de pares SQL "columna = :param"
     * $params: array de parámetros incluyendo 'id'
     */
    public static function actualizarCampos(int $id, array $campos, array $params): bool
    {
        $t = ColeccionesCols::TABLA;
        $params['id'] = $id;

        $afectadas = static::ejecutar(
            "UPDATE {$t} SET " . implode(', ', $campos) . ", " . ColeccionesCols::UPDATED_AT . " = NOW() WHERE " . ColeccionesCols::ID . " = :id",
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
}
