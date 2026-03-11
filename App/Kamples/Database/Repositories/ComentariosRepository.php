<?php

/**
 * ComentariosRepository — Acceso a datos para tabla 'comentarios'.
 *
 * SECCION AUTO-GENERADA: Los metodos base se regeneran con schema:generate.
 * SECCION CUSTOM: Todo debajo de la marca CUSTOM se preserva al regenerar.
 *
 * @package Kamples
 */

namespace App\Kamples\Database\Repositories;

use App\Config\Schema\_generated\ComentariosCols;
use App\Config\Schema\_generated\ComentariosEnums;
use App\Config\Schema\_generated\ComentariosDTO;
use App\Config\Schema\_generated\UsuariosExtCols;
use App\Config\Schema\_generated\SamplesCols;
use App\Config\Schema\_generated\PublicacionesCols;
use App\Config\Schema\_generated\CancionesCols;
use App\Config\Schema\_generated\RelacionesSampleCols;

class ComentariosRepository extends BaseRepository
{
    protected static function tabla(): string
    {
        return ComentariosCols::TABLA;
    }

    protected static function colId(): string
    {
        return ComentariosCols::ID;
    }

    /*
     * Buscar registros del usuario dado.
     */
    public static function buscarPorUsuario(int $usuarioId, int $limit = 20, int $offset = 0): array
    {
        $tabla = ComentariosCols::TABLA;
        $col = ComentariosCols::AUTOR_ID;

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
        $tabla = ComentariosCols::TABLA;

        return static::consultar(
            "SELECT * FROM {$tabla} ORDER BY " . ComentariosCols::CREATED_AT . " DESC LIMIT :limit",
            ['limit' => $limit]
        );
    }

    /* === METODOS CUSTOM (seguro para editar debajo de esta linea) === */

                

        

    

    

    

    /*
     * Actualizar estado de moderación de un comentario.
     * Retorna true si el comentario existía.
     */
    public static function actualizarEstadoModeracion(int $id, string $estado): bool
    {
        $tabla = ComentariosCols::TABLA;

        static::ejecutar(
            "UPDATE {$tabla} SET " . ComentariosCols::MODERACION_ESTADO . " = :estado WHERE " . ComentariosCols::ID . " = :id",
            ['estado' => $estado, 'id' => $id]
        );

        return static::existe([ComentariosCols::ID => $id]);
    }

    /*
     * Listar comentarios de una publicación con datos del autor.
     */
    public static function listarDePublicacion(int $pubId, int $offset, int $limit = 20): array
    {
        $tc = ComentariosCols::TABLA;
        $tu = UsuariosExtCols::TABLA;

        return static::consultar(
            "SELECT c." . ComentariosCols::ID
            . ", c." . ComentariosCols::CONTENIDO
            . ", c." . ComentariosCols::CREATED_AT
            . ", c." . ComentariosCols::TOTAL_LIKES
            . ", u." . UsuariosExtCols::ID . " as autor_id"
            . ", u." . UsuariosExtCols::USERNAME
            . ", u." . UsuariosExtCols::NOMBRE_VISIBLE
            . ", u." . UsuariosExtCols::AVATAR_URL
            . ", u." . UsuariosExtCols::WP_USER_ID
            . " FROM {$tc} c JOIN {$tu} u ON c." . ComentariosCols::AUTOR_ID
            . " = u." . UsuariosExtCols::ID
            . " WHERE c." . ComentariosCols::TIPO . " = '" . ComentariosEnums::TIPO_PUBLICACION . "'"
            . " AND c." . ComentariosCols::TARGET_ID . " = :pubId"
            . " ORDER BY c." . ComentariosCols::CREATED_AT . " ASC LIMIT :limit OFFSET :offset",
            ['pubId' => $pubId, 'limit' => $limit, 'offset' => $offset]
        );
    }

