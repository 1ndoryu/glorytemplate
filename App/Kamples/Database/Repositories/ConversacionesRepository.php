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
use App\Config\Schema\_generated\MensajesCols;
use App\Config\Schema\_generated\UsuariosExtCols;
use App\Config\Schema\_generated\FollowsCols;
use App\Config\Schema\_generated\BloqueoCols;

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
            "SELECT * FROM {$tabla} ORDER BY " . ConversacionesCols::CREATED_AT . " DESC LIMIT :limit",
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
     * Listar conversaciones con participante, ultimo mensaje y no leidos en 1 sola query.
     * Reemplaza el patron N+1 de listarDeUsuario + 3 queries por conversacion.
     */
    public static function listarDeUsuarioEnriquecido(int $userId): array
    {
        $tConv = ConversacionesCols::TABLA;
        $tMsg = MensajesCols::TABLA;
        $tUsr = UsuariosExtCols::TABLA;
        $tFollow = FollowsCols::TABLA;
        $tBloqueo = BloqueoCols::TABLA;

        $colConvId       = ConversacionesCols::ID;
        $colUltimoMsgAt  = ConversacionesCols::ULTIMO_MENSAJE_AT;
        $colConvCreatedAt = ConversacionesCols::CREATED_AT;
        $colMsgConvId    = MensajesCols::CONVERSACION_ID;
        $colMsgAutor     = MensajesCols::AUTOR_ID;
        $colMsgContenido = MensajesCols::CONTENIDO;
        $colMsgTipo      = MensajesCols::TIPO;
        $colMsgCreatedAt = MensajesCols::CREATED_AT;
        $colMsgLeido     = MensajesCols::LEIDO;
        $colUsrId        = UsuariosExtCols::ID;
        $colUsername      = UsuariosExtCols::USERNAME;
        $colNombre       = UsuariosExtCols::NOMBRE_VISIBLE;
        $colAvatar       = UsuariosExtCols::AVATAR_URL;
        $colVerificado   = UsuariosExtCols::VERIFICADO;
        $colWpUserId     = UsuariosExtCols::WP_USER_ID;
        $colSeguidorId   = FollowsCols::SEGUIDOR_ID;
        $colSeguidoId    = FollowsCols::SEGUIDO_ID;
        $colBloqueadorId = BloqueoCols::BLOQUEADOR_ID;
        $colBloqueadoId  = BloqueoCols::BLOQUEADO_ID;

        return static::consultar(
            "SELECT c.{$colConvId},
                    c.{$colUltimoMsgAt},
                    c.{$colConvCreatedAt},
                    CASE WHEN c.participante_1 = :userId THEN c.participante_2
                         ELSE c.participante_1 END AS otro_id,
                    u.{$colUsername}      AS \"usr_username\",
                    u.{$colNombre}        AS \"usr_nombre_visible\",
                    u.{$colAvatar}        AS \"usr_avatar_url\",
                    u.{$colVerificado}    AS \"usr_verificado\",
                    u.{$colWpUserId}      AS \"usr_wp_user_id\",
                    lm.{$colMsgContenido} AS \"ultimo_contenido\",
                    lm.{$colMsgTipo}      AS \"ultimo_tipo\",
                    lm.{$colMsgCreatedAt} AS \"ultimo_msg_at\",
                    COALESCE(nl.total, 0)::int AS \"no_leidos\",
                    /* QQ52: Follow mutuo — true si ambos se siguen */
                    (EXISTS (
                        SELECT 1 FROM {$tFollow} f1
                        WHERE f1.{$colSeguidorId} = :userId
                          AND f1.{$colSeguidoId} = CASE WHEN c.participante_1 = :userId THEN c.participante_2 ELSE c.participante_1 END
                    ) AND EXISTS (
                        SELECT 1 FROM {$tFollow} f2
                        WHERE f2.{$colSeguidorId} = CASE WHEN c.participante_1 = :userId THEN c.participante_2 ELSE c.participante_1 END
                          AND f2.{$colSeguidoId} = :userId
                    ))::bool AS \"es_mutuo\"
             FROM {$tConv} c
             JOIN {$tUsr} u
               ON u.{$colUsrId} = CASE WHEN c.participante_1 = :userId THEN c.participante_2
                                       ELSE c.participante_1 END
             LEFT JOIN LATERAL (
                 SELECT m.{$colMsgContenido}, m.{$colMsgTipo}, m.{$colMsgCreatedAt}
                 FROM {$tMsg} m
                 WHERE m.{$colMsgConvId} = c.{$colConvId}
                 ORDER BY m.{$colMsgCreatedAt} DESC
                 LIMIT 1
             ) lm ON true
             LEFT JOIN LATERAL (
                 SELECT COUNT(*)::int AS total
                 FROM {$tMsg} m2
                 WHERE m2.{$colMsgConvId} = c.{$colConvId}
                   AND m2.{$colMsgAutor} != :userId
                   AND m2.{$colMsgLeido} = false
             ) nl ON true
             WHERE (c.participante_1 = :userId OR c.participante_2 = :userId)
               /* QQ52: Excluir conversaciones con usuarios bloqueados (bidireccional) */
               AND NOT EXISTS (
                   SELECT 1 FROM {$tBloqueo} b
                   WHERE (b.{$colBloqueadorId} = :userId AND b.{$colBloqueadoId} = CASE WHEN c.participante_1 = :userId THEN c.participante_2 ELSE c.participante_1 END)
                      OR (b.{$colBloqueadoId} = :userId AND b.{$colBloqueadorId} = CASE WHEN c.participante_1 = :userId THEN c.participante_2 ELSE c.participante_1 END)
               )
             ORDER BY c.{$colUltimoMsgAt} DESC NULLS LAST",
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
     * QQ52: Obtener el ID del otro participante en una conversación.
     */
    public static function obtenerOtroParticipante(int $convId, int $userId): ?int
    {
        $tabla = ConversacionesCols::TABLA;

        $row = static::consultarUno(
            "SELECT CASE WHEN participante_1 = :userId THEN participante_2 ELSE participante_1 END AS otro_id"
            . " FROM {$tabla} WHERE " . ConversacionesCols::ID . " = :convId",
            ['convId' => $convId, 'userId' => $userId]
        );

        return $row ? (int) $row['otro_id'] : null;
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
