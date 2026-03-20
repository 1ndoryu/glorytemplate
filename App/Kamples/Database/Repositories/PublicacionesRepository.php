<?php

/**
 * PublicacionesRepository — Acceso a datos para tabla 'publicaciones'.
 *
 * SECCION AUTO-GENERADA: Los metodos base se regeneran con schema:generate.
 * SECCION CUSTOM: Todo debajo de la marca CUSTOM se preserva al regenerar.
 *
 * @package Kamples
 */

namespace App\Kamples\Database\Repositories;

use App\Config\Schema\_generated\PublicacionesCols;
use App\Config\Schema\_generated\PublicacionesEnums;
use App\Config\Schema\_generated\PublicacionesDTO;
use App\Config\Schema\_generated\LikesCols;
use App\Config\Schema\_generated\LikesEnums;
use App\Config\Schema\_generated\UsuariosExtCols;
use App\Config\Schema\_generated\UsuariosExtEnums;
use App\Config\Schema\_generated\ComentariosCols;
use App\Config\Schema\_generated\ComentariosEnums;
use App\Config\Schema\_generated\FollowsCols;
use App\Kamples\Database\Repositories\ReportesRepository;

class PublicacionesRepository extends BaseRepository
{
    protected static function tabla(): string
    {
        return PublicacionesCols::TABLA;
    }

    protected static function colId(): string
    {
        return PublicacionesCols::ID;
    }

    /*
     * Buscar registros del usuario dado.
     */
    public static function buscarPorUsuario(int $usuarioId, int $limit = 20, int $offset = 0): array
    {
        $tabla = PublicacionesCols::TABLA;
        $col = PublicacionesCols::AUTOR_ID;

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
        $tabla = PublicacionesCols::TABLA;

        return static::consultar(
            "SELECT * FROM {$tabla} ORDER BY " . PublicacionesCols::CREATED_AT . " DESC LIMIT :limit",
            ['limit' => $limit]
        );
    }

    /* === METODOS CUSTOM (seguro para editar debajo de esta linea) === */

                

        

    

    

    

    /*
     * Listar publicaciones pendientes de moderación con datos del autor.
     */
    public static function listarPendientesModeracion(int $offset, int $limit = 20): array
    {
        $tp = PublicacionesCols::TABLA;
        $tu = UsuariosExtCols::TABLA;

        return static::consultar(
            "SELECT p." . PublicacionesCols::ID
            . ", p." . PublicacionesCols::CONTENIDO
            . ", p." . PublicacionesCols::IMAGENES
            . ", p." . PublicacionesCols::MODERACION_ESTADO
            . ", p." . PublicacionesCols::MODERACION_DETALLE
            . ", p." . PublicacionesCols::MODERACION_RAZON
            . ", p." . PublicacionesCols::CREATED_AT
            . ", u." . UsuariosExtCols::USERNAME
            . ", u." . UsuariosExtCols::NOMBRE_VISIBLE
            . ", u." . UsuariosExtCols::AVATAR_URL
            . ", u." . UsuariosExtCols::WP_USER_ID
            . ", 'publicacion' as tipo_contenido"
            . " FROM {$tp} p JOIN {$tu} u ON p." . PublicacionesCols::AUTOR_ID . " = u." . UsuariosExtCols::ID
            . " WHERE p." . PublicacionesCols::MODERACION_ESTADO . " IN (:estado_pendiente, :estado_revision)"
            . " ORDER BY p." . PublicacionesCols::CREATED_AT . " DESC LIMIT :limit OFFSET :offset",
            ['limit' => $limit, 'offset' => $offset, 'estado_pendiente' => PublicacionesEnums::MODERACION_ESTADO_PENDIENTE, 'estado_revision' => PublicacionesEnums::MODERACION_ESTADO_REVISION]
        );
    }

    /*
     * Actualizar estado de moderación de una publicación.
     * Retorna true si la publicación existía.
     */
    public static function actualizarEstadoModeracion(int $id, string $estado): bool
    {
        $tabla = PublicacionesCols::TABLA;

        static::ejecutar(
            "UPDATE {$tabla} SET " . PublicacionesCols::MODERACION_ESTADO . " = :estado WHERE " . PublicacionesCols::ID . " = :id",
            ['estado' => $estado, 'id' => $id]
        );

        return static::existe([PublicacionesCols::ID => $id]);
    }