    /*
     * Listar comentarios raíz con datos del autor (JOIN usuarios_ext).
     * Excluye rechazados y comentarios hijo (parent_id NULL).
     */
    public static function listarRaizConAutor(string $tipo, int $targetId, int $offset, int $limit = 20): array
    {
        $tc = ComentariosCols::TABLA;
        $tu = UsuariosExtCols::TABLA;

        return static::consultar(
            "SELECT c." . ComentariosCols::ID . ", c." . ComentariosCols::CONTENIDO
            . ", c." . ComentariosCols::CREATED_AT . ", c." . ComentariosCols::UPDATED_AT
            . ", c." . ComentariosCols::TIPO_CONTENIDO . ", c." . ComentariosCols::MEDIA_URL
            . ", c." . ComentariosCols::MEDIA_METADATA . ", c." . ComentariosCols::MODERACION_ESTADO
            . ", c." . ComentariosCols::PARENT_ID . ", c." . ComentariosCols::TOTAL_LIKES
            . ", c." . ComentariosCols::TOTAL_RESPUESTAS
            . ", u." . UsuariosExtCols::ID . " as " . ComentariosCols::AUTOR_ID
            . ", u." . UsuariosExtCols::USERNAME . ", u." . UsuariosExtCols::NOMBRE_VISIBLE
            . ", u." . UsuariosExtCols::AVATAR_URL . ", u." . UsuariosExtCols::WP_USER_ID
            . " FROM {$tc} c JOIN {$tu} u ON c." . ComentariosCols::AUTOR_ID . " = u." . UsuariosExtCols::ID
            . " WHERE c." . ComentariosCols::TIPO . " = :tipo AND c." . ComentariosCols::TARGET_ID . " = :targetId"
            . " AND c." . ComentariosCols::PARENT_ID . " IS NULL"
            . " AND (c." . ComentariosCols::MODERACION_ESTADO . " IS NULL OR c." . ComentariosCols::MODERACION_ESTADO . " != '" . ComentariosEnums::MODERACION_ESTADO_RECHAZADO . "')"
            . " ORDER BY c." . ComentariosCols::CREATED_AT . " ASC LIMIT :limit OFFSET :offset",
            ['tipo' => $tipo, 'targetId' => $targetId, 'limit' => $limit, 'offset' => $offset]
        );
    }

    /*
     * Listar respuestas de un comentario padre con datos del autor.
     */
    public static function listarRespuestasConAutor(int $parentId, int $limit = 50): array
    {
        $tc = ComentariosCols::TABLA;
        $tu = UsuariosExtCols::TABLA;

        return static::consultar(
            "SELECT c." . ComentariosCols::ID . ", c." . ComentariosCols::CONTENIDO
            . ", c." . ComentariosCols::CREATED_AT . ", c." . ComentariosCols::UPDATED_AT
            . ", c." . ComentariosCols::TIPO_CONTENIDO . ", c." . ComentariosCols::MEDIA_URL
            . ", c." . ComentariosCols::MEDIA_METADATA . ", c." . ComentariosCols::MODERACION_ESTADO
            . ", c." . ComentariosCols::PARENT_ID . ", c." . ComentariosCols::TOTAL_LIKES
            . ", c." . ComentariosCols::TOTAL_RESPUESTAS
            . ", u." . UsuariosExtCols::ID . " as " . ComentariosCols::AUTOR_ID
            . ", u." . UsuariosExtCols::USERNAME . ", u." . UsuariosExtCols::NOMBRE_VISIBLE
            . ", u." . UsuariosExtCols::AVATAR_URL . ", u." . UsuariosExtCols::WP_USER_ID
            . " FROM {$tc} c JOIN {$tu} u ON c." . ComentariosCols::AUTOR_ID . " = u." . UsuariosExtCols::ID
            . " WHERE c." . ComentariosCols::PARENT_ID . " = :parentId"
            . " AND (c." . ComentariosCols::MODERACION_ESTADO . " IS NULL OR c." . ComentariosCols::MODERACION_ESTADO . " != '" . ComentariosEnums::MODERACION_ESTADO_RECHAZADO . "')"
            . " ORDER BY c." . ComentariosCols::CREATED_AT . " ASC LIMIT :limit",
            ['parentId' => $parentId, 'limit' => $limit]
        );
    }

    /*
     * Buscar un comentario para edición (solo id y autor_id).
     */
    public static function buscarParaEdicion(int $id): ?array
    {
        $tabla = ComentariosCols::TABLA;

        return static::consultarUno(
            "SELECT " . ComentariosCols::ID . ", " . ComentariosCols::AUTOR_ID
            . " FROM {$tabla} WHERE " . ComentariosCols::ID . " = :id",
            ['id' => $id]
        );
    }

