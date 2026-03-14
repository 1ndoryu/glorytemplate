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
     * Buscar registros con estado activo, paginados.
     */
    public static function buscarActivos(int $limit = 20, int $offset = 0): array
    {
        $tabla = UsuariosExtCols::TABLA;
        $colEstado = UsuariosExtCols::ESTADO;

        return static::consultar(
            "SELECT * FROM {$tabla} WHERE {$colEstado} = :estado ORDER BY " . static::colId() . " DESC LIMIT :limit OFFSET :offset",
            [
                'estado' => UsuariosExtEnums::ESTADO_ACTIVO,
                'limit' => $limit,
                'offset' => $offset,
            ]
        );
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
            . UsuariosExtCols::TOTAL_DESCARGAS . ", " . UsuariosExtCols::CREATED_AT . ", "
            . UsuariosExtCols::ESTADO
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
     * Actualizar portada_url de un usuario.
     * QQ95: endpoint /me/portada guarda la URL de la imagen de portada.
     */
    public static function actualizarPortada(int $wpUserId, string $portadaUrl): void
    {
        $tabla = UsuariosExtCols::TABLA;

        static::ejecutar(
            "UPDATE {$tabla} SET " . UsuariosExtCols::PORTADA_URL . " = :portada, "
            . UsuariosExtCols::UPDATED_AT . " = NOW() WHERE " . UsuariosExtCols::WP_USER_ID . " = :wpId",
            ['portada' => $portadaUrl, 'wpId' => $wpUserId]
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
            "SELECT " . UsuariosExtCols::ID . ", " . UsuariosExtCols::TOTAL_SEGUIDORES
            . " FROM {$tabla} WHERE " . UsuariosExtCols::USERNAME . " = :" . UsuariosExtCols::USERNAME,
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

    /*
     * Perfil completo para el algoritmo de recomendacion en 1 solo roundtrip.
     * Unifica contarInteracciones + bpmPromedio + keyFavorita + escalaFavorita + tipoFavorito
     * en una sola CTE que reutiliza la subquery de "samples interactuados".
     * obtenerCreadoresFavoritos se ejecuta por separado (estructura UNION ALL diferente).
     * Total: 2 queries en vez de 7.
     */
    public static function perfilCompletoParaAlgoritmo(int $userId): array
    {
        $tl = LikesCols::TABLA;
        $lUid = LikesCols::USUARIO_ID;
        $lTipo = LikesCols::TIPO;
        $lTarget = LikesCols::TARGET_ID;
        $lReacc = LikesCols::REACCION;
        $ltSample = LikesEnums::TIPO_SAMPLE;
        $rLike = LikesEnums::REACCION_LIKE;
        $rEncanta = LikesEnums::REACCION_ENCANTA;
        $tr = ReproduccionesCols::TABLA;
        $rUid = ReproduccionesCols::USUARIO_ID;
        $rSid = ReproduccionesCols::SAMPLE_ID;
        $td = DescargasCols::TABLA;
        $dUid = DescargasCols::USUARIO_ID;
        $ts = SamplesCols::TABLA;
        $sId = SamplesCols::ID;
        $sBpm = SamplesCols::BPM;
        $sKey = SamplesCols::KEY;
        $sEscala = SamplesCols::ESCALA;
        $sTipo = SamplesCols::TIPO;

        $sql = "WITH interacciones AS ("
            . " SELECT {$lTarget} AS sample_id FROM {$tl}"
            . " WHERE {$lUid} = :uid1 AND {$lTipo} = '{$ltSample}'"
            . " AND {$lReacc} IN ('{$rLike}', '{$rEncanta}')"
            . " UNION"
            . " SELECT {$rSid} FROM {$tr} WHERE {$rUid} = :uid2"
            . "),"
            . " total AS ("
            . " SELECT"
            . " (SELECT COUNT(*) FROM {$tl} WHERE {$lUid} = :uid3 AND {$lTipo} = '{$ltSample}')"
            . " + (SELECT COUNT(*) FROM {$tr} WHERE {$rUid} = :uid4)"
            . " + (SELECT COUNT(*) FROM {$td} WHERE {$dUid} = :uid5) AS val"
            . "),"
            . " bpm AS (SELECT AVG(s.{$sBpm})::int AS val FROM {$ts} s JOIN interacciones i ON s.{$sId} = i.sample_id WHERE s.{$sBpm} IS NOT NULL),"
            . " key_fav AS (SELECT s.{$sKey} AS val FROM {$ts} s JOIN interacciones i ON s.{$sId} = i.sample_id WHERE s.{$sKey} IS NOT NULL GROUP BY s.{$sKey} ORDER BY COUNT(*) DESC LIMIT 1),"
            . " escala_fav AS (SELECT LOWER(s.{$sEscala}) AS val FROM {$ts} s JOIN interacciones i ON s.{$sId} = i.sample_id WHERE s.{$sEscala} IS NOT NULL AND s.{$sEscala} != '' GROUP BY LOWER(s.{$sEscala}) ORDER BY COUNT(*) DESC LIMIT 1),"
            . " tipo_fav AS (SELECT s.{$sTipo} AS val FROM {$ts} s JOIN interacciones i ON s.{$sId} = i.sample_id GROUP BY s.{$sTipo} ORDER BY COUNT(*) DESC LIMIT 1)"
            . " SELECT"
            . " (SELECT val FROM total) AS interacciones,"
            . " (SELECT val FROM bpm) AS bpm_prom,"
            . " (SELECT val FROM key_fav) AS key_fav,"
            . " (SELECT val FROM escala_fav) AS escala_fav,"
            . " (SELECT val FROM tipo_fav) AS tipo_fav";

        $row = static::consultarUno($sql, [
            'uid1' => $userId, 'uid2' => $userId, 'uid3' => $userId,
            'uid4' => $userId, 'uid5' => $userId,
        ]);

        if (!$row) {
            return ['interacciones' => 0, 'bpmProm' => null, 'keyFav' => null, 'escalaFav' => null, 'tipoFav' => null];
        }

        return [
            'interacciones' => (int) ($row['interacciones'] ?? 0),
            'bpmProm'       => $row['bpm_prom'] !== null ? (int) $row['bpm_prom'] : null,
            'keyFav'        => $row['key_fav'] ?? null,
            'escalaFav'     => $row['escala_fav'] ?? null,
            'tipoFav'       => $row['tipo_fav'] ?? null,
        ];
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

    /* --- Metodos de suspension/eliminacion de cuentas (QQ65) --- */

    /*
     * Actualizar estado de cuenta a suspendido con fecha límite y razón.
     */
    public static function actualizarEstadoCuenta(int $userId, string $estado, string $suspendidoHasta, string $razon): void
    {
        $tabla = UsuariosExtCols::TABLA;
        static::ejecutar(
            "UPDATE {$tabla} SET "
            . UsuariosExtCols::ESTADO . " = :estado, "
            . UsuariosExtCols::SUSPENDIDO_HASTA . " = :hasta, "
            . UsuariosExtCols::SUSPENSION_RAZON . " = :razon, "
            . UsuariosExtCols::UPDATED_AT . " = NOW() "
            . "WHERE " . UsuariosExtCols::ID . " = :id",
            ['estado' => $estado, 'hasta' => $suspendidoHasta, 'razon' => $razon, 'id' => $userId]
        );
    }

    /*
     * Restaurar estado de cuenta a activo (limpia todos los campos de suspensión/eliminación).
     */
    public static function restaurarEstadoCuenta(int $userId): void
    {
        $tabla = UsuariosExtCols::TABLA;
        static::ejecutar(
            "UPDATE {$tabla} SET "
            . UsuariosExtCols::ESTADO . " = :estado, "
            . UsuariosExtCols::SUSPENDIDO_HASTA . " = NULL, "
            . UsuariosExtCols::SUSPENSION_RAZON . " = NULL, "
            . UsuariosExtCols::MARCADO_ELIMINACION_EN . " = NULL, "
            . UsuariosExtCols::SERA_ELIMINADO_EN . " = NULL, "
            . UsuariosExtCols::UPDATED_AT . " = NOW() "
            . "WHERE " . UsuariosExtCols::ID . " = :id",
            ['estado' => UsuariosExtEnums::ESTADO_ACTIVO, 'id' => $userId]
        );
    }

    /*
     * Marcar cuenta para eliminación (estado en_eliminacion + fechas).
     */
    public static function marcarEliminacion(int $userId, string $marcadoEn, string $seraEliminadoEn, string $razon): void
    {
        $tabla = UsuariosExtCols::TABLA;
        static::ejecutar(
            "UPDATE {$tabla} SET "
            . UsuariosExtCols::ESTADO . " = :estado, "
            . UsuariosExtCols::MARCADO_ELIMINACION_EN . " = :marcadoEn, "
            . UsuariosExtCols::SERA_ELIMINADO_EN . " = :seraEn, "
            . UsuariosExtCols::SUSPENSION_RAZON . " = :razon, "
            . UsuariosExtCols::UPDATED_AT . " = NOW() "
            . "WHERE " . UsuariosExtCols::ID . " = :id",
            [
                'estado' => UsuariosExtEnums::ESTADO_EN_ELIMINACION,
                'marcadoEn' => $marcadoEn,
                'seraEn' => $seraEliminadoEn,
                'razon' => $razon,
                'id' => $userId,
            ]
        );
    }

    /*
     * Obtener estado de cuenta (solo la columna estado).
     */
    public static function obtenerEstadoCuenta(int $userId): string
    {
        $tabla = UsuariosExtCols::TABLA;
        $row = static::consultarUno(
            "SELECT " . UsuariosExtCols::ESTADO . " FROM {$tabla} WHERE " . UsuariosExtCols::ID . " = :id",
            ['id' => $userId]
        );
        return $row[UsuariosExtCols::ESTADO] ?? UsuariosExtEnums::ESTADO_ACTIVO;
    }

    /*
     * Obtener datos de suspensión completos para verificación de estado.
     */
    public static function obtenerDatosSuspension(int $userId): ?array
    {
        $tabla = UsuariosExtCols::TABLA;
        return static::consultarUno(
            "SELECT " . UsuariosExtCols::ESTADO . ", "
            . UsuariosExtCols::SUSPENDIDO_HASTA . ", "
            . UsuariosExtCols::SUSPENSION_RAZON . ", "
            . UsuariosExtCols::SERA_ELIMINADO_EN
            . " FROM {$tabla} WHERE " . UsuariosExtCols::ID . " = :id",
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

    /**
     * Lista perfiles para el sitemap XML.
     * Solo usuarios con al menos 1 sample publicado.
     */
    public static function listarParaSitemap(int $limit = 2000, int $offset = 0): array
    {
        $tabla = UsuariosExtCols::TABLA;
        $sql = "SELECT " . UsuariosExtCols::USERNAME . ", " . UsuariosExtCols::UPDATED_AT . ", " . UsuariosExtCols::CREATED_AT
             . " FROM {$tabla}"
             . " WHERE " . UsuariosExtCols::TOTAL_SAMPLES . " > 0"
             . " ORDER BY " . UsuariosExtCols::TOTAL_SAMPLES . " DESC"
             . " LIMIT :limit OFFSET :offset";

        return static::consultar($sql, ['limit' => $limit, 'offset' => $offset]);
    }

    /**
     * Cuenta total de perfiles indexables para paginacion del sitemap.
     */
    public static function contarParaSitemap(): int
    {
        $tabla = UsuariosExtCols::TABLA;
        $sql = "SELECT COUNT(*) FROM {$tabla} WHERE " . UsuariosExtCols::TOTAL_SAMPLES . " > 0";

        $resultado = static::consultarValor($sql, []);
        return (int) ($resultado ?? 0);
    }

    /* --- Metodos de seed users (sistema de atribucion legal) --- */

    /*
     * Crear usuario seed en usuarios_ext.
     * Recibe wp_user_id (obligatorio), username, nombre_visible, email.
     * Retorna el id generado o 0 si falla.
     */
    public static function crearSeedUser(array $datos): int
    {
        $tabla = UsuariosExtCols::TABLA;

        try {
            $id = static::insertar(
                "INSERT INTO {$tabla} ("
                . UsuariosExtCols::WP_USER_ID . ", "
                . UsuariosExtCols::USERNAME . ", "
                . UsuariosExtCols::NOMBRE_VISIBLE . ", "
                . UsuariosExtCols::EMAIL . ", "
                . UsuariosExtCols::ES_SEED . ", "
                . UsuariosExtCols::PLAN . ", "
                . UsuariosExtCols::ROL
                . ") VALUES (:wpId, :username, :nombre, :email, true, 'free', 'usuario')"
                . " RETURNING " . UsuariosExtCols::ID,
                [
                    'wpId'     => $datos['wp_user_id'],
                    'username' => $datos['username'],
                    'nombre'   => $datos['nombre_visible'],
                    'email'    => $datos['email'],
                ]
            );

            return $id ?? 0;
        } catch (\Throwable $e) {
            return 0;
        }
    }

    /*
     * Contar seed users existentes.
     */
    public static function contarSeedUsers(): int
    {
        $tabla = UsuariosExtCols::TABLA;

        $row = static::consultarUno(
            "SELECT COUNT(*) as total FROM {$tabla} WHERE " . UsuariosExtCols::ES_SEED . " = true",
            []
        );

        return $row ? (int) $row['total'] : 0;
    }

    /*
     * Listar IDs de todos los seed users (para distribucion Pareto).
     */
    public static function listarSeedUsers(): array
    {
        $tabla = UsuariosExtCols::TABLA;

        return static::consultar(
            "SELECT " . UsuariosExtCols::ID . " FROM {$tabla} WHERE " . UsuariosExtCols::ES_SEED . " = true ORDER BY " . UsuariosExtCols::ID,
            []
        );
    }

    /**
     * Obtiene un campo especifico de usuarios_ext por ID de usuario Postgres.
     * Retorna el valor raw del campo o null si no existe.
     */
    public static function obtenerCampo(int $userId, string $columna)
    {
        $tabla = UsuariosExtCols::TABLA;
        $idCol = UsuariosExtCols::ID;

        if (!in_array($columna, UsuariosExtCols::TODAS, true)) {
            return null;
        }

        $row = static::consultarUno(
            "SELECT {$columna} FROM {$tabla} WHERE {$idCol} = :id",
            ['id' => $userId]
        );

        return $row[$columna] ?? null;
    }
}
