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
use App\Config\Schema\_generated\SamplesCols;
use App\Config\Schema\_generated\SamplesEnums;
use App\Config\Schema\_generated\LikesCols;
use App\Config\Schema\_generated\LikesEnums;
use App\Config\Schema\_generated\ReproduccionesCols;
use App\Config\Schema\_generated\DescargasCols;

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
            "SELECT * FROM {$tabla} ORDER BY " . UsuariosExtCols::CREATED_AT . " DESC LIMIT :limit",
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
     * Adquirir advisory lock de sesión para operaciones TOCTOU.
     * Usar pg_advisory_lock (session-level) en vez de pg_advisory_xact_lock
     * porque con PDO autocommit cada query es su propia transacción.
     * DEBE llamarse advisoryUnlock() al terminar (idealmente en bloque finally).
     */
    public static function advisoryLock(int $userId): void
    {
        static::ejecutar("SELECT pg_advisory_lock(:lockId)", ['lockId' => $userId]);
    }

    /*
     * Liberar advisory lock de sesión adquirido con advisoryLock().
     */
    public static function advisoryUnlock(int $userId): void
    {
        static::ejecutar("SELECT pg_advisory_unlock(:lockId)", ['lockId' => $userId]);
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
            . " FROM {$tabla} WHERE " . UsuariosExtCols::USERNAME . " = :" . UsuariosExtCols::USERNAME,
            [UsuariosExtCols::USERNAME => $username]
        );
    }

    /*
     * Buscar usuario completo por wp_user_id.
     */
    public static function buscarPorWpId(int $wpId): ?array
    {
        $tabla = UsuariosExtCols::TABLA;

        return static::consultarUno(
            /* sentinel-disable-next-line repository-sin-whitelist-columnas — intencionado: buscarPorWpId retorna entidad completa para evitar re-fetches */
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
                "UPDATE {$tabla} SET " . UsuariosExtCols::PLAN . " = :" . UsuariosExtCols::PLAN . ", "
                . UsuariosExtCols::STRIPE_SUBSCRIPTION_ID . " = :subId WHERE " . UsuariosExtCols::ID . " = :id",
                [UsuariosExtCols::PLAN => $plan, 'subId' => $subscriptionId, 'id' => $id]
            );
        }

        return static::ejecutar(
            "UPDATE {$tabla} SET " . UsuariosExtCols::PLAN . " = :" . UsuariosExtCols::PLAN . " WHERE " . UsuariosExtCols::ID . " = :id",
            [UsuariosExtCols::PLAN => $plan, 'id' => $id]
        );
    }

    /*
     * Cancelar suscripción: plan='free', stripe_subscription_id=NULL.
     */
    public static function cancelarSuscripcion(int $id): int
    {
        $tabla = UsuariosExtCols::TABLA;

        return static::ejecutar(
            "UPDATE {$tabla} SET " . UsuariosExtCols::PLAN . " = '" . UsuariosExtEnums::PLAN_FREE . "', "
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
            "UPDATE {$tabla} SET " . UsuariosExtCols::ROL . " = :" . UsuariosExtCols::ROL . " WHERE " . UsuariosExtCols::ID . " = :id",
            [UsuariosExtCols::ROL => $rol, 'id' => $id]
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
            "SELECT " . UsuariosExtCols::ID . " FROM {$tabla} WHERE " . UsuariosExtCols::USERNAME . " = :" . UsuariosExtCols::USERNAME,
            [UsuariosExtCols::USERNAME => $username]
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

    /*
     * Obtener username por ID (para mensajes de notificacion legibles).
     * Retorna 'usuario' como fallback si no se encuentra.
     */
    public static function buscarUsername(int $id): string
    {
        $tabla = UsuariosExtCols::TABLA;

        $row = static::consultarUno(
            "SELECT " . UsuariosExtCols::USERNAME . " FROM {$tabla} WHERE " . UsuariosExtCols::ID . " = :id",
            ['id' => $id]
        );

        return $row[UsuariosExtCols::USERNAME] ?? 'usuario';
    }

    /*
     * Contar interacciones totales del usuario (likes sample + reproducciones + descargas).
     * Usado por PerfilUsuario para detectar usuario nuevo sin historial.
     */
    public static function contarInteracciones(int $userId): int
    {
        $row = static::consultarUno(
            "SELECT"
            . " (SELECT COUNT(*) FROM " . LikesCols::TABLA . " WHERE " . LikesCols::USUARIO_ID . " = :userId AND " . LikesCols::TIPO . " = '" . LikesEnums::TIPO_SAMPLE . "') +"
            . " (SELECT COUNT(*) FROM " . ReproduccionesCols::TABLA . " WHERE " . ReproduccionesCols::USUARIO_ID . " = :userId2) +"
            . " (SELECT COUNT(*) FROM " . DescargasCols::TABLA . " WHERE " . DescargasCols::USUARIO_ID . " = :userId3) as total",
            ['userId' => $userId, 'userId2' => $userId, 'userId3' => $userId]
        );

        return (int) ($row['total'] ?? 0);
    }

    /*
     * BPM promedio de samples likeados/reproducidos por el usuario (excluye dislikes).
     */
    public static function bpmPromedio(int $userId): ?int
    {
        $row = static::consultarUno(
            "SELECT AVG(s." . SamplesCols::BPM . ")::int as bpm_prom"
            . " FROM " . SamplesCols::TABLA . " s"
            . " WHERE s." . SamplesCols::BPM . " IS NOT NULL AND s." . SamplesCols::ID . " IN ("
            . " SELECT " . LikesCols::TARGET_ID . " FROM " . LikesCols::TABLA . " WHERE " . LikesCols::USUARIO_ID . " = :userId AND " . LikesCols::TIPO . " = '" . LikesEnums::TIPO_SAMPLE . "' AND " . LikesCols::REACCION . " IN ('" . LikesEnums::REACCION_LIKE . "', '" . LikesEnums::REACCION_ENCANTA . "')"
            . " UNION"
            . " SELECT " . ReproduccionesCols::SAMPLE_ID . " FROM " . ReproduccionesCols::TABLA . " WHERE " . ReproduccionesCols::USUARIO_ID . " = :userId2"
            . ")",
            ['userId' => $userId, 'userId2' => $userId]
        );

        return $row && $row['bpm_prom'] !== null ? (int) $row['bpm_prom'] : null;
    }

    /*
     * Key musical mas frecuente en samples likeados/reproducidos.
     */
    public static function keyFavorita(int $userId): ?string
    {
        $row = static::consultarUno(
            "SELECT s." . SamplesCols::KEY . " as key_fav, COUNT(*) as cnt"
            . " FROM " . SamplesCols::TABLA . " s"
            . " WHERE s." . SamplesCols::KEY . " IS NOT NULL AND s." . SamplesCols::ID . " IN ("
            . " SELECT " . LikesCols::TARGET_ID . " FROM " . LikesCols::TABLA . " WHERE " . LikesCols::USUARIO_ID . " = :userId AND " . LikesCols::TIPO . " = '" . LikesEnums::TIPO_SAMPLE . "' AND " . LikesCols::REACCION . " IN ('" . LikesEnums::REACCION_LIKE . "', '" . LikesEnums::REACCION_ENCANTA . "')"
            . " UNION"
            . " SELECT " . ReproduccionesCols::SAMPLE_ID . " FROM " . ReproduccionesCols::TABLA . " WHERE " . ReproduccionesCols::USUARIO_ID . " = :userId2"
            . ")"
            . " GROUP BY s." . SamplesCols::KEY . " ORDER BY cnt DESC LIMIT 1",
            ['userId' => $userId, 'userId2' => $userId]
        );

        return $row['key_fav'] ?? null;
    }

    /*
     * Tipo de sample mas frecuente en samples likeados/reproducidos.
     */
    public static function tipoFavorito(int $userId): ?string
    {
        $row = static::consultarUno(
            "SELECT s." . SamplesCols::TIPO . " as tipo_fav, COUNT(*) as cnt"
            . " FROM " . SamplesCols::TABLA . " s"
            . " WHERE s." . SamplesCols::ID . " IN ("
            . " SELECT " . LikesCols::TARGET_ID . " FROM " . LikesCols::TABLA . " WHERE " . LikesCols::USUARIO_ID . " = :userId AND " . LikesCols::TIPO . " = '" . LikesEnums::TIPO_SAMPLE . "' AND " . LikesCols::REACCION . " IN ('" . LikesEnums::REACCION_LIKE . "', '" . LikesEnums::REACCION_ENCANTA . "')"
            . " UNION"
            . " SELECT " . ReproduccionesCols::SAMPLE_ID . " FROM " . ReproduccionesCols::TABLA . " WHERE " . ReproduccionesCols::USUARIO_ID . " = :userId2"
            . ")"
            . " GROUP BY s." . SamplesCols::TIPO . " ORDER BY cnt DESC LIMIT 1",
            ['userId' => $userId, 'userId2' => $userId]
        );

        return $row['tipo_fav'] ?? null;
    }

    /*
     * Escala musical mas frecuente en samples likeados/reproducidos (major/minor).
     */
    public static function escalaFavorita(int $userId): ?string
    {
        $row = static::consultarUno(
            "SELECT LOWER(s." . SamplesCols::ESCALA . ") as escala_fav, COUNT(*) as cnt"
            . " FROM " . SamplesCols::TABLA . " s"
            . " WHERE s." . SamplesCols::ESCALA . " IS NOT NULL AND s." . SamplesCols::ESCALA . " != '' AND s." . SamplesCols::ID . " IN ("
            . " SELECT " . LikesCols::TARGET_ID . " FROM " . LikesCols::TABLA . " WHERE " . LikesCols::USUARIO_ID . " = :userId AND " . LikesCols::TIPO . " = '" . LikesEnums::TIPO_SAMPLE . "' AND " . LikesCols::REACCION . " IN ('" . LikesEnums::REACCION_LIKE . "', '" . LikesEnums::REACCION_ENCANTA . "')"
            . " UNION"
            . " SELECT " . ReproduccionesCols::SAMPLE_ID . " FROM " . ReproduccionesCols::TABLA . " WHERE " . ReproduccionesCols::USUARIO_ID . " = :userId2"
            . ")"
            . " GROUP BY LOWER(s." . SamplesCols::ESCALA . ") ORDER BY cnt DESC LIMIT 1",
            ['userId' => $userId, 'userId2' => $userId]
        );

        return $row['escala_fav'] ?? null;
    }

    /*
     * Top 5 creadores con mayor afinidad del usuario.
     * Pesos: encanta=2, like=1, reproduccion=0.5, descarga=1.5.
     * Excluye al propio usuario y requiere afinidad >= 2.
     */
    public static function obtenerCreadoresFavoritos(int $userId): array
    {
        $resultado = static::consultar(
            "SELECT " . SamplesCols::CREADOR_ID . ", SUM(score) as afinidad FROM ("
            . " SELECT s." . SamplesCols::CREADOR_ID . ","
            . " CASE WHEN l." . LikesCols::REACCION . " = '" . LikesEnums::REACCION_ENCANTA . "' THEN 2.0 ELSE 1.0 END as score"
            . " FROM " . LikesCols::TABLA . " l"
            . " JOIN " . SamplesCols::TABLA . " s ON l." . LikesCols::TARGET_ID . " = s." . SamplesCols::ID
            . " WHERE l." . LikesCols::USUARIO_ID . " = :userId AND l." . LikesCols::TIPO . " = '" . LikesEnums::TIPO_SAMPLE . "' AND l." . LikesCols::REACCION . " IN ('" . LikesEnums::REACCION_LIKE . "', '" . LikesEnums::REACCION_ENCANTA . "')"
            . " UNION ALL"
            . " SELECT s." . SamplesCols::CREADOR_ID . ", 0.5 as score"
            . " FROM " . ReproduccionesCols::TABLA . " r"
            . " JOIN " . SamplesCols::TABLA . " s ON r." . ReproduccionesCols::SAMPLE_ID . " = s." . SamplesCols::ID
            . " WHERE r." . ReproduccionesCols::USUARIO_ID . " = :userId2"
            . " UNION ALL"
            . " SELECT s." . SamplesCols::CREADOR_ID . ", 1.5 as score"
            . " FROM " . DescargasCols::TABLA . " d"
            . " JOIN " . SamplesCols::TABLA . " s ON d." . DescargasCols::SAMPLE_ID . " = s." . SamplesCols::ID
            . " WHERE d." . DescargasCols::USUARIO_ID . " = :userId3"
            . ") interacciones"
            . " WHERE " . SamplesCols::CREADOR_ID . " != :userId4"
            . " GROUP BY " . SamplesCols::CREADOR_ID
            . " HAVING SUM(score) >= 2"
            . " ORDER BY afinidad DESC"
            . " LIMIT 5",
            ['userId' => $userId, 'userId2' => $userId, 'userId3' => $userId, 'userId4' => $userId]
        );

        return \array_column($resultado, SamplesCols::CREADOR_ID);
    }

    /* --- Metodos de gestion de bans --- */

    /*
     * Incrementar violaciones_moderacion en 1 atomicamente con UPDATE RETURNING.
     * Evita race conditions en requests concurrentes.
     * Retorna el nuevo total de violaciones, o 0 si el usuario no existe.
     */
    public static function incrementarViolaciones(int $userId): int
    {
        $tabla = UsuariosExtCols::TABLA;
        $resultado = static::consultarUno(
            "UPDATE {$tabla} SET " . UsuariosExtCols::VIOLACIONES_MODERACION . " = COALESCE(" . UsuariosExtCols::VIOLACIONES_MODERACION . ", 0) + 1
             WHERE " . UsuariosExtCols::ID . " = :id RETURNING " . UsuariosExtCols::VIOLACIONES_MODERACION,
            ['id' => $userId]
        );
        return (int) ($resultado[UsuariosExtCols::VIOLACIONES_MODERACION] ?? 0);
    }

    /*
     * Aplicar ban temporal: actualiza baneado_hasta y ban_razon.
     */
    public static function aplicarBan(int $userId, string $banHasta, string $banRazon): void
    {
        $tabla = UsuariosExtCols::TABLA;
        static::ejecutar(
            "UPDATE {$tabla} SET " . UsuariosExtCols::BANEADO_HASTA . " = :hasta, " . UsuariosExtCols::BAN_RAZON . " = :" . UsuariosExtCols::BAN_RAZON . "
             WHERE " . UsuariosExtCols::ID . " = :id",
            ['hasta' => $banHasta, UsuariosExtCols::BAN_RAZON => $banRazon, 'id' => $userId]
        );
    }

    /*
     * Obtener datos de ban de un usuario (baneado_hasta + ban_razon).
     * Retorna null si el usuario no existe.
     */
    public static function obtenerDatosBan(int $userId): ?array
    {
        $tabla = UsuariosExtCols::TABLA;
        return static::consultarUno(
            "SELECT " . UsuariosExtCols::BANEADO_HASTA . ", " . UsuariosExtCols::BAN_RAZON . "
             FROM {$tabla} WHERE " . UsuariosExtCols::ID . " = :id",
            ['id' => $userId]
        );
    }

    /*
     * Limpiar ban expirado: pone baneado_hasta=NULL y ban_razon=NULL.
     */
    public static function limpiarBan(int $userId): void
    {
        $tabla = UsuariosExtCols::TABLA;
        static::ejecutar(
            "UPDATE {$tabla} SET " . UsuariosExtCols::BANEADO_HASTA . " = NULL, " . UsuariosExtCols::BAN_RAZON . " = NULL
             WHERE " . UsuariosExtCols::ID . " = :id",
            ['id' => $userId]
        );
    }

    /* --- Metodos de integracion con Stripe --- */

    /*
     * Guardar stripe_connect_id tras crear cuenta Connect.
     */
    public static function guardarStripeConnectId(int $userId, string $connectId): void
    {
        $tabla = UsuariosExtCols::TABLA;
        static::ejecutar(
            "UPDATE {$tabla} SET " . UsuariosExtCols::STRIPE_CONNECT_ID . " = :connectId
             WHERE " . UsuariosExtCols::ID . " = :id",
            ['connectId' => $connectId, 'id' => $userId]
        );
    }

    /*
     * Obtener stripe_customer_id de un usuario.
     * Retorna null si no tiene customer de Stripe.
     */
    public static function obtenerStripeCustomerId(int $userId): ?string
    {
        $tabla = UsuariosExtCols::TABLA;
        $row = static::consultarUno(
            "SELECT " . UsuariosExtCols::STRIPE_CUSTOMER_ID . " FROM {$tabla}
             WHERE " . UsuariosExtCols::ID . " = :id",
            ['id' => $userId]
        );
        return $row[UsuariosExtCols::STRIPE_CUSTOMER_ID] ?? null;
    }

    /*
     * Obtener stripe_connect_id de un creador para transferencias.
     * Retorna null si el creador no tiene cuenta Connect.
     */
    public static function obtenerStripeConnectIdPorUsuario(int $userId): ?string
    {
        $tabla = UsuariosExtCols::TABLA;
        $row = static::consultarUno(
            "SELECT " . UsuariosExtCols::STRIPE_CONNECT_ID . " FROM {$tabla}
             WHERE " . UsuariosExtCols::ID . " = :id",
            ['id' => $userId]
        );
        return $row[UsuariosExtCols::STRIPE_CONNECT_ID] ?? null;
    }

    /*
     * Obtener datos del usuario necesarios para crear un Stripe Customer
     * (email, nombre_visible, username).
     */
    public static function obtenerDatosStripe(int $userId): ?array
    {
        $tabla = UsuariosExtCols::TABLA;
        return static::consultarUno(
            "SELECT " . UsuariosExtCols::EMAIL . ", " . UsuariosExtCols::NOMBRE_VISIBLE . ", "
                . UsuariosExtCols::USERNAME . ", " . UsuariosExtCols::STRIPE_CUSTOMER_ID . "
             FROM {$tabla} WHERE " . UsuariosExtCols::ID . " = :id",
            ['id' => $userId]
        );
    }

    /*
     * Guardar stripe_customer_id tras crear customer en Stripe.
     */
    public static function guardarStripeCustomerId(int $userId, string $customerId): void
    {
        $tabla = UsuariosExtCols::TABLA;
        static::ejecutar(
            "UPDATE {$tabla} SET " . UsuariosExtCols::STRIPE_CUSTOMER_ID . " = :customerId
             WHERE " . UsuariosExtCols::ID . " = :id",
            ['customerId' => $customerId, 'id' => $userId]
        );
    }
}
