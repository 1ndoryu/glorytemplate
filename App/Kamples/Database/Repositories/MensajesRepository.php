<?php

/**
 * MensajesRepository — Acceso a datos para tabla 'mensajes'.
 *
 * SECCION AUTO-GENERADA: Los metodos base se regeneran con schema:generate.
 * SECCION CUSTOM: Todo debajo de la marca CUSTOM se preserva al regenerar.
 *
 * @package Kamples
 */

namespace App\Kamples\Database\Repositories;

use App\Config\Schema\_generated\MensajesCols;
use App\Config\Schema\_generated\MensajesDTO;

class MensajesRepository extends BaseRepository
{
    protected static function tabla(): string
    {
        return MensajesCols::TABLA;
    }

            protected static function colId(): string
    {
        return MensajesCols::ID;
    }

    /*
     * Buscar registros del usuario dado.
     */
    public static function buscarPorUsuario(int $usuarioId, int $limit = 20, int $offset = 0): array
    {
        $tabla = MensajesCols::TABLA;
        $col = MensajesCols::AUTOR_ID;

        return static::consultar(
            "SELECT * FROM {$tabla} WHERE {$col} = :usuarioId ORDER BY " . MensajesCols::ID . " DESC LIMIT :limit OFFSET :offset",
            ['usuarioId' => $usuarioId, 'limit' => $limit, 'offset' => $offset]
        );
    }

    /*
     * Buscar registros mas recientes.
     */
    public static function buscarRecientes(int $limit = 20): array
    {
        $tabla = MensajesCols::TABLA;

        return static::consultar(
            "SELECT * FROM {$tabla} ORDER BY " . MensajesCols::CREATED_AT . " DESC LIMIT :limit",
            ['limit' => $limit]
        );
    }

    /* === METODOS CUSTOM (seguro para editar debajo de esta linea) === */

    /*
     * Obtener último mensaje de una conversación (para preview).
     */
    public static function ultimoDeConversacion(int $convId): ?array
    {
        $tabla = MensajesCols::TABLA;

        return static::consultarUno(
            "SELECT " . MensajesCols::CONTENIDO . ", " . MensajesCols::TIPO . ", " . MensajesCols::CREATED_AT
            . " FROM {$tabla} WHERE " . MensajesCols::CONVERSACION_ID . " = :convId ORDER BY " . MensajesCols::CREATED_AT . " DESC LIMIT 1",
            ['convId' => $convId]
        );
    }

    /*
     * Contar mensajes no leídos en una conversación (del otro usuario).
     */
    public static function contarNoLeidos(int $convId, int $userId): int
    {
        $tabla = MensajesCols::TABLA;

        $row = static::consultarUno(
            "SELECT COUNT(*) as total FROM {$tabla} WHERE " . MensajesCols::CONVERSACION_ID . " = :convId AND " . MensajesCols::AUTOR_ID . " != :userId AND " . MensajesCols::LEIDO . " = false",
            ['convId' => $convId, 'userId' => $userId]
        );

        return (int) ($row['total'] ?? 0);
    }

    /*
     * Listar mensajes paginados de una conversación (normalizados a camelCase).
     */
    public static function listarDeConversacion(int $convId, int $limit, int $offset): array
    {
        $tabla = MensajesCols::TABLA;

        return static::consultar(
            "SELECT " . MensajesCols::ID . ", " . MensajesCols::CONVERSACION_ID . " as \"conversacionId\", " . MensajesCols::AUTOR_ID . " as \"remitenteId\",
                    " . MensajesCols::CONTENIDO . ", " . MensajesCols::TIPO . ", " . MensajesCols::MEDIA_URL . " as \"mediaUrl\", " . MensajesCols::MEDIA_METADATA . " as \"mediaMetadata\",
                    " . MensajesCols::LEIDO . ", " . MensajesCols::CREATED_AT . " as \"creadoAt\"
             FROM {$tabla} WHERE " . MensajesCols::CONVERSACION_ID . " = :convId
             ORDER BY " . MensajesCols::CREATED_AT . " ASC LIMIT :limit OFFSET :offset",
            ['convId' => $convId, 'limit' => $limit, 'offset' => $offset]
        );
    }

    /*
     * Insertar mensaje con soporte multimedia.
     */
    public static function insertarMensaje(int $convId, int $autorId, string $contenido, string $tipo, ?string $mediaUrl, ?string $mediaMetadata): ?int
    {
        $tabla = MensajesCols::TABLA;

        return static::insertar(
            "INSERT INTO {$tabla} (" . MensajesCols::CONVERSACION_ID . ", " . MensajesCols::AUTOR_ID . ", " . MensajesCols::CONTENIDO . ", " . MensajesCols::TIPO . ", " . MensajesCols::MEDIA_URL . ", " . MensajesCols::MEDIA_METADATA . ")
             VALUES (:convId, :autorId, :contenido, :tipo, :mediaUrl, :mediaMetadata)
             RETURNING " . MensajesCols::ID,
            ['convId' => $convId, 'autorId' => $autorId, 'contenido' => $contenido, 'tipo' => $tipo, 'mediaUrl' => $mediaUrl, 'mediaMetadata' => $mediaMetadata]
        );
    }

    /*
     * Obtener mensaje por ID (normalizado a camelCase).
     */
    public static function obtenerNormalizado(int $id): ?array
    {
        $tabla = MensajesCols::TABLA;

        return static::consultarUno(
            "SELECT " . MensajesCols::ID . ", " . MensajesCols::CONVERSACION_ID . " as \"conversacionId\", " . MensajesCols::AUTOR_ID . " as \"remitenteId\",
                    " . MensajesCols::CONTENIDO . ", " . MensajesCols::TIPO . ", " . MensajesCols::MEDIA_URL . " as \"mediaUrl\", " . MensajesCols::MEDIA_METADATA . " as \"mediaMetadata\",
                    " . MensajesCols::LEIDO . ", " . MensajesCols::CREATED_AT . " as \"creadoAt\"
             FROM {$tabla} WHERE " . MensajesCols::ID . " = :id",
            ['id' => $id]
        );
    }

    /*
     * Marcar todos los mensajes de una conversación como leídos (excepto los del usuario actual).
     */
    public static function marcarLeidos(int $convId, int $userId): void
    {
        $tabla = MensajesCols::TABLA;

        static::ejecutar(
            "UPDATE {$tabla} SET " . MensajesCols::LEIDO . " = true WHERE " . MensajesCols::CONVERSACION_ID . " = :convId AND " . MensajesCols::AUTOR_ID . " != :userId AND " . MensajesCols::LEIDO . " = false",
            ['convId' => $convId, 'userId' => $userId]
        );
    }
}