    /*
     * Rechazar en masa todas las publicaciones pendientes de moderación.
     * Retorna la cantidad de publicaciones afectadas.
     */
    public static function rechazarTodosPendientes(): int
    {
        $tabla = PublicacionesCols::TABLA;
        $colEstado = PublicacionesCols::MODERACION_ESTADO;

        /* ejecutar() devuelve int (filas afectadas), no PDOStatement */
        return static::ejecutar(
            "UPDATE {$tabla} SET {$colEstado} = :rechazado WHERE {$colEstado} IN (:pendiente, :revision)",
            [
                'rechazado' => PublicacionesEnums::MODERACION_ESTADO_RECHAZADO,
                'pendiente' => PublicacionesEnums::MODERACION_ESTADO_PENDIENTE,
                'revision' => PublicacionesEnums::MODERACION_ESTADO_REVISION,
            ]
        );
    }

    /*
     * Listar publicaciones moderadas recientemente (historial IA).
     * Incluye TODAS las publicaciones de los últimos N días con cualquier estado de moderación.
     * Permite a admins revisar decisiones de la IA.
     */
    public static function listarModeradasRecientes(int $dias = 2, int $limit = 50): array
    {
        $tp = PublicacionesCols::TABLA;
        $tu = UsuariosExtCols::TABLA;

        $validosIntervalo = ['1 day', '2 days', '3 days', '7 days', '14 days', '30 days'];
        $intervalo = $dias . ($dias === 1 ? ' day' : ' days');
        if (!in_array($intervalo, $validosIntervalo, true)) {
            $intervalo = '2 days';
        }

        return static::consultar(
            "SELECT p." . PublicacionesCols::ID
            . ", p." . PublicacionesCols::CONTENIDO
            . ", p." . PublicacionesCols::IMAGENES
            . ", p." . PublicacionesCols::MODERACION_ESTADO
            . ", p." . PublicacionesCols::MODERACION_DETALLE
            . ", p." . PublicacionesCols::MODERACION_RAZON
            . ", p." . PublicacionesCols::CREATED_AT
            . ", p." . PublicacionesCols::AUTOR_ID
            . ", u." . UsuariosExtCols::USERNAME
            . ", u." . UsuariosExtCols::NOMBRE_VISIBLE
            . ", u." . UsuariosExtCols::AVATAR_URL
            . ", u." . UsuariosExtCols::WP_USER_ID
            . ", 'publicacion' as tipo_contenido"
            . " FROM {$tp} p JOIN {$tu} u ON p." . PublicacionesCols::AUTOR_ID . " = u." . UsuariosExtCols::ID
            . " WHERE p." . PublicacionesCols::CREATED_AT . " >= NOW() - INTERVAL '{$intervalo}'"
            . " AND p." . PublicacionesCols::MODERACION_ESTADO . " IS NOT NULL"
            . " ORDER BY p." . PublicacionesCols::CREATED_AT . " DESC LIMIT :limit",
            ['limit' => $limit]
        );
    }

    /*
     * Rechazar todas las publicaciones no rechazadas de un usuario.
     * Usado por admin para acción masiva desde el panel de moderación.
     */
    public static function rechazarPublicacionesDeUsuario(int $autorId): int
    {
        $tabla    = PublicacionesCols::TABLA;
        $colEstado = PublicacionesCols::MODERACION_ESTADO;
        $colAutor  = PublicacionesCols::AUTOR_ID;

        return static::ejecutar(
            "UPDATE {$tabla} SET {$colEstado} = :rechazado
             WHERE {$colAutor} = :autorId
               AND {$colEstado} <> :rechazado2",
            [
                'rechazado'  => PublicacionesEnums::MODERACION_ESTADO_RECHAZADO,
                'rechazado2' => PublicacionesEnums::MODERACION_ESTADO_RECHAZADO,
                'autorId'    => $autorId,
            ]
        );
    }

