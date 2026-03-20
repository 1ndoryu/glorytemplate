<?php
/**
 * AuthMiddleware — Kamples
 *
 * Verifica autenticación en endpoints protegidos de la API Kamples.
 * Soporta dos métodos:
 * 1. Nonce de WordPress (web, same-origin)
 * 2. JWT Bearer token (desktop Tauri, cross-origin)
 */

namespace App\Kamples\Auth;

use App\Config\Schema\_generated\UsuariosExtCols;
use App\Kamples\Api\Helpers\UsuarioHelper;
use App\Kamples\Services\ServicioBan;
use App\Kamples\Services\ServicioSuspension;

class AuthMiddleware
{
    /**
     * QK6: Registra filtro rest_authentication_errors para autenticar con JWT
     * ANTES de que rest_cookie_check_errors (prioridad 100) bloquee
     * requests con cookies pero sin nonce válido.
     *
     * Crítico para desktop (Tauri) donde:
     * 1. Login llama wp_set_auth_cookie() → el proxy Vite reenvía Set-Cookie al WebView
     * 2. Requests posteriores incluyen cookies + JWT Bearer
     * 3. Sin este filtro: WP ve cookies sin nonce → 401 inmediato
     *    (permission_callback con JWT fallback nunca se ejecuta)
     *
     * Prioridad 90 = antes de cookie check (100).
     */
    public static function registrarFiltroRestJwt(): void
    {
        add_filter('rest_authentication_errors', [self::class, 'autenticarRestConJwt'], 90);
    }

    /**
     * Callback del filtro rest_authentication_errors.
     * Si hay JWT válido → autentica y retorna true (skip cookie check).
     * Si no hay JWT → retorna null (dejar que cookies/nonce manejen auth).
     *
     * @param \WP_Error|true|null $result Resultado de filtros anteriores.
     * @return \WP_Error|true|null
     */
    public static function autenticarRestConJwt($result)
    {
        /* Si otro filtro ya manejó la auth, no interferir */
        if ($result !== null) {
            return $result;
        }

        $token = self::obtenerBearerToken();
        if (!$token) {
            return null;
        }

        $wpUserId = JwtService::validar($token);
        if (!$wpUserId) {
            return new \WP_Error(
                'jwt_invalid',
                'Token de autenticación inválido o expirado',
                ['status' => 401]
            );
        }

        $wpUser = get_userdata($wpUserId);
        if (!$wpUser) {
            return new \WP_Error(
                'jwt_user_not_found',
                'Usuario no encontrado',
                ['status' => 401]
            );
        }

        /* JWT válido → establecer usuario WP y marcar auth como resuelta.
         * Retornar true impide que rest_cookie_check_errors bloquee el request. */
        wp_set_current_user($wpUserId);
        return true;
    }

    /**
     * Permission callback para endpoints que requieren autenticación.
     * Acepta tanto nonce WP como JWT Bearer token.
     */
    public static function requerirAuth(): bool
    {
        /* Primero intentar con sesión WP clásica (nonce) */
        $userId = get_current_user_id();

        /* Si no hay sesión WP, intentar JWT en header Authorization */
        if (!$userId) {
            $userId = self::autenticarConJwt();
        }

        return $userId > 0;
    }

    /**
     * Permission callback para endpoints que requieren ser creador.
     * Verifica que el usuario tenga rol 'creador' o 'admin' en usuarios_ext.
     */
    public static function requerirCreador(): bool
    {
        if (!self::requerirAuth()) {
            return false;
        }

        $usuario = UsuarioHelper::obtenerPorWpId(get_current_user_id());
        if (!$usuario) return false;

        $rol = $usuario[UsuariosExtCols::ROL] ?? 'usuario';
        return in_array($rol, ['creador', 'admin'], true);
    }

    /**
     * Permission callback para endpoints que requieren plan pro o premium.
     * Verifica el campo plan en usuarios_ext.
     */
    public static function requerirPlanPro(): bool
    {
        if (!self::requerirAuth()) {
            return false;
        }

        $usuario = UsuarioHelper::obtenerPorWpId(get_current_user_id());
        if (!$usuario) return false;

        $plan = $usuario[UsuariosExtCols::PLAN] ?? 'free';
        return in_array($plan, ['pro', 'premium'], true);
    }

    /**
     * Permission callback para endpoints de admin.
     */
    public static function requerirAdmin(): bool
    {
        return current_user_can('manage_options');
    }

    /**
     * Obtiene el ID de WordPress del usuario autenticado actual.
     * Si no hay sesión WP (ej: desktop Tauri), intenta validar JWT del header
     * Authorization para establecer el contexto del usuario.
     * Esto es necesario en endpoints públicos donde requerirAuth() no se invoca.
     */
    public static function obtenerWpUserId(): int
    {
        $userId = get_current_user_id();

        /* En desktop/Tauri no hay cookies WP; el JWT viene en Authorization header.
         * Para endpoints públicos (permission_callback => __return_true) como /feed,
         * requerirAuth() nunca se llama, así que autenticarConJwt() nunca establece
         * wp_set_current_user(). Lo hacemos aquí para que obtenerIdPg() funcione. */
        if (!$userId) {
            $userId = self::autenticarConJwt();
        }

        return $userId;
    }

    /**
     * Obtiene datos básicos del usuario WP autenticado.
     * Retorna null si no hay sesión.
     */
    public static function obtenerUsuarioActual(): ?array
    {
        $userId = get_current_user_id();
        if (!$userId) {
            return null;
        }

        $wpUser = get_userdata($userId);
        if (!$wpUser) {
            return null;
        }

        return [
            'wp_user_id' => $userId,
            'email' => $wpUser->user_email,
            'display_name' => $wpUser->display_name,
            'username' => $wpUser->user_login,
            /* [193A-92] No usar Gravatar — frontend muestra iniciales si null */
            'avatar_url' => null,
        ];
    }

