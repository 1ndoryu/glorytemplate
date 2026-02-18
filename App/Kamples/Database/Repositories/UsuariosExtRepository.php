<?php

/**
 * UsuariosExtRepository — Acceso a datos para tabla 'usuarios_ext'.
 *
 * SECCION AUTO-GENERADA: Los metodos base se regeneran con schema:generate.
 * SECCION CUSTOM: Todo debajo de la marca CUSTOM se preserva al regenerar.
 *
 * @package Kamples
 */

namespace App\Kamples\Database\Repositories;

use App\Config\Schema\_generated\UsuariosExtCols;
use App\Config\Schema\_generated\UsuariosExtEnums;
use App\Config\Schema\_generated\UsuariosExtDTO;

class UsuariosExtRepository extends BaseRepository
{
    protected static function tabla(): string
    {
        return UsuariosExtCols::TABLA;
    }

    protected static function colId(): string
    {
        return UsuariosExtCols::ID;
    }

    /*
     * Buscar registros mas recientes.
     */
    public static function buscarRecientes(int $limit = 20): array
    {
        $tabla = UsuariosExtCols::TABLA;

        return static::consultar(
            "SELECT * FROM {$tabla} ORDER BY created_at DESC LIMIT :limit",
            ['limit' => $limit]
        );
    }

    /* === METODOS CUSTOM (seguro para editar debajo de esta linea) === */

    /*
     * Actualizar campos arbitrarios de un usuario (admin).
     * Recibe array de cláusulas SET ya armadas y parámetros.
     */
    public static function actualizarCamposAdmin(int $id, array $clausulasSet, array $params): void
    {
        $tabla = UsuariosExtCols::TABLA;
        $set = implode(', ', $clausulasSet);
        $params['id'] = $id;

        static::ejecutar(
            "UPDATE {$tabla} SET {$set} WHERE " . UsuariosExtCols::ID . " = :id",
            $params
        );
    }

    /*
     * Incrementar contador de descargas del creador.
     */
    public static function incrementarDescargas(int $id): void
    {
        $tabla = UsuariosExtCols::TABLA;

        static::ejecutar(
            "UPDATE {$tabla} SET " . UsuariosExtCols::TOTAL_DESCARGAS . " = " . UsuariosExtCols::TOTAL_DESCARGAS
            . " + 1 WHERE " . UsuariosExtCols::ID . " = :id",
            ['id' => $id]
        );
    }

    /*
     * Obtener créditos bonus de un usuario.
     */
    public static function obtenerCreditosBonus(int $userId): int
    {
        $tabla = UsuariosExtCols::TABLA;

        $row = static::consultarUno(
            "SELECT " . UsuariosExtCols::CREDITOS_BONUS . " FROM {$tabla} WHERE " . UsuariosExtCols::ID . " = :userId",
            ['userId' => $userId]
        );

        return (int) ($row[UsuariosExtCols::CREDITOS_BONUS] ?? 0);
    }

    /*
     * Adquirir advisory lock para operaciones TOCTOU.
     */
    public static function advisoryLock(int $userId): void
    {
        static::ejecutar("SELECT pg_advisory_xact_lock(:lockId)", ['lockId' => $userId]);
    }

    /*
     * Obtener datos básicos de un usuario para chat (id, username, nombre, avatar, verificado, wp_user_id).
     */
    public static function buscarParticipante(int $id): ?array
    {
        $tabla = UsuariosExtCols::TABLA;

        return static::consultarUno(
            "SELECT " . UsuariosExtCols::ID . ", " . UsuariosExtCols::USERNAME . ", " . UsuariosExtCols::NOMBRE_VISIBLE
            . ", " . UsuariosExtCols::AVATAR_URL . ", " . UsuariosExtCols::VERIFICADO . ", " . UsuariosExtCols::WP_USER_ID
            . " FROM {$tabla} WHERE " . UsuariosExtCols::ID . " = :id",
            ['id' => $id]
        );
    }

