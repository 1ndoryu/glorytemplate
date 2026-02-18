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

use App\Kamples\Auth\AuthMiddleware;
use App\Kamples\Api\Helpers\RateLimiter;
use App\Kamples\Api\Helpers\Validador;
use App\Kamples\Api\Helpers\UsuarioHelper;
use App\Config\Schema\_generated\UsuariosExtCols;
use App\Kamples\Database\Repositories\UsuariosExtRepository;
use App\Kamples\Database\Repositories\FollowsRepository;

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

        $perfil = UsuariosExtRepository::buscarPerfilPublico($username);

        if ($perfil === null) {
            return new \WP_REST_Response(['code' => 'perfil_no_encontrado', 'message' => 'El usuario no existe.'], 404);
        }

        /* Normalizar a camelCase — C193: fallback avatar via WP */
        $normalizado = [
            'id'              => (int) $perfil[UsuariosExtCols::ID],
            'username'        => $perfil[UsuariosExtCols::USERNAME],
            'nombreVisible'   => $perfil[UsuariosExtCols::NOMBRE_VISIBLE] ?? '',
            'bio'             => $perfil[UsuariosExtCols::BIO] ?? '',
            'avatarUrl'       => UsuarioHelper::resolverAvatarUrl($perfil[UsuariosExtCols::AVATAR_URL] ?? null, (int) ($perfil[UsuariosExtCols::WP_USER_ID] ?? 0)),
            'portadaUrl'      => $perfil[UsuariosExtCols::PORTADA_URL] ?? null,
            'plan'            => $perfil[UsuariosExtCols::PLAN] ?? 'free',
            'verificado'      => (bool) ($perfil[UsuariosExtCols::VERIFICADO] ?? false),
            'totalSeguidores' => (int) ($perfil[UsuariosExtCols::TOTAL_SEGUIDORES] ?? 0),
            'totalSeguidos'   => (int) ($perfil[UsuariosExtCols::TOTAL_SEGUIDOS] ?? 0),
            'totalSamples'    => (int) ($perfil[UsuariosExtCols::TOTAL_SAMPLES] ?? 0),
            'totalDescargas'  => (int) ($perfil[UsuariosExtCols::TOTAL_DESCARGAS] ?? 0),
            'creadoAt'        => $perfil[UsuariosExtCols::CREATED_AT] ?? '',
        ];

        /* Verificar si el usuario autenticado sigue a este perfil */
        $currentWp = AuthMiddleware::obtenerUsuarioActual();
        if ($currentWp) {
            $currentPgId = UsuariosExtRepository::obtenerIdPorWpId($currentWp['wp_user_id']);
            if ($currentPgId && $currentPgId !== $normalizado['id']) {
                $normalizado['siguiendo'] = FollowsRepository::estaSiguiendo($currentPgId, $normalizado['id']);
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

        $ext = UsuariosExtRepository::buscarPorWpId($wpUser['wp_user_id']);

        /*
         * Sincronizar avatar_url desde WP solo si el usuario no tiene un avatar custom.
         * Un avatar custom es cualquier URL que apunte a wp-content/uploads/kamples/avatars/.
         */
        $tieneAvatarCustom = $ext && !empty($ext[UsuariosExtCols::AVATAR_URL])
            && str_contains($ext[UsuariosExtCols::AVATAR_URL], 'kamples/avatars/');

        if ($ext && !$tieneAvatarCustom && !empty($wpUser['avatar_url'])
            && ($ext[UsuariosExtCols::AVATAR_URL] ?? '') !== $wpUser['avatar_url']) {
            UsuariosExtRepository::actualizarAvatar($wpUser['wp_user_id'], $wpUser['avatar_url']);
            $ext[UsuariosExtCols::AVATAR_URL] = $wpUser['avatar_url'];
        }

        /* Auto-crear registro si no existe en Postgres */
        if (!$ext) {
            $id = UsuariosExtRepository::crearDesdeWP($wpUser);
            $ext = UsuariosExtRepository::buscarPorId($id);
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
        $avatarUrl = $datos[UsuariosExtCols::AVATAR_URL] ?? null;
        if (!$avatarUrl && !empty($datos[UsuariosExtCols::WP_USER_ID])) {
            $avatarUrl = get_avatar_url((int) $datos[UsuariosExtCols::WP_USER_ID], ['size' => 256]) ?: null;
        }

        return [
            'id'               => (int) ($datos[UsuariosExtCols::ID] ?? 0),
            'wpUserId'         => (int) ($datos[UsuariosExtCols::WP_USER_ID] ?? 0),
            'username'         => $datos[UsuariosExtCols::USERNAME] ?? '',
            'email'            => $datos[UsuariosExtCols::EMAIL] ?? '',
            'nombreVisible'    => $datos[UsuariosExtCols::NOMBRE_VISIBLE] ?? $datos['display_name'] ?? '',
            'bio'              => $datos[UsuariosExtCols::BIO] ?? '',
            'avatarUrl'        => $avatarUrl,
            'portadaUrl'       => $datos[UsuariosExtCols::PORTADA_URL] ?? null,
            'plan'             => $datos[UsuariosExtCols::PLAN] ?? 'free',
            'rol'              => $datos[UsuariosExtCols::ROL] ?? 'usuario',
            'verificado'       => (bool) ($datos[UsuariosExtCols::VERIFICADO] ?? false),
            'totalSeguidores'  => (int) ($datos[UsuariosExtCols::TOTAL_SEGUIDORES] ?? 0),
            'totalSeguidos'    => (int) ($datos[UsuariosExtCols::TOTAL_SEGUIDOS] ?? 0),
            'totalSamples'     => (int) ($datos[UsuariosExtCols::TOTAL_SAMPLES] ?? 0),
            'totalDescargas'   => (int) ($datos[UsuariosExtCols::TOTAL_DESCARGAS] ?? 0),
            'stripeCustomerId' => $datos[UsuariosExtCols::STRIPE_CUSTOMER_ID] ?? null,
            'stripeConnectId'  => $datos[UsuariosExtCols::STRIPE_CONNECT_ID] ?? null,
            'creadoAt'         => $datos[UsuariosExtCols::CREATED_AT] ?? '',
            'actualizadoAt'    => $datos[UsuariosExtCols::UPDATED_AT] ?? '',
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

        UsuariosExtRepository::actualizarPerfil($campos, $params);

        /* Devolver el perfil actualizado completo */
        $wpUser = AuthMiddleware::obtenerUsuarioActual();
        $ext = UsuariosExtRepository::buscarPorWpId($wpUserId);
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
        UsuariosExtRepository::actualizarAvatar($wpUserId, $avatarUrl);

        /* Devolver perfil completo actualizado */
        $wpUser = AuthMiddleware::obtenerUsuarioActual();
        $extData = UsuariosExtRepository::buscarPorWpId($wpUserId);
        $normalizado = self::normalizarUsuario(array_merge($wpUser ?? [], $extData ?? []));

        return new \WP_REST_Response([
            'ok'   => true,
            'data' => $normalizado,
            'avatarUrl' => $avatarUrl,
        ], 200);
    }
}
