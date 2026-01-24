<?php

namespace App\Api\Facturacion\Controllers;

use App\Setup\GlorySeeder;
use WP_REST_Response;

class SetupController extends BaseController
{
    public static function runSeed(): WP_REST_Response
    {
        if (!current_user_can('install_plugins') && !current_user_can('manage_options')) {
            return self::error('No tienes permisos para ejecutar el seed', 403);
        }

        try {
            $result = GlorySeeder::seed();
            return self::success(['message' => $result]);
        } catch (\Exception $e) {
            return self::error($e->getMessage(), 500);
        }
    }
}
