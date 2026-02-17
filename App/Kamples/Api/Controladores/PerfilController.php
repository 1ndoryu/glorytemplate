<?php

/**
 * PerfilController — Endpoints de perfil de usuario.
 *
 * GET  /perfil/{username}  — Perfil público
 * GET  /me                 — Usuario autenticado actual
 * PUT  /me                 — Actualizar perfil
 *
 * @package Kamples
 */

namespace App\Kamples\Api\Controladores;

use App\Kamples\Database\PostgresService;
use App\Kamples\Auth\AuthMiddleware;
use App\Kamples\Api\Helpers\RateLimiter;
use App\Kamples\Api\Helpers\Validador;
use App\Kamples\Api\Helpers\UsuarioHelper;

class PerfilController
{
    public static function registrarRutas(string $namespace): void
    {
        register_rest_route($namespace, '/perfil/(?P<username>[a-zA-Z0-9_-]+)', [
            'methods'             => 'GET',
            'callback'            => [self::class, 'obtenerPerfil'],
            'permission_callback' => '__return_true',
            'args'                => [
                'username' => ['required' => true, 'type' => 'string', 'sanitize_callback' => 'sanitize_user'],
            ],
        ]);

        register_rest_route($namespace, '/me', [
            'methods'             => 'GET',
            'callback'            => [self::class, 'usuarioActual'],
            'permission_callback' => [AuthMiddleware::class, 'requerirAuth'],
        ]);

        register_rest_route($namespace, '/me', [
            'methods'             => 'PUT',
            'callback'            => [self::class, 'actualizarPerfil'],
            'permission_callback' => [AuthMiddleware::class, 'requerirAuth'],
        ]);

        register_rest_route($namespace, '/me/avatar', [
            'methods'             => 'POST',
            'callback'            => [self::class, 'subirAvatar'],
            'permission_callback' => [AuthMiddleware::class, 'requerirAuth'],
        ]);
    }

    /**
     * GET /perfil/{username} — Perfil público.
     */
    public static function obtenerPerfil(\WP_REST_Request $request): \WP_REST_Response
    {
        $username = $request->get_param('username');

        $perfil = PostgresService::consultarUno(
            "SELECT id, wp_user_id, username, nombre_visible, bio, avatar_url, portada_url,
                    plan, verificado, total_seguidores, total_seguidos,
                    total_samples, total_descargas, created_at
             FROM usuarios_ext WHERE username = :username",
            ['username' => $username]
        );

        if ($perfil === null) {
            return new \WP_REST_Response(['code' => 'perfil_no_encontrado', 'message' => 'El usuario no existe.'], 404);
        }

        /* Normalizar a camelCase — C193: fallback avatar via WP */
        $normalizado = [
            'id'              => (int) $perfil['id'],
            'username'        => $perfil['username'],
            'nombreVisible'   => $perfil['nombre_visible'] ?? '',
            'bio'             => $perfil['bio'] ?? '',
            'avatarUrl'       => UsuarioHelper::resolverAvatarUrl($perfil['avatar_url'] ?? null, (int) ($perfil['wp_user_id'] ?? 0)),
            'portadaUrl'      => $perfil['portada_url'] ?? null,
            'plan'            => $perfil['plan'] ?? 'free',
            'verificado'      => (bool) ($perfil['verificado'] ?? false),
            'totalSeguidores' => (int) ($perfil['total_seguidores'] ?? 0),
            'totalSeguidos'   => (int) ($perfil['total_seguidos'] ?? 0),
            'totalSamples'    => (int) ($perfil['total_samples'] ?? 0),
            'totalDescargas'  => (int) ($perfil['total_descargas'] ?? 0),
            'creadoAt'        => $perfil['created_at'] ?? '',
        ];

        /* Verificar si el usuario autenticado sigue a este perfil */
        $currentWp = AuthMiddleware::obtenerUsuarioActual();
        if ($currentWp) {
            $currentPg = PostgresService::consultarUno(
                "SELECT id FROM usuarios_ext WHERE wp_user_id = :wpId",
                ['wpId' => $currentWp['wp_user_id']]
            );
            if ($currentPg && (int) $currentPg['id'] !== $normalizado['id']) {
                $seguimiento = PostgresService::consultarUno(
                    "SELECT 1 FROM follows WHERE seguidor_id = :seguidorId AND seguido_id = :seguidoId",
                    ['seguidorId' => (int) $currentPg['id'], 'seguidoId' => $normalizado['id']]
                );
                $normalizado['siguiendo'] = $seguimiento !== null;
            }
        }

        return new \WP_REST_Response(['data' => $normalizado], 200);
    }

