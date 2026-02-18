<?php

/**
 * ConversacionesRepository — Acceso a datos para tabla 'conversaciones'.
 *
 * SECCION AUTO-GENERADA: Los metodos base se regeneran con schema:generate.
 * SECCION CUSTOM: Todo debajo de la marca CUSTOM se preserva al regenerar.
 *
 * @package Kamples
 */

namespace App\Kamples\Database\Repositories;

use App\Config\Schema\_generated\ConversacionesCols;
use App\Config\Schema\_generated\ConversacionesDTO;
use App\Config\Schema\_generated\UsuariosExtCols;

class ConversacionesRepository extends BaseRepository
{
    protected static function tabla(): string
    {
        return ConversacionesCols::TABLA;
    }

    protected static function colId(): string
    {
        return ConversacionesCols::ID;
    }

    /*
     * Buscar registros mas recientes.
     */
    public static function buscarRecientes(int $limit = 20): array
    {
        $tabla = ConversacionesCols::TABLA;

        return static::consultar(
            "SELECT * FROM {$tabla} ORDER BY created_at DESC LIMIT :limit",
            ['limit' => $limit]
        );
    }

    /* === METODOS CUSTOM (seguro para editar debajo de esta linea) === */

    /*
     * Listar conversaciones de un usuario con ID del otro participante.
     * TO-DO: regenerar ConversacionesCols para incluir participante_1/participante_2.
     */
    public static function listarDeUsuario(int $userId): array
    {
        $tabla = ConversacionesCols::TABLA;

        return static::consultar(
            "SELECT c." . ConversacionesCols::ID . ",
                    CASE WHEN c.participante_1 = :userId THEN c.participante_2 ELSE c.participante_1 END as otro_id,
                    c." . ConversacionesCols::ULTIMO_MENSAJE_AT . ", c." . ConversacionesCols::CREATED_AT . "
             FROM {$tabla} c
             WHERE c.participante_1 = :userId OR c.participante_2 = :userId
             ORDER BY c." . ConversacionesCols::ULTIMO_MENSAJE_AT . " DESC NULLS LAST",
            ['userId' => $userId]
        );
    }

    /*
     * Verificar que un usuario participa en una conversación.
     */
    public static function verificarParticipacion(int $convId, int $userId): ?array
    {
        $tabla = ConversacionesCols::TABLA;

        return static::consultarUno(
            "SELECT " . ConversacionesCols::ID . " FROM {$tabla} WHERE " . ConversacionesCols::ID . " = :convId AND (participante_1 = :userId OR participante_2 = :userId)",
            ['convId' => $convId, 'userId' => $userId]
        );
    }

    /*
     * Actualizar timestamp del último mensaje.
     */
    public static function actualizarUltimoMensaje(int $convId): void
    {
        $tabla = ConversacionesCols::TABLA;

        static::ejecutar(
            "UPDATE {$tabla} SET " . ConversacionesCols::ULTIMO_MENSAJE_AT . " = NOW() WHERE " . ConversacionesCols::ID . " = :convId",
            ['convId' => $convId]
        );
    }

    /*
     * Buscar conversación existente entre dos usuarios.
     */
    public static function buscarEntreUsuarios(int $p1, int $p2): ?array
    {
        $tabla = ConversacionesCols::TABLA;

        return static::consultarUno(
            "SELECT " . ConversacionesCols::ID . " FROM {$tabla} WHERE participante_1 = :p1 AND participante_2 = :p2",
            ['p1' => $p1, 'p2' => $p2]
        );
    }

    /*
     * Crear conversación entre dos usuarios.
     */
    public static function crear(int $p1, int $p2): ?int
    {
        $tabla = ConversacionesCols::TABLA;

        return static::insertar(
            "INSERT INTO {$tabla} (participante_1, participante_2) VALUES (:p1, :p2) RETURNING " . ConversacionesCols::ID,
            ['p1' => $p1, 'p2' => $p2]
        );
    }
}
