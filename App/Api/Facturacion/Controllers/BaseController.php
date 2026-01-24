<?php

namespace App\Api\Facturacion\Controllers;

use WP_REST_Response;

abstract class BaseController
{
    /**
     * Helper para validación de argumentos ID
     */
    protected static function validarIdArg(): array
    {
        return [
            'id' => [
                'validate_callback' => function ($param) {
                    return is_numeric($param) && $param > 0;
                },
            ],
        ];
    }

    /**
     * Helpers de permisos comunes
     */
    public static function estaAutenticado(): bool
    {
        return is_user_logged_in();
    }

    public static function esAdmin(): bool
    {
        return current_user_can('manage_options');
    }

    /**
     * Respuesta de éxito estandarizada
     */
    protected static function success($data = null, int $status = 200, string $message = ''): WP_REST_Response
    {
        $response = ['success' => true];
        if ($data !== null) $response['data'] = $data;
        if ($message) $response['message'] = $message;

        return new WP_REST_Response($response, $status);
    }

    /**
     * Respuesta de error estandarizada
     */
    protected static function error(string $message, int $status = 400): WP_REST_Response
    {
        return new WP_REST_Response([
            'success' => false,
            'message' => $message
        ], $status);
    }
}