    /**
     * GET /me — Usuario autenticado actual con auto-creación.
     */
    public static function usuarioActual(): \WP_REST_Response
    {
        $wpUser = AuthMiddleware::obtenerUsuarioActual();
        if (!$wpUser) {
            return new \WP_REST_Response(['code' => 'no_auth', 'message' => 'No autenticado'], 401);
        }

        $ext = PostgresService::consultarUno(
            "SELECT * FROM usuarios_ext WHERE wp_user_id = :wpId",
            ['wpId' => $wpUser['wp_user_id']]
        );

        /*
         * Sincronizar avatar_url desde WP solo si el usuario no tiene un avatar custom.
         * Un avatar custom es cualquier URL que apunte a wp-content/uploads/kamples/avatars/.
         */
        $tieneAvatarCustom = $ext && !empty($ext['avatar_url'])
            && str_contains($ext['avatar_url'], 'kamples/avatars/');

        if ($ext && !$tieneAvatarCustom && !empty($wpUser['avatar_url'])
            && ($ext['avatar_url'] ?? '') !== $wpUser['avatar_url']) {
            PostgresService::ejecutar(
                "UPDATE usuarios_ext SET avatar_url = :avatar, updated_at = NOW() WHERE wp_user_id = :wpId",
                ['avatar' => $wpUser['avatar_url'], 'wpId' => $wpUser['wp_user_id']]
            );
            $ext['avatar_url'] = $wpUser['avatar_url'];
        }

        /* Auto-crear registro si no existe en Postgres */
        if (!$ext) {
            $id = PostgresService::insertar(
                "INSERT INTO usuarios_ext (wp_user_id, username, nombre_visible, email, avatar_url)
                 VALUES (:wpId, :username, :nombre, :email, :avatar)
                 RETURNING id",
                [
                    'wpId'     => $wpUser['wp_user_id'],
                    'username' => $wpUser['username'],
                    'nombre'   => $wpUser['display_name'],
                    'email'    => $wpUser['email'],
                    'avatar'   => $wpUser['avatar_url'],
                ]
            );

            $ext = PostgresService::consultarUno(
                "SELECT * FROM usuarios_ext WHERE id = :id",
                ['id' => $id]
            );
        }

        /* Normalizar a camelCase para el frontend */
        $datos = array_merge($wpUser, $ext ?? []);

        /*
         * Si el usuario WP tiene rol 'administrator', forzar rol='admin'
         * aunque en la BD esté como 'usuario'. Esto asegura que el frontend
         * vea herramientas admin como BotonExperimentos y BotonDevTools.
         */
        $wpUserObj = \get_userdata($wpUser['wp_user_id']);
        if ($wpUserObj && \in_array('administrator', $wpUserObj->roles, true)) {
            $datos['rol'] = 'admin';
        }

        $normalizado = self::normalizarUsuario($datos);

        return new \WP_REST_Response(['data' => $normalizado], 200);
    }

