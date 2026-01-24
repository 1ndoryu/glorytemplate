<?php

namespace App\Api\Facturacion\Controllers;

use App\Api\Facturacion\Services\FacturacionFormatter;
use WP_REST_Response;

class UsuarioController extends BaseController
{
    public static function getUsuarioActual(): WP_REST_Response
    {
        if (!is_user_logged_in()) {
            return self::success(null);
        }

        $user = wp_get_current_user();
        $esAdmin = current_user_can('manage_options');

        return self::success(FacturacionFormatter::usuario($user, $esAdmin));
    }
}
