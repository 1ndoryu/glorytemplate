<?php

/**
 * NotificacionesRepository — Acceso a datos para tabla 'notificaciones'.
 *
 * SECCION AUTO-GENERADA: Los metodos base se regeneran con schema:generate.
 * SECCION CUSTOM: Todo debajo de la marca CUSTOM se preserva al regenerar.
 *
 * @package Kamples
 */

namespace App\Kamples\Database\Repositories;

use App\Config\Schema\_generated\NotificacionesCols;
use App\Config\Schema\_generated\NotificacionesDTO;
use App\Config\Schema\_generated\UsuariosExtCols;

class NotificacionesRepository extends BaseRepository
{
    protected static function tabla(): string
    {
        return NotificacionesCols::TABLA;
    }

    protected static function colId(): string
    {
        return NotificacionesCols::ID;
    }

    /*
     * Buscar registros del usuario dado.
     */
    public static function buscarPorUsuario(int $usuarioId, int $limit = 20, int $offset = 0): array
    {
        $tabla = NotificacionesCols::TABLA;
        $col = NotificacionesCols::USUARIO_ID;

        return static::consultar(
            "SELECT * FROM {$tabla} WHERE {$col} = :usuarioId ORDER BY " . NotificacionesCols::ID . " DESC LIMIT :limit OFFSET :offset",
            ['usuarioId' => $usuarioId, 'limit' => $limit, 'offset' => $offset]
        );
    }

    /*
     * Buscar registros mas recientes.
     */
    public static function buscarRecientes(int $limit = 20): array
    {
        $tabla = NotificacionesCols::TABLA;

        return static::consultar(
            "SELECT * FROM {$tabla} ORDER BY " . NotificacionesCols::CREATED_AT . " DESC LIMIT :limit",
            ['limit' => $limit]
        );
    }

    /* === METODOS CUSTOM (seguro para editar debajo de esta linea) === */

    /*
     * Listar notificaciones del usuario con datos del actor (JOIN usuarios_ext).
     */
    public static function listarConActor(int $userId, int $offset, int $limit = 30): array
    {
        $tabla = NotificacionesCols::TABLA;

        return static::consultar(
            "SELECT n." . NotificacionesCols::ID . ", n." . NotificacionesCols::TIPO
            . ", n." . NotificacionesCols::TITULO . ", n." . NotificacionesCols::MENSAJE . ", n." . NotificacionesCols::DATOS . ", n." . NotificacionesCols::LEIDA
            . ", n." . NotificacionesCols::ENLACE . ", n." . NotificacionesCols::CREATED_AT . " as \"creadaAt\","
            . " u." . UsuariosExtCols::USERNAME . " as \"actorUsername\", u." . UsuariosExtCols::NOMBRE_VISIBLE . " as \"actorNombre\","
            . " u." . UsuariosExtCols::AVATAR_URL . " as \"actorAvatar\", u." . UsuariosExtCols::WP_USER_ID . " as \"actorWpUserId\""
            . " FROM {$tabla} n LEFT JOIN " . UsuariosExtCols::TABLA . " u ON u." . UsuariosExtCols::ID . " = n." . NotificacionesCols::ACTOR_ID
            . " WHERE n." . NotificacionesCols::USUARIO_ID . " = :userId"
            . " ORDER BY n." . NotificacionesCols::CREATED_AT . " DESC LIMIT :limit OFFSET :offset",
            ['userId' => $userId, 'limit' => $limit, 'offset' => $offset]
        );
    }

    /*
     * Marcar una notificación como leída (solo si pertenece al usuario).
     */
    public static function marcarLeida(int $id, int $userId): void
    {
        $tabla = NotificacionesCols::TABLA;

        static::ejecutar(
            "UPDATE {$tabla} SET " . NotificacionesCols::LEIDA . " = true"
            . " WHERE " . NotificacionesCols::ID . " = :id AND " . NotificacionesCols::USUARIO_ID . " = :userId",
            ['id' => $id, 'userId' => $userId]
        );
    }

    /*
     * Marcar todas las notificaciones no leídas del usuario como leídas.
     */
    public static function marcarTodasLeidas(int $userId): void
    {
        $tabla = NotificacionesCols::TABLA;

        static::ejecutar(
            "UPDATE {$tabla} SET " . NotificacionesCols::LEIDA . " = true"
            . " WHERE " . NotificacionesCols::USUARIO_ID . " = :userId AND " . NotificacionesCols::LEIDA . " = false",
            ['userId' => $userId]
        );
    }

    /*
     * Contar notificaciones no leídas del usuario.
     */
    public static function contarNoLeidas(int $userId): int
    {
        $tabla = NotificacionesCols::TABLA;

        $row = static::consultarUno(
            "SELECT COUNT(*) as total FROM {$tabla}"
            . " WHERE " . NotificacionesCols::USUARIO_ID . " = :userId AND " . NotificacionesCols::LEIDA . " = false",
            ['userId' => $userId]
        );

        return (int) ($row['total'] ?? 0);
    }

    /*
     * Crear notificación (para experimentos/tests).
     */
    public static function crear(int $userId, string $tipo, string $datosJson): void
    {
        $tabla = NotificacionesCols::TABLA;

        static::ejecutar(
            "INSERT INTO {$tabla} (" . NotificacionesCols::USUARIO_ID . ", " . NotificacionesCols::TIPO . ", datos)"
            . " VALUES (:userId, :tipo, :datos::jsonb)",
            ['userId' => $userId, 'tipo' => $tipo, 'datos' => $datosJson]
        );
    }

    /*
     * Crear notificacion completa con todos los campos.
     * Usado por ServicioNotificaciones como punto unico de insercion.
     * Excluir auto-notificaciones debe hacerse ANTES de llamar este metodo.
     */
    public static function crearCompleta(
        int    $destinatarioId,
        string $tipo,
        string $titulo,
        string $mensaje,
        string $datosJson,
        ?int   $actorId,
        ?string $enlace
    ): void {
        $tabla = NotificacionesCols::TABLA;

        static::ejecutar(
            "INSERT INTO {$tabla} (" . NotificacionesCols::USUARIO_ID . ", " . NotificacionesCols::TIPO
            . ", titulo, mensaje, datos, actor_id, enlace)"
            . " VALUES (:userId, :tipo, :titulo, :mensaje, :datos::jsonb, :actorId, :enlace)",
            [
                'userId'  => $destinatarioId,
                'tipo'    => $tipo,
                'titulo'  => $titulo,
                'mensaje' => $mensaje,
                'datos'   => $datosJson,
                'actorId' => $actorId,
                'enlace'  => $enlace,
            ]
        );
    }
}