    /**
     * Convierte las keys snake_case de BD a camelCase esperado por el frontend.
     * C193: fallback a WP Gravatar si avatar_url es null en BD.
     */
    private static function normalizarUsuario(array $datos): array
    {
        $avatarUrl = $datos['avatar_url'] ?? null;
        if (!$avatarUrl && !empty($datos['wp_user_id'])) {
            $avatarUrl = get_avatar_url((int) $datos['wp_user_id'], ['size' => 256]) ?: null;
        }

        return [
            'id'               => (int) ($datos['id'] ?? 0),
            'wpUserId'         => (int) ($datos['wp_user_id'] ?? 0),
            'username'         => $datos['username'] ?? '',
            'email'            => $datos['email'] ?? '',
            'nombreVisible'    => $datos['nombre_visible'] ?? $datos['display_name'] ?? '',
            'bio'              => $datos['bio'] ?? '',
            'avatarUrl'        => $avatarUrl,
            'portadaUrl'       => $datos['portada_url'] ?? null,
            'plan'             => $datos['plan'] ?? 'free',
            'rol'              => $datos['rol'] ?? 'usuario',
            'verificado'       => (bool) ($datos['verificado'] ?? false),
            'totalSeguidores'  => (int) ($datos['total_seguidores'] ?? 0),
            'totalSeguidos'    => (int) ($datos['total_seguidos'] ?? 0),
            'totalSamples'     => (int) ($datos['total_samples'] ?? 0),
            'totalDescargas'   => (int) ($datos['total_descargas'] ?? 0),
            'stripeCustomerId' => $datos['stripe_customer_id'] ?? null,
            'stripeConnectId'  => $datos['stripe_connect_id'] ?? null,
            'creadoAt'         => $datos['created_at'] ?? '',
            'actualizadoAt'    => $datos['updated_at'] ?? '',
            'descargasHoy'     => (int) ($datos['descargas_hoy'] ?? 0),
            'limiteDescargas'  => (int) ($datos['limite_descargas'] ?? 5),
            'subidasEsteMes'   => (int) ($datos['subidas_este_mes'] ?? 0),
            'limiteSubidas'    => (int) ($datos['limite_subidas'] ?? -1),
            'mensajesHoy'      => (int) ($datos['mensajes_hoy'] ?? 0),
            'limiteMensajes'   => (int) ($datos['limite_mensajes'] ?? -1),
        ];
    }

    /**
     * PUT /me — Actualizar perfil.
     */
    public static function actualizarPerfil(\WP_REST_Request $request): \WP_REST_Response
    {
        $wpUserId = AuthMiddleware::obtenerWpUserId();
        $body = $request->get_json_params();

        /* C164: Rate limit — 10 actualizaciones de perfil por hora */
        $limitResp = RateLimiter::verificarIp('actualizar_perfil', 10, 3600);
        if ($limitResp) return $limitResp;

        /* C164: Validaciones de longitud antes de procesar */
        $nombre = $body['nombreVisible'] ?? $body['nombreDisplay'] ?? null;
        if ($nombre !== null) {
            $errorNombre = Validador::validarLongitud($nombre, Validador::MAX_NOMBRE_VISIBLE, 'El nombre');
            if ($errorNombre) return Validador::respuestaError($errorNombre);
        }
        if (isset($body['username'])) {
            $errorUsername = Validador::validarUsername($body['username']);
            if ($errorUsername) return new \WP_REST_Response(['ok' => false, 'error' => $errorUsername], 400);
        }
        if (isset($body['bio'])) {
            $errorBio = Validador::validarLongitud($body['bio'], Validador::MAX_BIO, 'La bio');
            if ($errorBio) return Validador::respuestaError($errorBio);
        }

        $campos = [];
        $params = ['wpId' => $wpUserId];

        /* Acepta nombreVisible o nombreDisplay (compatibilidad) */
        if ($nombre !== null) {
            $campos[] = 'nombre_visible = :nombre';
            $params['nombre'] = sanitize_text_field($nombre);
        }
        if (isset($body['username'])) {
            $campos[] = 'username = :username';
            $params['username'] = sanitize_user($body['username']);
        }
        if (isset($body['bio'])) {
            $campos[] = 'bio = :bio';
            $params['bio'] = sanitize_textarea_field($body['bio']);
        }
        if (isset($body['portadaUrl'])) {
            $campos[] = 'portada_url = :portada';
            $params['portada'] = esc_url_raw($body['portadaUrl']);
        }
        if (isset($body['avatarUrl'])) {
            $campos[] = 'avatar_url = :avatar';
            $params['avatar'] = esc_url_raw($body['avatarUrl']);
        }

        if (empty($campos)) {
            return new \WP_REST_Response(['code' => 'sin_cambios', 'message' => 'No hay datos para actualizar'], 400);
        }

        $setSQL = implode(', ', $campos);
        PostgresService::ejecutar(
            "UPDATE usuarios_ext SET {$setSQL}, updated_at = NOW() WHERE wp_user_id = :wpId",
            $params
        );

        /* Devolver el perfil actualizado completo */
        $wpUser = AuthMiddleware::obtenerUsuarioActual();
        $ext = PostgresService::consultarUno(
            "SELECT * FROM usuarios_ext WHERE wp_user_id = :wpId",
            ['wpId' => $wpUserId]
        );
        $normalizado = self::normalizarUsuario(array_merge($wpUser ?? [], $ext ?? []));

        return new \WP_REST_Response(['data' => $normalizado, 'ok' => true, 'message' => 'Perfil actualizado'], 200);
    }

