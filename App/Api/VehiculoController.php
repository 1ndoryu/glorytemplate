<?php

namespace App\Api;

use WP_REST_Request;
use WP_REST_Response;
use Glory\Core\GloryLogger;
use App\Services\PrecioService;

/**
 * REST Controller para vehículos.
 *
 * GET /glory/v1/vehiculos       — Lista vehículos activos
 * GET /glory/v1/vehiculos/{id}  — Detalle de un vehículo
 * GET /glory/v1/precios         — Tabla de precios por temporada
 */
class VehiculoController
{
    public static function register(): void
    {
        add_action('rest_api_init', [self::class, 'registerRoutes']);
    }

    public static function registerRoutes(): void
    {
        register_rest_route('glory/v1', '/vehiculos', [
            'methods'             => 'GET',
            'callback'            => [self::class, 'listar'],
            'permission_callback' => '__return_true',
        ]);

        register_rest_route('glory/v1', '/vehiculos/(?P<id>\d+)', [
            'methods'             => 'GET',
            'callback'            => [self::class, 'detalle'],
            'permission_callback' => '__return_true',
            'args'                => [
                'id' => [
                    'required'          => true,
                    'validate_callback' => function ($param) {
                        return is_numeric($param);
                    },
                ],
            ],
        ]);

        register_rest_route('glory/v1', '/vehiculos/slug/(?P<slug>[a-z0-9-]+)', [
            'methods'             => 'GET',
            'callback'            => [self::class, 'detallePorSlug'],
            'permission_callback' => '__return_true',
            'args'                => [
                'slug' => [
                    'required'          => true,
                    'sanitize_callback' => 'sanitize_title',
                ],
            ],
        ]);

        register_rest_route('glory/v1', '/precios', [
            'methods'             => 'GET',
            'callback'            => [self::class, 'precios'],
            'permission_callback' => '__return_true',
            'args'                => [
                'vehiculo_id' => [
                    'required'          => true,
                    'validate_callback' => function ($param) {
                        return is_numeric($param);
                    },
                ],
            ],
        ]);
    }

    /**
     * Lista todos los vehículos activos.
     */
    public static function listar(WP_REST_Request $request): WP_REST_Response
    {
        try {
            $args = [
                'post_type'      => 'vehiculo',
                'post_status'    => 'publish',
                'posts_per_page' => 50,
                'meta_query'     => [
                    [
                        'key'   => '_vehiculo_activo',
                        'value' => '1',
                    ],
                ],
            ];

            $query = new \WP_Query($args);
            $vehiculos = [];

            foreach ($query->posts as $post) {
                $vehiculos[] = self::formatearVehiculo($post);
            }

            wp_reset_postdata();

            return new WP_REST_Response([
                'success'    => true,
                'vehiculos'  => $vehiculos,
                'total'      => count($vehiculos),
            ], 200);
        } catch (\Throwable $e) {
            GloryLogger::error('VehiculoController::listar — ' . $e->getMessage());
            return new WP_REST_Response(['success' => false, 'error' => 'Error interno.'], 500);
        }
    }

    /**
     * Detalle de un vehículo.
     */
    public static function detalle(WP_REST_Request $request): WP_REST_Response
    {
        try {
            $id   = (int) $request->get_param('id');
            $post = get_post($id);

            if (!$post || $post->post_type !== 'vehiculo' || $post->post_status !== 'publish') {
                return new WP_REST_Response(['success' => false, 'error' => 'Vehículo no encontrado.'], 404);
            }

            $vehiculo = self::formatearVehiculo($post, true);

            return new WP_REST_Response([
                'success'  => true,
                'vehiculo' => $vehiculo,
            ], 200);
        } catch (\Throwable $e) {
            GloryLogger::error('VehiculoController::detalle — ' . $e->getMessage());
            return new WP_REST_Response(['success' => false, 'error' => 'Error interno.'], 500);
        }
    }