    /*
     * Actualizar contenido de un comentario.
     */
    public static function actualizarContenido(int $id, string $contenido): void
    {
        $tabla = ComentariosCols::TABLA;

        static::ejecutar(
            "UPDATE {$tabla} SET " . ComentariosCols::CONTENIDO . " = :" . ComentariosCols::CONTENIDO . ", "
            . ComentariosCols::UPDATED_AT . " = NOW() WHERE " . ComentariosCols::ID . " = :id",
            [ComentariosCols::CONTENIDO => $contenido, 'id' => $id]
        );
    }

    /*
     * Buscar un comentario para eliminación (campos necesarios para cascade).
     */
    public static function buscarParaEliminar(int $id): ?array
    {
        $tabla = ComentariosCols::TABLA;

        return static::consultarUno(
            "SELECT " . ComentariosCols::ID . ", " . ComentariosCols::AUTOR_ID
            . ", " . ComentariosCols::PARENT_ID . ", " . ComentariosCols::TIPO
            . ", " . ComentariosCols::TARGET_ID
            . " FROM {$tabla} WHERE " . ComentariosCols::ID . " = :id",
            ['id' => $id]
        );
    }

    /*
     * Validar que un comentario padre pertenece al mismo contexto (tipo + target).
     */
    public static function validarPadre(int $parentId, string $tipo, int $targetId): bool
    {
        $tabla = ComentariosCols::TABLA;

        $row = static::consultarUno(
            "SELECT " . ComentariosCols::ID . " FROM {$tabla} WHERE " . ComentariosCols::ID . " = :id"
            . " AND " . ComentariosCols::TIPO . " = :tipo AND " . ComentariosCols::TARGET_ID . " = :targetId",
            ['id' => $parentId, 'tipo' => $tipo, 'targetId' => $targetId]
        );

        return $row !== null;
    }

    /*
     * Insertar un comentario nuevo. Retorna el ID generado.
     */
    public static function insertarComentario(array $datos): int
    {
        $tabla = ComentariosCols::TABLA;

        return static::insertar(
            "INSERT INTO {$tabla} (" . ComentariosCols::AUTOR_ID . ", " . ComentariosCols::TIPO
            . ", " . ComentariosCols::TARGET_ID . ", " . ComentariosCols::CONTENIDO
            . ", " . ComentariosCols::TIPO_CONTENIDO . ", " . ComentariosCols::MEDIA_URL
            . ", " . ComentariosCols::MEDIA_METADATA . ", " . ComentariosCols::PARENT_ID . ")"
            . " VALUES (:autor, :tipo, :target, :contenido, :tipoContenido, :mediaUrl, :mediaMetadata::jsonb, :parentId)"
            . " RETURNING " . ComentariosCols::ID,
            $datos
        );
    }

    /*
     * Incrementar total_respuestas del padre.
     */
    public static function incrementarRespuestas(int $parentId): void
    {
        $tabla = ComentariosCols::TABLA;

        static::ejecutar(
            "UPDATE {$tabla} SET " . ComentariosCols::TOTAL_RESPUESTAS
            . " = COALESCE(" . ComentariosCols::TOTAL_RESPUESTAS . ", 0) + 1 WHERE " . ComentariosCols::ID . " = :parentId",
            ['parentId' => $parentId]
        );
    }

    /*
     * Decrementar total_respuestas del padre.
     */
    public static function decrementarRespuestas(int $parentId): void
    {
        $tabla = ComentariosCols::TABLA;

        static::ejecutar(
            "UPDATE {$tabla} SET " . ComentariosCols::TOTAL_RESPUESTAS
            . " = GREATEST(0, COALESCE(" . ComentariosCols::TOTAL_RESPUESTAS . ", 0) - 1) WHERE " . ComentariosCols::ID . " = :parentId",
            ['parentId' => $parentId]
        );
    }