    /*
     * Feed de publicaciones con autor, moderación y likes.
     * Construye WHERE dinámico y subquery de reacción del usuario.
     * QQ76: Excluye publicaciones con >= UMBRAL reportes pendientes (excepto del propio autor).
     */
    public static function listarFeed(
        string $donde,
        string $orderBy,
        array $params
    ): array {
        $tp = PublicacionesCols::TABLA;
        $tu = UsuariosExtCols::TABLA;

        /* Subquery de reacción del usuario actual */
        $tl = LikesCols::TABLA;
        $likedSubquery = isset($params['current_user'])
            ? ", (SELECT l." . LikesCols::REACCION . " FROM {$tl} l WHERE l." . LikesCols::TIPO . " = '" . LikesEnums::TIPO_PUBLICACION . "' AND l." . LikesCols::TARGET_ID . " = p." . PublicacionesCols::ID . " AND l." . LikesCols::USUARIO_ID . " = :current_user LIMIT 1) AS reaccion_usuario"
            : ", NULL AS reaccion_usuario";

        /* [183A-98] Subquery de repost del usuario actual */
        $reposteadoSubquery = isset($params['current_user'])
            ? ", EXISTS(SELECT 1 FROM {$tp} rp WHERE rp." . PublicacionesCols::AUTOR_ID . " = :current_user AND rp." . PublicacionesCols::REPOST_ID . " = p." . PublicacionesCols::ID . " AND rp." . PublicacionesCols::ELIMINADO_EN . " IS NULL) AS reposteado_por_mi"
            : ", FALSE AS reposteado_por_mi";

        /* QQ76: Excluir publicaciones con muchos reportes pendientes */
        $currentUserId = $params['current_user'] ?? null;
        $filtroReportes = ReportesRepository::sqlFiltroAutoOcultacion(
            'publicacion',
            'p.' . PublicacionesCols::ID,
            ReportesRepository::UMBRAL_OCULTAR_PUBLICACION,
            'p.' . PublicacionesCols::AUTOR_ID,
            $currentUserId
        );

        /* JOIN con publicación original y su autor para reposts — expone datos del original en el feed */
        return static::consultar(
            "SELECT p.*, u." . UsuariosExtCols::USERNAME
            . ", u." . UsuariosExtCols::NOMBRE_VISIBLE
            . ", u." . UsuariosExtCols::AVATAR_URL
            . ", u." . UsuariosExtCols::VERIFICADO
            . ", u." . UsuariosExtCols::WP_USER_ID
            . " {$likedSubquery}"
            . " {$reposteadoSubquery}"
            . ", orig." . PublicacionesCols::ID . " AS orig_id"
            . ", orig." . PublicacionesCols::CONTENIDO . " AS orig_contenido"
            . ", orig." . PublicacionesCols::IMAGENES . " AS orig_imagenes"
            . ", orig." . PublicacionesCols::SAMPLES_ADJUNTOS . " AS orig_samples_adjuntos"
            . ", u_orig." . UsuariosExtCols::ID . " AS orig_autor_id"
            . ", u_orig." . UsuariosExtCols::USERNAME . " AS orig_username"
            . ", u_orig." . UsuariosExtCols::NOMBRE_VISIBLE . " AS orig_nombre_visible"
            . ", u_orig." . UsuariosExtCols::AVATAR_URL . " AS orig_avatar_url"
            . ", u_orig." . UsuariosExtCols::VERIFICADO . " AS orig_verificado"
            . ", u_orig." . UsuariosExtCols::WP_USER_ID . " AS orig_wp_user_id"
            . " FROM {$tp} p JOIN {$tu} u ON p." . PublicacionesCols::AUTOR_ID
            . " = u." . UsuariosExtCols::ID
            . " LEFT JOIN {$tp} orig ON p." . PublicacionesCols::REPOST_ID . " = orig." . PublicacionesCols::ID
            . " LEFT JOIN {$tu} u_orig ON orig." . PublicacionesCols::AUTOR_ID . " = u_orig." . UsuariosExtCols::ID
            . " WHERE 1=1 {$donde}"
            . " AND (u." . UsuariosExtCols::ESTADO . " = '" . UsuariosExtEnums::ESTADO_ACTIVO . "' OR u." . UsuariosExtCols::ESTADO . " IS NULL)"
            . $filtroReportes
            . " {$orderBy} LIMIT :limit OFFSET :offset",
            $params
        );
    }