    /**
     * POST /me/avatar — Subir imagen de perfil.
     * Acepta FormData con campo 'avatar' (imagen).
     * Guarda en wp-content/uploads/kamples/avatars/{userId}/
     */
    public static function subirAvatar(\WP_REST_Request $request): \WP_REST_Response
    {
        $wpUserId = AuthMiddleware::obtenerWpUserId();
        $files = $request->get_file_params();

        if (empty($files['avatar'])) {
            return new \WP_REST_Response([
                'code' => 'sin_archivo',
                'message' => 'No se recibió ninguna imagen.',
            ], 400);
        }

        $uploaded = $files['avatar'];

        /* Verificar que PHP no reportó error en la subida */
        if (($uploaded['error'] ?? UPLOAD_ERR_OK) !== UPLOAD_ERR_OK) {
            return new \WP_REST_Response([
                'code' => 'error_subida',
                'message' => 'Error al recibir el archivo. Código: ' . ($uploaded['error'] ?? 'desconocido'),
            ], 400);
        }

        /* Validar tipo MIME */
        $tiposPermitidos = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        $mimeReal = \mime_content_type($uploaded['tmp_name']);
        if (!in_array($mimeReal, $tiposPermitidos, true)) {
            return new \WP_REST_Response([
                'code' => 'tipo_invalido',
                'message' => 'Solo se permiten imágenes (JPEG, PNG, WebP, GIF).',
            ], 400);
        }

        /* Validar tamaño (máx 5MB) */
        if ($uploaded['size'] > 5 * 1024 * 1024) {
            return new \WP_REST_Response([
                'code' => 'archivo_muy_grande',
                'message' => 'La imagen no puede superar 5 MB.',
            ], 400);
        }

        /* Directorio de destino */
        $uploadDir = \wp_upload_dir();
        $avatarDir = $uploadDir['basedir'] . '/kamples/avatars/' . $wpUserId;
        if (!\file_exists($avatarDir)) {
            \wp_mkdir_p($avatarDir);
        }

        /* Generar nombre único */
        $ext = \pathinfo($uploaded['name'], PATHINFO_EXTENSION) ?: 'jpg';
        $nombre = 'avatar_' . time() . '.' . $ext;
        $rutaFinal = $avatarDir . '/' . $nombre;

        /* Mover archivo */
        if (!\move_uploaded_file($uploaded['tmp_name'], $rutaFinal)) {
            return new \WP_REST_Response([
                'code' => 'error_subida',
                'message' => 'No se pudo guardar la imagen.',
            ], 500);
        }

        /* Construir URL pública */
        $avatarUrl = $uploadDir['baseurl'] . '/kamples/avatars/' . $wpUserId . '/' . $nombre;

        /* Actualizar en BD */
        PostgresService::ejecutar(
            "UPDATE usuarios_ext SET avatar_url = :avatar, updated_at = NOW() WHERE wp_user_id = :wpId",
            ['avatar' => $avatarUrl, 'wpId' => $wpUserId]
        );

        /* Devolver perfil completo actualizado */
        $wpUser = AuthMiddleware::obtenerUsuarioActual();
        $extData = PostgresService::consultarUno(
            "SELECT * FROM usuarios_ext WHERE wp_user_id = :wpId",
            ['wpId' => $wpUserId]
        );
        $normalizado = self::normalizarUsuario(array_merge($wpUser ?? [], $extData ?? []));

        return new \WP_REST_Response([
            'ok'   => true,
            'data' => $normalizado,
            'avatarUrl' => $avatarUrl,
        ], 200);
    }
}
