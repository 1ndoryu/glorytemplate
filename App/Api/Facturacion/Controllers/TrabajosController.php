<?php

namespace App\Api\Facturacion\Controllers;

use App\Api\Facturacion\Services\FacturacionFormatter;
use WP_REST_Request;
use WP_REST_Response;
use WP_Query;

class TrabajosController extends BaseController
{
    public static function getTrabajos(WP_REST_Request $request): WP_REST_Response
    {
        $userId = get_current_user_id();
        $esAdmin = self::esAdmin();

        $args = [
            'post_type' => 'glory_trabajo',
            'post_status' => 'publish',
            'posts_per_page' => -1,
            'orderby' => 'date',
            'order' => 'DESC',
        ];

        /* Si no es admin, filtrar por rol (cliente o proveedor) */
        if (!$esAdmin) {
            $args['meta_query'] = [
                'relation' => 'OR',
                [
                    'key' => '_proveedor_id',
                    'value' => $userId,
                    'compare' => '=',
                ],
            ];
            /* También incluir trabajos donde es el cliente (autor) */
            $args['author'] = $userId;
        }

        $query = new WP_Query($args);
        $trabajos = [];

        foreach ($query->posts as $post) {
            /* Filtrado extra de seguridad para clientes si WP_Query trae de más */
            if (!$esAdmin && $post->post_author != $userId) {
                $proveedorId = (int) get_post_meta($post->ID, '_proveedor_id', true);
                if ($proveedorId !== $userId) {
                    continue;
                }
            }
            $trabajos[] = FacturacionFormatter::trabajo($post);
        }

        return self::success($trabajos, 200, '', ['total' => count($trabajos)]);
    }

    public static function getTrabajo(WP_REST_Request $request): WP_REST_Response
    {
        $id = (int) $request->get_param('id');
        $post = get_post($id);

        if (!$post || $post->post_type !== 'glory_trabajo') {
            return self::error('Trabajo no encontrado', 404);
        }

        return self::success(FacturacionFormatter::trabajo($post));
    }

    public static function actualizarProgreso(WP_REST_Request $request): WP_REST_Response
    {
        $id = (int) $request->get_param('id');
        $progreso = (int) $request->get_param('progreso');
        $estado = sanitize_text_field($request->get_param('estado'));

        $post = get_post($id);
        if (!$post || $post->post_type !== 'glory_trabajo') {
            return self::error('Trabajo no encontrado', 404);
        }

        if ($progreso >= 0 && $progreso <= 100) {
            update_post_meta($id, '_progreso_porcentaje', $progreso);
        }

        $estadosValidos = ['pendiente', 'en_progreso', 'revision', 'completado', 'cancelado'];
        if ($estado && in_array($estado, $estadosValidos, true)) {
            update_post_meta($id, '_estado', $estado);
        }

        return self::success(FacturacionFormatter::trabajo(get_post($id)));
    }

    /* Permisos */

    public static function puedeVerTrabajo(WP_REST_Request $request): bool
    {
        if (!is_user_logged_in()) {
            return false;
        }

        $trabajoId = (int) $request->get_param('id');
        $trabajo = get_post($trabajoId);

        if (!$trabajo || $trabajo->post_type !== 'glory_trabajo') {
            return false;
        }

        if (current_user_can('manage_options')) {
            return true;
        }

        $userId = get_current_user_id();
        $proveedorId = (int) get_post_meta($trabajoId, '_proveedor_id', true);

        return $trabajo->post_author == $userId || $proveedorId === $userId;
    }

    public static function esProveedorDelTrabajo(WP_REST_Request $request): bool
    {
        if (!is_user_logged_in()) {
            return false;
        }

        $trabajoId = (int) $request->get_param('id');
        $proveedorId = (int) get_post_meta($trabajoId, '_proveedor_id', true);

        return current_user_can('manage_options') || get_current_user_id() === $proveedorId;
    }
}
