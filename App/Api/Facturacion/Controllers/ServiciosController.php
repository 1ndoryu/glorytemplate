<?php

namespace App\Api\Facturacion\Controllers;

use App\Api\Facturacion\Services\FacturacionFormatter;
use WP_REST_Request;
use WP_REST_Response;
use WP_Query;

class ServiciosController extends BaseController
{
    /**
     * Obtener listado de servicios (Catálogo)
     */
    public static function getServicios(WP_REST_Request $request): WP_REST_Response
    {
        $soloActivos = $request->get_param('activos') !== 'false';

        $args = [
            'post_type' => 'glory_servicio',
            'post_status' => 'publish',
            'posts_per_page' => -1,
            'orderby' => 'date',
            'order' => 'DESC',
        ];

        if ($soloActivos) {
            $args['meta_query'] = [
                [
                    'key' => '_activo',
                    'value' => '1',
                    'compare' => '=',
                ],
            ];
        }

        $query = new WP_Query($args);
        $servicios = array_map(function ($post) {
            return FacturacionFormatter::servicio($post);
        }, $query->posts);

        return self::success($servicios, 200, '', ['total' => count($servicios)]);
    }

    /**
     * Obtener detalle de un servicio
     */
    public static function getServicio(WP_REST_Request $request): WP_REST_Response
    {
        $id = (int) $request->get_param('id');
        $post = get_post($id);

        if (!$post || $post->post_type !== 'glory_servicio') {
            return self::error('Servicio no encontrado', 404);
        }

        return self::success(FacturacionFormatter::servicio($post));
    }

    /**
     * Crear nuevo servicio (Solo Admin)
     */
    public static function crearServicio(WP_REST_Request $request): WP_REST_Response
    {
        $titulo = sanitize_text_field($request->get_param('titulo'));
        $descripcion = wp_kses_post($request->get_param('descripcion'));
        $precio = (float) $request->get_param('precio');
        $tiempoEntrega = (int) $request->get_param('tiempoEntregaDias');
        $categoria = sanitize_text_field($request->get_param('categoria'));

        if (empty($titulo) || $precio <= 0) {
            return self::error('Título y precio son requeridos');
        }

        $postId = wp_insert_post([
            'post_title' => $titulo,
            'post_content' => $descripcion,
            'post_type' => 'glory_servicio',
            'post_status' => 'publish',
            'post_author' => get_current_user_id(),
        ]);

        if (is_wp_error($postId)) {
            return self::error('Error al crear el servicio', 500);
        }

        update_post_meta($postId, '_precio', $precio);
        update_post_meta($postId, '_tiempo_entrega_dias', $tiempoEntrega ?: 30);
        update_post_meta($postId, '_categoria', $categoria ?: 'general');
        update_post_meta($postId, '_activo', true);

        return self::success(FacturacionFormatter::servicio(get_post($postId)), 201);
    }

    /**
     * Permiso: Puede crear servicios (Admin)
     */
    public static function puedeCrearServicios(): bool
    {
        return current_user_can('edit_posts');
    }
}