    /*
     * Buscar perfil público por username.
     */
    public static function buscarPerfilPublico(string $username): ?array
    {
        $tabla = UsuariosExtCols::TABLA;

        return static::consultarUno(
            "SELECT " . UsuariosExtCols::ID . ", " . UsuariosExtCols::WP_USER_ID . ", "
            . UsuariosExtCols::USERNAME . ", " . UsuariosExtCols::NOMBRE_VISIBLE . ", "
            . UsuariosExtCols::BIO . ", " . UsuariosExtCols::AVATAR_URL . ", "
            . UsuariosExtCols::PORTADA_URL . ", " . UsuariosExtCols::PLAN . ", "
            . UsuariosExtCols::VERIFICADO . ", " . UsuariosExtCols::TOTAL_SEGUIDORES . ", "
            . UsuariosExtCols::TOTAL_SEGUIDOS . ", " . UsuariosExtCols::TOTAL_SAMPLES . ", "
            . UsuariosExtCols::TOTAL_DESCARGAS . ", " . UsuariosExtCols::CREATED_AT
            . " FROM {$tabla} WHERE " . UsuariosExtCols::USERNAME . " = :username",
            ['username' => $username]
        );
    }

    /*
     * Buscar usuario completo por wp_user_id.
     */
    public static function buscarPorWpId(int $wpId): ?array
    {
        $tabla = UsuariosExtCols::TABLA;

        return static::consultarUno(
            "SELECT * FROM {$tabla} WHERE " . UsuariosExtCols::WP_USER_ID . " = :wpId",
            ['wpId' => $wpId]
        );
    }

    /*
     * Obtener solo el ID de usuario por wp_user_id.
     */
    public static function obtenerIdPorWpId(int $wpId): ?int
    {
        $tabla = UsuariosExtCols::TABLA;

        $row = static::consultarUno(
            "SELECT " . UsuariosExtCols::ID . " FROM {$tabla} WHERE " . UsuariosExtCols::WP_USER_ID . " = :wpId",
            ['wpId' => $wpId]
        );

        return $row ? (int) $row[UsuariosExtCols::ID] : null;
    }

    /*
     * Actualizar avatar_url de un usuario.
     */
    public static function actualizarAvatar(int $wpUserId, string $avatarUrl): void
    {
        $tabla = UsuariosExtCols::TABLA;

        static::ejecutar(
            "UPDATE {$tabla} SET " . UsuariosExtCols::AVATAR_URL . " = :avatar, "
            . UsuariosExtCols::UPDATED_AT . " = NOW() WHERE " . UsuariosExtCols::WP_USER_ID . " = :wpId",
            ['avatar' => $avatarUrl, 'wpId' => $wpUserId]
        );
    }

    /*
     * Crear registro de usuario desde datos de WordPress.
     * Retorna el ID generado.
     */
    public static function crearDesdeWP(array $wpUser): int
    {
        $tabla = UsuariosExtCols::TABLA;

        return static::insertar(
            "INSERT INTO {$tabla} (" . UsuariosExtCols::WP_USER_ID . ", " . UsuariosExtCols::USERNAME . ", "
            . UsuariosExtCols::NOMBRE_VISIBLE . ", " . UsuariosExtCols::EMAIL . ", " . UsuariosExtCols::AVATAR_URL . ")
             VALUES (:wpId, :username, :nombre, :email, :avatar)
             RETURNING " . UsuariosExtCols::ID,
            [
                'wpId'     => $wpUser['wp_user_id'],
                'username' => $wpUser['username'],
                'nombre'   => $wpUser['display_name'],
                'email'    => $wpUser['email'],
                'avatar'   => $wpUser['avatar_url'],
            ]
        );
    }

    /*
     * Actualizar perfil con campos dinámicos.
     * Recibe array de cláusulas SET y parámetros (incluye wpId).
     */
    public static function actualizarPerfil(array $clausulasSet, array $params): void
    {
        $tabla = UsuariosExtCols::TABLA;
        $set = implode(', ', $clausulasSet);

        static::ejecutar(
            "UPDATE {$tabla} SET {$set}, " . UsuariosExtCols::UPDATED_AT . " = NOW() WHERE " . UsuariosExtCols::WP_USER_ID . " = :wpId",
            $params
        );
    }

    /*
     * Buscar usuario por stripe_customer_id (webhooks de pago).
     */
    public static function buscarPorStripeCustomerId(string $customerId): ?array
    {
        $tabla = UsuariosExtCols::TABLA;

        return static::consultarUno(
            "SELECT " . UsuariosExtCols::ID . ", " . UsuariosExtCols::PLAN
            . " FROM {$tabla} WHERE " . UsuariosExtCols::STRIPE_CUSTOMER_ID . " = :cid",
            ['cid' => $customerId]
        );
    }

