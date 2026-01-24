<?php

namespace App\Api\Facturacion\Controllers;

use App\Api\Facturacion\Services\FacturacionFormatter;
use WP_REST_Request;
use WP_REST_Response;
use WP_Query;

class ProductosController extends BaseController
{
    public static function getHostings(WP_REST_Request $request): WP_REST_Response
    {
        $userId = get_current_user_id();
        $esAdmin = self::esAdmin();

        $args = [
            'post_type' => 'glory_hosting',
            'post_status' => 'publish',
            'posts_per_page' => -1,
            'orderby' => 'date',
            'order' => 'DESC',
        ];

        if (!$esAdmin) {
            $args['author'] = $userId;
        }

        $query = new WP_Query($args);
        $hostings = array_map(function ($post) {
            return FacturacionFormatter::hosting($post);
        }, $query->posts);

        return self::success($hostings, 200, '', ['total' => count($hostings)]);
    }

    public static function getDominios(WP_REST_Request $request): WP_REST_Response
    {
        $userId = get_current_user_id();
        $esAdmin = self::esAdmin();

        $args = [
            'post_type' => 'glory_dominio',
            'post_status' => 'publish',
            'posts_per_page' => -1,
            'orderby' => 'date',
            'order' => 'DESC',
        ];

        if (!$esAdmin) {
            $args['author'] = $userId;
        }

        $query = new WP_Query($args);
        $dominios = array_map(function ($post) {
            return FacturacionFormatter::dominio($post);
        }, $query->posts);

        return self::success($dominios, 200, '', ['total' => count($dominios)]);
    }
}