    /**
     * Detalle de un vehículo por slug.
     */
    public static function detallePorSlug(WP_REST_Request $request): WP_REST_Response
    {
        try {
            $slug = $request->get_param('slug');

            $posts = get_posts([
                'post_type'   => 'vehiculo',
                'post_status' => 'publish',
                'name'        => $slug,
                'numberposts' => 1,
            ]);

            if (empty($posts)) {
                return new WP_REST_Response(['success' => false, 'error' => 'Vehículo no encontrado.'], 404);
            }

            $vehiculo = self::formatearVehiculo($posts[0], true);

            return new WP_REST_Response([
                'success'  => true,
                'vehiculo' => $vehiculo,
            ], 200);
        } catch (\Throwable $e) {
            GloryLogger::error('VehiculoController::detallePorSlug — ' . $e->getMessage());
            return new WP_REST_Response(['success' => false, 'error' => 'Error interno.'], 500);
        }
    }

    /**
     * Tabla de precios por temporada para un vehículo.
     */
    public static function precios(WP_REST_Request $request): WP_REST_Response
    {
        $vehiculoId = (int) $request->get_param('vehiculo_id');
        $post = get_post($vehiculoId);

        if (!$post || $post->post_type !== 'vehiculo') {
            return new WP_REST_Response(['success' => false, 'error' => 'Vehículo no encontrado.'], 404);
        }

        $precioBase = (float) get_post_meta($vehiculoId, '_vehiculo_precio_base', true);
        $tabla = PrecioService::tablaPreciosVehiculo($precioBase);

        return new WP_REST_Response([
            'success'    => true,
            'precioBase' => $precioBase,
            'precios'    => $tabla,
        ], 200);
    }

    /**
     * Formatea un post de vehículo para la respuesta JSON.
     */
    private static function formatearVehiculo(\WP_Post $post, bool $completo = false): array
    {
        $id = $post->ID;
        $thumbnail = get_the_post_thumbnail_url($id, 'large');

        $data = [
            'id'               => $id,
            'slug'             => $post->post_name,
            'nombre'           => get_post_meta($id, '_vehiculo_nombre', true) ?: $post->post_title,
            'descripcionCorta' => get_post_meta($id, '_vehiculo_descripcion_corta', true),
            'capacidad'        => (int) get_post_meta($id, '_vehiculo_capacidad', true),
            'plazasViaje'      => (int) get_post_meta($id, '_vehiculo_plazas_viaje', true),
            'precioBase'       => (float) get_post_meta($id, '_vehiculo_precio_base', true),
            'imagen'           => $thumbnail ?: '',
            'ubicacion'        => get_post_meta($id, '_vehiculo_ubicacion', true),
        ];

        if ($completo) {
            $data['contenido']             = apply_filters('the_content', $post->post_content);
            $data['combustible']           = get_post_meta($id, '_vehiculo_combustible', true);
            $data['transmision']           = get_post_meta($id, '_vehiculo_transmision', true);
            $data['fianza']                = (float) get_post_meta($id, '_vehiculo_fianza', true);
            $data['kmIncluidos']           = (int) get_post_meta($id, '_vehiculo_km_incluidos', true);
            $data['edadMinima']            = (int) get_post_meta($id, '_vehiculo_edad_minima', true);
            $data['politicaCancelacion']   = get_post_meta($id, '_vehiculo_politica_cancelacion', true);

            // Equipamiento
            $equipJson = get_post_meta($id, '_vehiculo_equipamiento', true);
            $equipDecoded = is_string($equipJson) ? json_decode($equipJson, true) : null;
            $data['equipamiento'] = is_array($equipDecoded) ? $equipDecoded : [];

            // Galería
            $galeriaJson = get_post_meta($id, '_vehiculo_galeria', true);
            $galeriaDecoded = is_string($galeriaJson) ? json_decode($galeriaJson, true) : null;
            $galeriaIds  = is_array($galeriaDecoded) ? $galeriaDecoded : [];
            $data['galeria'] = array_map(function ($attId) {
                return [
                    'id'  => (int) $attId,
                    'url' => wp_get_attachment_image_url((int) $attId, 'large') ?: '',
                    'alt' => get_post_meta((int) $attId, '_wp_attachment_image_alt', true) ?: '',
                ];
            }, $galeriaIds);

            // Tabla de precios
            $data['precios'] = PrecioService::tablaPreciosVehiculo($data['precioBase']);
        }

        return $data;
    }
}