    /*
     * Buscar usuario por stripe_connect_id (webhooks Connect).
     */
    public static function buscarPorStripeConnectId(string $connectId): ?array
    {
        $tabla = UsuariosExtCols::TABLA;

        return static::consultarUno(
            "SELECT " . UsuariosExtCols::ID
            . " FROM {$tabla} WHERE " . UsuariosExtCols::STRIPE_CONNECT_ID . " = :cid",
            ['cid' => $connectId]
        );
    }

    /*
     * Actualizar plan y opcionalmente subscription_id.
     */
    public static function actualizarPlanYSuscripcion(int $id, string $plan, ?string $subscriptionId = null): int
    {
        $tabla = UsuariosExtCols::TABLA;

        if ($subscriptionId !== null) {
            return static::ejecutar(
                "UPDATE {$tabla} SET " . UsuariosExtCols::PLAN . " = :plan, "
                . UsuariosExtCols::STRIPE_SUBSCRIPTION_ID . " = :subId WHERE " . UsuariosExtCols::ID . " = :id",
                ['plan' => $plan, 'subId' => $subscriptionId, 'id' => $id]
            );
        }

        return static::ejecutar(
            "UPDATE {$tabla} SET " . UsuariosExtCols::PLAN . " = :plan WHERE " . UsuariosExtCols::ID . " = :id",
            ['plan' => $plan, 'id' => $id]
        );
    }

    /*
     * Cancelar suscripción: plan='free', stripe_subscription_id=NULL.
     */
    public static function cancelarSuscripcion(int $id): int
    {
        $tabla = UsuariosExtCols::TABLA;

        return static::ejecutar(
            "UPDATE {$tabla} SET " . UsuariosExtCols::PLAN . " = 'free', "
            . UsuariosExtCols::STRIPE_SUBSCRIPTION_ID . " = NULL WHERE " . UsuariosExtCols::ID . " = :id",
            ['id' => $id]
        );
    }

    /*
     * Cambiar rol del usuario (ej: 'usuario' → 'creador').
     */
    public static function cambiarRol(int $id, string $rol): void
    {
        $tabla = UsuariosExtCols::TABLA;

        static::ejecutar(
            "UPDATE {$tabla} SET " . UsuariosExtCols::ROL . " = :rol WHERE " . UsuariosExtCols::ID . " = :id",
            ['rol' => $rol, 'id' => $id]
        );
    }

    /*
     * Incrementar créditos bonus (+1) al publicar sample.
     */
    public static function incrementarCreditosBonus(int $userId): void
    {
        $tabla = UsuariosExtCols::TABLA;

        static::ejecutar(
            "UPDATE {$tabla} SET " . UsuariosExtCols::CREDITOS_BONUS . " = "
            . UsuariosExtCols::CREDITOS_BONUS . " + 1 WHERE " . UsuariosExtCols::ID . " = :userId",
            ['userId' => $userId]
        );
    }

    /*
     * Buscar usuario por username exacto.
     */
    public static function buscarPorUsername(string $username): ?array
    {
        $tabla = UsuariosExtCols::TABLA;

        return static::consultarUno(
            "SELECT " . UsuariosExtCols::ID . " FROM {$tabla} WHERE " . UsuariosExtCols::USERNAME . " = :username",
            ['username' => $username]
        );
    }

    /*
     * Crear usuario con ON CONFLICT (upsert para experimentos/tests).
     */
    public static function crearConConflict(array $datos): ?int
    {
        $tabla = UsuariosExtCols::TABLA;

        $row = static::consultarUno(
            "INSERT INTO {$tabla} (" . UsuariosExtCols::WP_USER_ID . ", " . UsuariosExtCols::USERNAME
            . ", " . UsuariosExtCols::EMAIL . ", " . UsuariosExtCols::NOMBRE_VISIBLE
            . ", " . UsuariosExtCols::BIO . ", " . UsuariosExtCols::AVATAR_URL
            . ", " . UsuariosExtCols::PLAN . ", " . UsuariosExtCols::ROL . ")"
            . " VALUES (:wpId, :username, :email, :nombre, :bio, :avatar, 'free', 'usuario')"
            . " ON CONFLICT (" . UsuariosExtCols::WP_USER_ID . ") DO UPDATE SET "
            . UsuariosExtCols::USERNAME . " = EXCLUDED." . UsuariosExtCols::USERNAME
            . " RETURNING " . UsuariosExtCols::ID,
            $datos
        );

        return $row ? (int) $row[UsuariosExtCols::ID] : null;
    }
}