    /**
     * QQ71: Verificación unificada de cuenta activa — ban + suspensión.
     * Reemplaza las llamadas individuales a verificarBanActivo() y verificarSuspensionActiva().
     * Todos los endpoints de escritura DEBEN llamar este método al inicio.
     * Retorna null si la cuenta está en buen estado, o WP_REST_Response 403 si no.
     */
    public static function verificarCuentaActiva(int $pgUserId): ?\WP_REST_Response
    {
        /* Primero: ban temporal (más prioritario, tiene fecha de fin específica) */
        $banResp = self::verificarBanActivo($pgUserId);
        if ($banResp) return $banResp;

        /* Segundo: suspensión de cuenta (auto-suspensión por reportes, admin, eliminación) */
        $suspResp = self::verificarSuspensionActiva($pgUserId);
        if ($suspResp) return $suspResp;

        return null;
    }

    /**
     * C132: Verifica si el usuario PG está baneado y retorna WP_REST_Response 403 si lo está.
     * Retorna null si no hay ban activo. Usar verificarCuentaActiva() en su lugar para check completo.
     */
    public static function verificarBanActivo(int $pgUserId): ?\WP_REST_Response
    {
        $infoBan = ServicioBan::verificarBan($pgUserId);
        if (!$infoBan) {
            return null;
        }

        return new \WP_REST_Response([
            'code' => 'usuario_baneado',
            'message' => 'Tu cuenta está temporalmente restringida',
            'baneadoHasta' => $infoBan['baneadoHasta'],
            'razon' => $infoBan['razon'],
        ], 403);
    }

    /**
     * QQ65: Verifica si el usuario PG está suspendido o en proceso de eliminación.
     * Retorna WP_REST_Response 403 con datos de suspensión, o null si la cuenta está activa.
     * El frontend usa el code 'usuario_suspendido' para mostrar el overlay de suspensión.
     * Usar verificarCuentaActiva() en su lugar para check completo.
     */
    public static function verificarSuspensionActiva(int $pgUserId): ?\WP_REST_Response
    {
        $infoSuspension = ServicioSuspension::verificarSuspension($pgUserId);
        if (!$infoSuspension) {
            return null;
        }

        return new \WP_REST_Response([
            'code' => 'usuario_suspendido',
            'message' => 'Tu cuenta está suspendida',
            'estado' => $infoSuspension['estado'],
            'suspendidoHasta' => $infoSuspension['suspendidoHasta'],
            'razon' => $infoSuspension['razon'],
            'seraEliminadoEn' => $infoSuspension['seraEliminadoEn'],
        ], 403);
    }

    /**
     * Intenta autenticar usando JWT Bearer token del header Authorization.
     * Si es válido, establece el usuario WP para que get_current_user_id() funcione.
     * Retorna el WP user ID o 0 si falla.
     */
    private static function autenticarConJwt(): int
    {
        $header = self::obtenerBearerToken();
        if (!$header) {
            return 0;
        }

        $wpUserId = JwtService::validar($header);
        if (!$wpUserId) {
            return 0;
        }

        /* Verificar que el usuario WP existe */
        $wpUser = get_userdata($wpUserId);
        if (!$wpUser) {
            return 0;
        }

        /* Establecer contexto WP para que el resto del request funcione igual */
        wp_set_current_user($wpUserId);

        return $wpUserId;
    }

    /**
     * Extrae el token JWT del request.
     *
     * Busca en múltiples fuentes porque algunos servidores (nginx + PHP-FPM,
     * Local by Flywheel) no pasan el header Authorization a $_SERVER.
     * Orden de prioridad:
     *   1. $_SERVER['HTTP_AUTHORIZATION'] (estándar)
     *   2. $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] (Apache mod_rewrite)
     *   3. $_SERVER['HTTP_X_KAMPLES_AUTH'] (header custom — siempre pasa en nginx)
     *   4. getallheaders() / apache_request_headers() (PHP 8+ en todos los SAPIs)
     */
    private static function obtenerBearerToken(): ?string
    {
        $authHeader = '';

        if (!empty($_SERVER['HTTP_AUTHORIZATION'])) {
            $authHeader = sanitize_text_field($_SERVER['HTTP_AUTHORIZATION']);
        } elseif (!empty($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
            /* Apache con mod_rewrite a veces mueve el header aquí */
            $authHeader = sanitize_text_field($_SERVER['REDIRECT_HTTP_AUTHORIZATION']);
        } elseif (!empty($_SERVER['HTTP_X_KAMPLES_AUTH'])) {
            /* Header custom del desktop — nginx no filtra headers custom,
             * solo Authorization puede ser problemático en ciertos entornos.
             * Este es el fallback fiable para Tauri + Local by Flywheel. */
            $authHeader = sanitize_text_field($_SERVER['HTTP_X_KAMPLES_AUTH']);
        }

        /* Último recurso: getallheaders (PHP 8+ funciona en todos los SAPIs) */
        if (empty($authHeader) && function_exists('getallheaders')) {
            $headers = getallheaders();
            /* Normalizar claves a lowercase para comparación robusta */
            $headersLower = array_change_key_case($headers, CASE_LOWER);
            $authHeader = $headersLower['authorization']
                ?? $headersLower['x-kamples-auth']
                ?? '';
        }

        if (empty($authHeader)) {
            return null;
        }

        /* Formato esperado: "Bearer {token}" */
        if (preg_match('/^Bearer\s+(.+)$/i', $authHeader, $matches)) {
            return trim($matches[1]);
        }

        return null;
    }
}
