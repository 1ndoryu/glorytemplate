<?php

/**
 * Trait ConCallbackSeguro
 * Centraliza el patrón callbackSeguro que envuelve métodos de endpoint en
 * try-catch con respuesta 500 genérica. Antes estaba duplicado en 11 clases.
 *
 * @package Glory\App\Api\Traits
 */

namespace Glory\App\Api\Traits;

trait ConCallbackSeguro
{
    /**
     * Envuelve un método de endpoint en try-catch para capturar errores.
     * Si el método retorna WP_REST_Response lo devuelve directo;
     * cualquier otro valor se envuelve en new WP_REST_Response.
     * En caso de excepción: logea con la etiqueta de la clase y retorna 500 genérico.
     */
    public function callbackSeguro(string $metodo): callable
    {
        return function (\WP_REST_Request $request) use ($metodo): \WP_REST_Response {
            try {
                $respuesta = $this->{$metodo}($request);
                if ($respuesta instanceof \WP_REST_Response) {
                    return $respuesta;
                }

                return new \WP_REST_Response($respuesta);
            } catch (\Throwable $error) {
                $etiqueta = $this->obtenerEtiquetaLog();
                error_log("[{$etiqueta}] Error en {$metodo}: " . $error->getMessage());
                return new \WP_REST_Response(['error' => 'Error interno del servidor'], 500);
            }
        };
    }

    /**
     * Verifica que el usuario actual tenga permisos CAP (cap_admin o administrator).
     */
    public function verificarPermisos(): bool
    {
        if (!is_user_logged_in()) {
            return false;
        }

        $user = wp_get_current_user();
        return in_array('cap_admin', $user->roles, true)
            || in_array('administrator', $user->roles, true);
    }

    /**
     * Verifica que el usuario actual sea administrador de WordPress.
     */
    public function verificarPermisosAdmin(): bool
    {
        if (!is_user_logged_in()) {
            return false;
        }

        $user = wp_get_current_user();
        return in_array('administrator', $user->roles, true);
    }

    /**
     * Etiqueta para logs. Las clases que usen el trait pueden sobreescribirla.
     */
    protected function obtenerEtiquetaLog(): string
    {
        /* Genera etiqueta automática a partir del nombre de la clase sin namespace */
        $className = (new \ReflectionClass($this))->getShortName();
        return 'CAP REST ' . str_replace(['Cap', 'Endpoints'], '', $className);
    }
}