    /*
     * Recalcular total_comentarios en la tabla destino (samples, publicaciones, canciones o relaciones).
     */
    public static function recalcularTotalEnTarget(string $tipo, int $targetId): void
    {
        $tc = ComentariosCols::TABLA;

        $mapaTablas = [
            ComentariosEnums::TIPO_PUBLICACION => [PublicacionesCols::TABLA, PublicacionesCols::ID, PublicacionesCols::TOTAL_COMENTARIOS],
            ComentariosEnums::TIPO_SAMPLE      => [SamplesCols::TABLA, SamplesCols::ID, SamplesCols::TOTAL_COMENTARIOS],
            ComentariosEnums::TIPO_CANCION     => [CancionesCols::TABLA, CancionesCols::ID, CancionesCols::TOTAL_COMENTARIOS],
            ComentariosEnums::TIPO_RELACION    => [RelacionesSampleCols::TABLA, RelacionesSampleCols::ID, RelacionesSampleCols::TOTAL_COMENTARIOS],
        ];

        if (!isset($mapaTablas[$tipo])) return;

        [$tablaDestino, $colId, $colTotal] = $mapaTablas[$tipo];

        static::ejecutar(
            "UPDATE {$tablaDestino} SET {$colTotal} = ("
            . "SELECT COUNT(*) FROM {$tc} WHERE " . ComentariosCols::TIPO . " = :tipo AND " . ComentariosCols::TARGET_ID . " = :targetId"
            . ") WHERE {$colId} = :targetId2",
            ['tipo' => $tipo, 'targetId' => $targetId, 'targetId2' => $targetId]
        );
    }

    /*
     * Eliminar un comentario por ID.
     */
    public static function eliminarComentario(int $id): void
    {
        $tabla = ComentariosCols::TABLA;

        static::ejecutar(
            "DELETE FROM {$tabla} WHERE " . ComentariosCols::ID . " = :id",
            ['id' => $id]
        );
    }

    /*
     * Buscar solo el autor_id de un comentario.
     */
    public static function buscarAutorId(int $id): ?int
    {
        $tabla = ComentariosCols::TABLA;

        $row = static::consultarUno(
            "SELECT " . ComentariosCols::AUTOR_ID . " FROM {$tabla} WHERE " . ComentariosCols::ID . " = :id",
            ['id' => $id]
        );

        return $row ? (int) $row[ComentariosCols::AUTOR_ID] : null;
    }

    /*
     * Buscar si el mismo autor ya publicó el mismo contenido en la ventana de tiempo indicada.
     * Usado por ServicioAntiSpam para deteccion de comentarios duplicados.
     * Retorna el registro duplicado o null si no hay.
     * ventanaSeg se interpola como entero validado — no puede inyectar SQL.
     */
    public static function buscarDuplicadoReciente(int $autorId, string $contenido, int $ventanaSeg): ?array
    {
        $tabla = ComentariosCols::TABLA;
        /* Defense-in-depth: int cast + parametrización. INTERVAL '1 second' * :seg evita interpolación. */
        $segValidado = max(1, (int) $ventanaSeg);
        return static::consultarUno(
            "SELECT " . ComentariosCols::ID . " FROM {$tabla}
             WHERE " . ComentariosCols::AUTOR_ID . " = :autor
             AND " . ComentariosCols::CONTENIDO . " = :contenido
             AND " . ComentariosCols::CREATED_AT . " > NOW() - INTERVAL '1 second' * :seg
             LIMIT 1",
            [
                'autor'     => $autorId,
                'contenido' => $contenido,
                'seg'       => $segValidado,
            ]
        );
    }

    /*
     * Actualizar estado y detalle JSON del veredicto de moderación IA.
     * Usado por ServicioModeracionIA tras analizar comentario.
     * El campo moderacion_detalle requiere cast ::jsonb en PostgreSQL.
     */
    public static function actualizarVeredictoModeracion(int $id, string $estado, string $detalle): void
    {
        $tabla = ComentariosCols::TABLA;
        static::ejecutar(
            "UPDATE {$tabla} SET "
                . ComentariosCols::MODERACION_ESTADO . " = :estado, "
                . ComentariosCols::MODERACION_DETALLE . " = :detalle::jsonb"
                . " WHERE " . ComentariosCols::ID . " = :id",
            ['estado' => $estado, 'detalle' => $detalle, 'id' => $id]
        );
    }
}