    /**
     * Feed puntuado con scoring multi-señal para el filtro 'todos'.
     *
     * Fórmula: score = frescura(decay exp) + engagement_velocity + boost_social
     * Diversidad por autor: ROW_NUMBER PARTITION BY autor_id cap max_por_autor.
     *
     * CTE 2 niveles: base (score) → diversified (ROW_NUMBER) → SELECT final.
     * Pesos y parámetros vienen de algoritmoPesos['comunidad'].
     * QQ76: Excluye publicaciones con >= UMBRAL reportes pendientes.
     * sentinel-disable-next-line php-service-retorna-asociativo — fetchAll() retorna array indexado, JSON serializa como []
     */
    public static function listarFeedPuntuado(
        string $donde,
        array $params,
        ?int $currentUserId,
        array $configComunidad
    ): array {
        $tp = PublicacionesCols::TABLA;
        $tu = UsuariosExtCols::TABLA;

        /* Extraer pesos de config */
        $senales = $configComunidad['senales'] ?? [];
        $pesoF = (float) ($senales['frescura'] ?? 0.45);
        $pesoE = (float) ($senales['engagement_velocity'] ?? 0.35);
        $pesoS = (float) ($senales['boost_social'] ?? 0.20);

        $parametros = $configComunidad['parametros'] ?? [];
        $vidaMedia = (float) ($parametros['frescura_vida_media_horas'] ?? 24);
        $factorL = (float) ($parametros['engagement_factor_likes'] ?? 1.0);
        $factorC = (float) ($parametros['engagement_factor_comentarios'] ?? 2.0);
        $factorR = (float) ($parametros['engagement_factor_reposts'] ?? 1.5);
        $maxAutor = (int) ($parametros['max_por_autor'] ?? 3);
        $velMin = (float) ($parametros['velocity_min_horas'] ?? 1);

        /* Refs de columnas */
        $pId = PublicacionesCols::ID;
        $pCreAt = PublicacionesCols::CREATED_AT;
        $pTotLik = PublicacionesCols::TOTAL_LIKES;
        $pTotCom = PublicacionesCols::TOTAL_COMENTARIOS;
        $pTotRep = PublicacionesCols::TOTAL_REPOSTS;
        $pAutorId = PublicacionesCols::AUTOR_ID;
        $pRepostId = PublicacionesCols::REPOST_ID;

        /* Frescura: decay exponencial — EXP(-horas/vida_media) */
        $sqlFrescura = "EXP(-1.0 * EXTRACT(EPOCH FROM NOW() - p.{$pCreAt}) / 3600.0 / {$vidaMedia})";

        /* Engagement velocity: interacciones ponderadas / horas — acotado [0,1] */
        $sqlHoras = "GREATEST({$velMin}, EXTRACT(EPOCH FROM NOW() - p.{$pCreAt}) / 3600.0)";
        $sqlEngagement = "LEAST(1.0, (
            COALESCE(p.{$pTotLik}, 0) * {$factorL}
            + COALESCE(p.{$pTotCom}, 0) * {$factorC}
            + COALESCE(p.{$pTotRep}, 0) * {$factorR}
        ) / {$sqlHoras})";

        /* Social boost: 1 si el autor es seguido por el usuario, 0 si no */
        if ($currentUserId) {
            $tf = FollowsCols::TABLA;
            $fSeguidoId = FollowsCols::SEGUIDO_ID;
            $fSeguidorId = FollowsCols::SEGUIDOR_ID;
            $sqlSocial = "CASE WHEN p.{$pAutorId} IN (SELECT {$fSeguidoId} FROM {$tf} WHERE {$fSeguidorId} = :feedUserId) THEN 1.0 ELSE 0.0 END";
            $params['feedUserId'] = $currentUserId;
        } else {
            $sqlSocial = "0.0";
        }

        /* Score compuesto: 3 señales ponderadas */
        $sqlScore = "({$pesoF} * {$sqlFrescura} + {$pesoE} * {$sqlEngagement} + {$pesoS} * {$sqlSocial})";

        /*
         * Score base (no personalizado): solo frescura + engagement.
         * Se usa para el cap de diversidad (ROW_NUMBER) para que TODOS
         * los usuarios vean los MISMOS posts por autor. El score personalizado
         * (con social boost) se aplica solo al ORDER BY final.
         * Esto evita que dos usuarios vean posts distintos del mismo autor
         * solo porque uno sigue al autor y otro no.
         */
        $sqlScoreBase = "({$pesoF} * {$sqlFrescura} + {$pesoE} * {$sqlEngagement})";


        /* Subquery liked (reacción del usuario actual) */
        $tl = LikesCols::TABLA;
        $likedSubquery = isset($params['current_user'])
            ? ", (SELECT l." . LikesCols::REACCION . " FROM {$tl} l WHERE l." . LikesCols::TIPO . " = '" . LikesEnums::TIPO_PUBLICACION . "' AND l." . LikesCols::TARGET_ID . " = p." . $pId . " AND l." . LikesCols::USUARIO_ID . " = :current_user LIMIT 1) AS reaccion_usuario"
            : ", NULL AS reaccion_usuario";

        /* [183A-98] Subquery de repost del usuario actual */
        $reposteadoSubquery = isset($params['current_user'])
            ? ", EXISTS(SELECT 1 FROM {$tp} rp WHERE rp." . PublicacionesCols::AUTOR_ID . " = :current_user AND rp." . PublicacionesCols::REPOST_ID . " = p." . $pId . " AND rp." . PublicacionesCols::ELIMINADO_EN . " IS NULL) AS reposteado_por_mi"
            : ", FALSE AS reposteado_por_mi";

        /* QQ76: Excluir publicaciones con muchos reportes pendientes */
        $filtroReportes = ReportesRepository::sqlFiltroAutoOcultacion(
            'publicacion',
            'p.' . $pId,
            ReportesRepository::UMBRAL_OCULTAR_PUBLICACION,
            'p.' . $pAutorId,
            $currentUserId
        );

        /*
         * CTE 2 niveles:
         * 1. base: calcula _score para cada publicación
         * 2. diversified: aplica ROW_NUMBER para cap por autor
         * 3. SELECT final: ordena por _score y pagina
         */
        $sql = "WITH base AS (
            SELECT p.*, u." . UsuariosExtCols::USERNAME
            . ", u." . UsuariosExtCols::NOMBRE_VISIBLE
            . ", u." . UsuariosExtCols::AVATAR_URL
            . ", u." . UsuariosExtCols::VERIFICADO
            . ", u." . UsuariosExtCols::WP_USER_ID
            . " {$likedSubquery}"
            . " {$reposteadoSubquery}"
            . ", orig.{$pId} AS orig_id"
            . ", orig." . PublicacionesCols::CONTENIDO . " AS orig_contenido"
            . ", orig." . PublicacionesCols::IMAGENES . " AS orig_imagenes"
            . ", orig." . PublicacionesCols::SAMPLES_ADJUNTOS . " AS orig_samples_adjuntos"
            . ", u_orig." . UsuariosExtCols::ID . " AS orig_autor_id"
            . ", u_orig." . UsuariosExtCols::USERNAME . " AS orig_username"
            . ", u_orig." . UsuariosExtCols::NOMBRE_VISIBLE . " AS orig_nombre_visible"
            . ", u_orig." . UsuariosExtCols::AVATAR_URL . " AS orig_avatar_url"
            . ", u_orig." . UsuariosExtCols::VERIFICADO . " AS orig_verificado"
            . ", u_orig." . UsuariosExtCols::WP_USER_ID . " AS orig_wp_user_id"
            . ", {$sqlScore} AS _score"
            . ", {$sqlScoreBase} AS _score_base"
            . " FROM {$tp} p JOIN {$tu} u ON p.{$pAutorId} = u." . UsuariosExtCols::ID
            . " LEFT JOIN {$tp} orig ON p.{$pRepostId} = orig.{$pId}"
            . " LEFT JOIN {$tu} u_orig ON orig.{$pAutorId} = u_orig." . UsuariosExtCols::ID
            . " WHERE 1=1 {$donde}"
            . " AND (u." . UsuariosExtCols::ESTADO . " = '" . UsuariosExtEnums::ESTADO_ACTIVO . "' OR u." . UsuariosExtCols::ESTADO . " IS NULL)"
            . $filtroReportes
            . "), diversified AS ("
            . " SELECT *, ROW_NUMBER() OVER (PARTITION BY {$pAutorId} ORDER BY _score_base DESC) AS _rn_autor"
            . " FROM base"
            . ") SELECT * FROM diversified WHERE _rn_autor <= {$maxAutor}"
            . " ORDER BY _score DESC LIMIT :limit OFFSET :offset";

        return static::consultar($sql, $params);
    }

    /*
     * Obtener publicación con datos del autor.
     */
    public static function obtenerConAutor(int $id): ?array
    {
        $tp = PublicacionesCols::TABLA;
        $tu = UsuariosExtCols::TABLA;

        return static::consultarUno(
            "SELECT p.*, u." . UsuariosExtCols::USERNAME
            . ", u." . UsuariosExtCols::NOMBRE_VISIBLE
            . ", u." . UsuariosExtCols::AVATAR_URL
            . ", u." . UsuariosExtCols::VERIFICADO
            . ", u." . UsuariosExtCols::WP_USER_ID
            . " FROM {$tp} p JOIN {$tu} u ON p." . PublicacionesCols::AUTOR_ID
            . " = u." . UsuariosExtCols::ID
            . " WHERE p." . PublicacionesCols::ID . " = :id",
            ['id' => $id]
        );
    }

    /*
     * Obtener publicación completa (autor + repost original + liked del usuario actual).
     * Misma estructura que listarFeed pero para 1 registro.
     */
    public static function obtenerConAutorCompleto(int $id, ?int $currentUserId = null): ?array
    {
        $tp = PublicacionesCols::TABLA;
        $tu = UsuariosExtCols::TABLA;
        $tl = LikesCols::TABLA;

        $params = ['id' => $id];

        $likedSubquery = $currentUserId
            ? ", (SELECT l." . LikesCols::REACCION . " FROM {$tl} l WHERE l." . LikesCols::TIPO . " = '" . LikesEnums::TIPO_PUBLICACION . "' AND l." . LikesCols::TARGET_ID . " = p." . PublicacionesCols::ID . " AND l." . LikesCols::USUARIO_ID . " = :current_user LIMIT 1) AS reaccion_usuario"
            : ", NULL AS reaccion_usuario";

        /* [183A-98] Subquery de repost del usuario actual */
        $reposteadoSubquery = $currentUserId
            ? ", EXISTS(SELECT 1 FROM {$tp} rp WHERE rp." . PublicacionesCols::AUTOR_ID . " = :current_user AND rp." . PublicacionesCols::REPOST_ID . " = p." . PublicacionesCols::ID . " AND rp." . PublicacionesCols::ELIMINADO_EN . " IS NULL) AS reposteado_por_mi"
            : ", FALSE AS reposteado_por_mi";

        if ($currentUserId) {
            $params['current_user'] = $currentUserId;
        }

        return static::consultarUno(
            "SELECT p.*, u." . UsuariosExtCols::USERNAME
            . ", u." . UsuariosExtCols::NOMBRE_VISIBLE
            . ", u." . UsuariosExtCols::AVATAR_URL
            . ", u." . UsuariosExtCols::VERIFICADO
            . ", u." . UsuariosExtCols::WP_USER_ID
            . " {$likedSubquery}"
            . " {$reposteadoSubquery}"
            . ", orig." . PublicacionesCols::ID . " AS orig_id"
            . ", orig." . PublicacionesCols::CONTENIDO . " AS orig_contenido"
            . ", orig." . PublicacionesCols::IMAGENES . " AS orig_imagenes"
            . ", orig." . PublicacionesCols::SAMPLES_ADJUNTOS . " AS orig_samples_adjuntos"
            . ", u_orig." . UsuariosExtCols::ID . " AS orig_autor_id"
            . ", u_orig." . UsuariosExtCols::USERNAME . " AS orig_username"
            . ", u_orig." . UsuariosExtCols::NOMBRE_VISIBLE . " AS orig_nombre_visible"
            . ", u_orig." . UsuariosExtCols::AVATAR_URL . " AS orig_avatar_url"
            . ", u_orig." . UsuariosExtCols::VERIFICADO . " AS orig_verificado"
            . ", u_orig." . UsuariosExtCols::WP_USER_ID . " AS orig_wp_user_id"
            . " FROM {$tp} p JOIN {$tu} u ON p." . PublicacionesCols::AUTOR_ID
            . " = u." . UsuariosExtCols::ID
            . " LEFT JOIN {$tp} orig ON p." . PublicacionesCols::REPOST_ID . " = orig." . PublicacionesCols::ID
            . " LEFT JOIN {$tu} u_orig ON orig." . PublicacionesCols::AUTOR_ID . " = u_orig." . UsuariosExtCols::ID
            . " WHERE p." . PublicacionesCols::ID . " = :id",
            $params
        );
    }

    /*
     * Buscar solo el autor_id de una publicación.
     */
    public static function buscarAutorId(int $id): ?int
    {
        $tabla = PublicacionesCols::TABLA;

        $row = static::consultarUno(
            "SELECT " . PublicacionesCols::AUTOR_ID . " FROM {$tabla} WHERE " . PublicacionesCols::ID . " = :id",
            ['id' => $id]
        );

        return $row ? (int) $row[PublicacionesCols::AUTOR_ID] : null;
    }

    /* [193A-47] Obtener autor_id y snippet de contenido para notificaciones descriptivas. */
    public static function buscarInfoNotificacion(int $id): ?array
    {
        $tabla = PublicacionesCols::TABLA;

        return static::consultarUno(
            "SELECT " . PublicacionesCols::AUTOR_ID . ", " . PublicacionesCols::CONTENIDO
            . " FROM {$tabla} WHERE " . PublicacionesCols::ID . " = :id",
            ['id' => $id]
        );
    }

    /*
     * Crear publicación nueva. Retorna ID generado.
     * $tipo y $moderacionEstado son opcionales: si no se pasan, la BD aplica defaults.
     */
    public static function crearPublicacion(
        int $autorId,
        string $contenido,
        string $imagenes,
        string $samplesAdjuntos,
        ?string $tipo = null,
        ?string $moderacionEstado = null
    ): int {
        $tabla = PublicacionesCols::TABLA;

        $columnas = PublicacionesCols::AUTOR_ID . ', ' . PublicacionesCols::CONTENIDO
            . ', ' . PublicacionesCols::IMAGENES . ', ' . PublicacionesCols::SAMPLES_ADJUNTOS;
        $valores = ':autor, :' . PublicacionesCols::CONTENIDO . ', :' . PublicacionesCols::IMAGENES . ', :samples';
        $params = [
            'autor' => $autorId,
            PublicacionesCols::CONTENIDO => $contenido,
            PublicacionesCols::IMAGENES => $imagenes,
            'samples' => $samplesAdjuntos,
        ];

        if ($tipo !== null) {
            $columnas .= ', ' . PublicacionesCols::TIPO;
            $valores .= ', :tipo';
            $params['tipo'] = $tipo;
        }

        if ($moderacionEstado !== null) {
            $columnas .= ', ' . PublicacionesCols::MODERACION_ESTADO;
            $valores .= ', :modEstado';
            $params['modEstado'] = $moderacionEstado;
        }

        return static::insertar(
            "INSERT INTO {$tabla} ({$columnas}) VALUES ({$valores}) RETURNING " . PublicacionesCols::ID,
            $params
        );
    }

    /*
     * Buscar publicación para edición/eliminación (id, autor_id).
     */
    public static function buscarParaEdicion(int $id): ?array
    {
        $tabla = PublicacionesCols::TABLA;

        return static::consultarUno(
            "SELECT " . PublicacionesCols::ID . ", " . PublicacionesCols::AUTOR_ID
            . " FROM {$tabla} WHERE " . PublicacionesCols::ID . " = :id",
            ['id' => $id]
        );
    }

    /*
     * Actualizar campos dinámicos de una publicación.
     */
    public static function actualizarCampos(int $id, array $clausulasSet, array $params): void
    {
        $tabla = PublicacionesCols::TABLA;
        $set = implode(', ', $clausulasSet);
        $params['id'] = $id;

        static::ejecutar(
            "UPDATE {$tabla} SET {$set} WHERE " . PublicacionesCols::ID . " = :id",
            $params
        );
    }

    /*
     * Forzar estado de moderación (para admin auto-approve).
     */
    public static function forzarModeracion(int $id, string $estado, string $razon = ''): void
    {
        $tabla = PublicacionesCols::TABLA;

        $params = ['id' => $id, 'estado' => $estado];
        $razonClause = '';
        if ($razon !== '') {
            $razonClause = ", " . PublicacionesCols::MODERACION_RAZON . " = :razon";
            $params['razon'] = $razon;
        }

        static::ejecutar(
            "UPDATE {$tabla} SET " . PublicacionesCols::MODERACION_ESTADO . " = :estado{$razonClause} WHERE " . PublicacionesCols::ID . " = :id",
            $params
        );
    }

    /*
     * Guardar metadata de imágenes analizadas por IA.
     */
    public static function guardarImagenesMetadata(int $id, string $metadataJson): void
    {
        $tabla = PublicacionesCols::TABLA;

        static::ejecutar(
            "UPDATE {$tabla} SET " . PublicacionesCols::IMAGENES_METADATA . " = :meta WHERE " . PublicacionesCols::ID . " = :id",
            ['meta' => $metadataJson, 'id' => $id]
        );
    }

    /*
     * Eliminar publicación con cascada manual (likes, comentarios).
     */
    public static function eliminarConCascada(int $id): void
    {
        $tl = LikesCols::TABLA;
        $tc = ComentariosCols::TABLA;
        $tabla = PublicacionesCols::TABLA;

        static::ejecutar(
            "DELETE FROM {$tl} WHERE " . LikesCols::TIPO . " = :tipoLike AND "
            . LikesCols::TARGET_ID . " = :id",
            ['id' => $id, 'tipoLike' => LikesEnums::TIPO_PUBLICACION]
        );
        static::ejecutar(
            "DELETE FROM {$tc} WHERE " . ComentariosCols::TIPO . " = :tipoComentario AND "
            . ComentariosCols::TARGET_ID . " = :id",
            ['id' => $id, 'tipoComentario' => ComentariosEnums::TIPO_PUBLICACION]
        );
        static::ejecutar(
            "DELETE FROM {$tabla} WHERE " . PublicacionesCols::ID . " = :id",
            ['id' => $id]
        );
    }

    /*
     * Recalcular total_comentarios de una publicación.
     */
    public static function recalcularComentarios(int $id): void
    {
        $tabla = PublicacionesCols::TABLA;
        $tc = ComentariosCols::TABLA;

        static::ejecutar(
            "UPDATE {$tabla} SET " . PublicacionesCols::TOTAL_COMENTARIOS
            . " = (SELECT COUNT(*) FROM {$tc} WHERE " . ComentariosCols::TIPO
            . " = :tipo AND " . ComentariosCols::TARGET_ID . " = :id)"
            . " WHERE " . PublicacionesCols::ID . " = :id",
            ['id' => $id, 'tipo' => ComentariosEnums::TIPO_PUBLICACION]
        );
    }

    /*
     * [183A-98] Crear repost de una publicación.
     * Inserta fila vacía con repost_id apuntando al original.
     * Validaciones: no permite self-repost, duplicados (ON CONFLICT), ni cadenas (solo originales).
     * Retorna id del repost creado, o null si ya existía (idempotente). */
    public static function crearRepost(int $autorId, int $repostId): ?int
    {
        $tabla = PublicacionesCols::TABLA;

        /* Verificar que la publicación original existe, no es un repost (evitar cadenas),
         * y no es del mismo autor (evitar self-repost) */
        $original = static::consultarUno(
            "SELECT " . PublicacionesCols::ID . ", " . PublicacionesCols::AUTOR_ID . ", "
            . PublicacionesCols::REPOST_ID . " FROM {$tabla} WHERE "
            . PublicacionesCols::ID . " = :id AND " . PublicacionesCols::ELIMINADO_EN . " IS NULL",
            ['id' => $repostId]
        );

        if (!$original) {
            throw new \RuntimeException('Publicación no encontrada');
        }
        if ((int) $original[PublicacionesCols::AUTOR_ID] === $autorId) {
            throw new \RuntimeException('No puedes repostear tu propio contenido');
        }
        if ($original[PublicacionesCols::REPOST_ID] !== null) {
            throw new \RuntimeException('Solo puedes repostear publicaciones originales');
        }

        /* ON CONFLICT DO NOTHING: si ya existe repost de este usuario, no duplica */
        $id = static::insertar(
            "INSERT INTO {$tabla} (" . PublicacionesCols::AUTOR_ID . ", " . PublicacionesCols::CONTENIDO
            . ", " . PublicacionesCols::REPOST_ID . ") VALUES (:autor, '', :repostId)"
            . " ON CONFLICT (autor_id, repost_id) WHERE repost_id IS NOT NULL DO NOTHING"
            . " RETURNING " . PublicacionesCols::ID,
            ['autor' => $autorId, 'repostId' => $repostId]
        );

        static::recalcularReposts($repostId);

        return $id;
    }

    /*
     * Eliminar repost de una publicación (quien reposteó lo quita).
     * Borra la fila "fantasma" con repost_id = $repostId y autor_id = $autorId.
     */
    public static function eliminarRepost(int $autorId, int $repostId): void
    {
        $tabla = PublicacionesCols::TABLA;

        static::ejecutar(
            "DELETE FROM {$tabla} WHERE " . PublicacionesCols::AUTOR_ID . " = :autor AND "
            . PublicacionesCols::REPOST_ID . " = :repostId",
            ['autor' => $autorId, 'repostId' => $repostId]
        );

        static::recalcularReposts($repostId);
    }

    /*
     * Recalcular total_reposts de una publicación contando filas hijas.
     */
    public static function recalcularReposts(int $id): void
    {
        $tabla = PublicacionesCols::TABLA;

        static::ejecutar(
            "UPDATE {$tabla} SET " . PublicacionesCols::TOTAL_REPOSTS
            . " = (SELECT COUNT(*) FROM {$tabla} WHERE " . PublicacionesCols::REPOST_ID . " = :id)"
            . " WHERE " . PublicacionesCols::ID . " = :id",
            ['id' => $id]
        );
    }

    /*
     * Actualizar estado y detalle JSON del veredicto de moderación IA.
     * Usado por ServicioModeracionIA tras analizar publicación.
     * C351: Ahora también guarda moderacion_razon extraída del veredicto.
     */
    public static function actualizarVeredictoModeracion(int $id, string $estado, string $detalle): void
    {
        $tabla = PublicacionesCols::TABLA;

        /* Extraer razón del JSON de detalle para guardarla en columna dedicada */
        $razon = '';
        $detalleDecoded = \json_decode($detalle, true);
        if (\json_last_error() === JSON_ERROR_NONE && isset($detalleDecoded['razon'])) {
            $razon = \mb_substr((string) $detalleDecoded['razon'], 0, 255);
        }

        static::ejecutar(
            "UPDATE {$tabla} SET "
                . PublicacionesCols::MODERACION_ESTADO . " = :estado, "
                . PublicacionesCols::MODERACION_DETALLE . " = :detalle, "
                . PublicacionesCols::MODERACION_RAZON . " = :" . PublicacionesCols::MODERACION_RAZON
                . " WHERE " . PublicacionesCols::ID . " = :id",
            ['estado' => $estado, 'detalle' => $detalle, PublicacionesCols::MODERACION_RAZON => $razon, 'id' => $id]
        );
    }
}
