<?php

namespace App\Api;

use WP_REST_Request;
use WP_REST_Response;
use App\Services\DisponibilidadService;
use App\Services\PrecioService;

/**
 * REST Controller para consultar disponibilidad y precios calculados.
 *
 * GET /glory/v1/disponibilidad             — ¿Está disponible? + precio
 * GET /glory/v1/disponibilidad/calendario  — Mapa mensual día a día
 */
class DisponibilidadController
{
    public static function register(): void
    {
        add_action('rest_api_init', [self::class, 'registerRoutes']);
    }

    public static function registerRoutes(): void
    {
        register_rest_route('glory/v1', '/disponibilidad', [
            'methods'             => 'GET',
            'callback'            => [self::class, 'verificar'],
            'permission_callback' => '__return_true',
            'args'                => [
                'vehiculo_id'  => ['required' => true,  'validate_callback' => fn($v) => is_numeric($v)],
                'fecha_inicio' => ['required' => true,  'sanitize_callback' => 'sanitize_text_field'],
                'fecha_fin'    => ['required' => true,  'sanitize_callback' => 'sanitize_text_field'],
            ],
        ]);

        register_rest_route('glory/v1', '/disponibilidad/calendario', [
            'methods'             => 'GET',
            'callback'            => [self::class, 'calendario'],
            'permission_callback' => '__return_true',
            'args'                => [
                'vehiculo_id' => ['required' => true, 'validate_callback' => fn($v) => is_numeric($v)],
                'mes'         => ['required' => true, 'validate_callback' => fn($v) => is_numeric($v) && $v >= 1 && $v <= 12],
                'anio'        => ['required' => true, 'validate_callback' => fn($v) => is_numeric($v) && $v >= 2024],
            ],
        ]);
    }

    /**
     * Verifica disponibilidad para un rango de fechas.
     * Retorna si está disponible + desglose de precio si lo está.
     */
    public static function verificar(WP_REST_Request $request): WP_REST_Response
    {
        $vehiculoId  = (int) $request->get_param('vehiculo_id');
        $fechaInicio = $request->get_param('fecha_inicio');
        $fechaFin    = $request->get_param('fecha_fin');

        // Validar vehículo existente
        $vehiculo = get_post($vehiculoId);
        if (!$vehiculo || $vehiculo->post_type !== 'vehiculo' || $vehiculo->post_status !== 'publish') {
            return new WP_REST_Response(['success' => false, 'error' => 'Vehículo no encontrado.'], 404);
        }

        // Validar formato de fechas
        $inicio = \DateTime::createFromFormat('Y-m-d', $fechaInicio);
        $fin    = \DateTime::createFromFormat('Y-m-d', $fechaFin);

        if (!$inicio || !$fin) {
            return new WP_REST_Response(['success' => false, 'error' => 'Formato de fecha inválido. Usa Y-m-d.'], 400);
        }

        if ($fin <= $inicio) {
            return new WP_REST_Response(['success' => false, 'error' => 'La fecha de fin debe ser posterior a la de inicio.'], 400);
        }

        // Verificar disponibilidad
        $resultado = DisponibilidadService::verificar($vehiculoId, $fechaInicio, $fechaFin);

        if (!$resultado['disponible']) {
            return new WP_REST_Response([
                'success'    => true,
                'disponible' => false,
                'motivo'     => $resultado['motivo'] ?? 'No disponible para las fechas seleccionadas.',
                'conflictos' => $resultado['conflictos'] ?? [],
            ], 200);
        }

        // Calcular precio
        $precioBase = (float) get_post_meta($vehiculoId, '_vehiculo_precio_base', true);
        $calculo    = PrecioService::calcularReserva($precioBase, $fechaInicio, $fechaFin);

        return new WP_REST_Response([
            'success'    => true,
            'disponible' => true,
            'precio'     => [
                'total'    => $calculo['total'],
                'noches'   => $calculo['noches'],
                'desglose' => $calculo['desglose'],
            ],
            'vehiculo' => [
                'id'     => $vehiculoId,
                'nombre' => get_post_meta($vehiculoId, '_vehiculo_nombre', true) ?: $vehiculo->post_title,
                'fianza' => (float) get_post_meta($vehiculoId, '_vehiculo_fianza', true),
            ],
        ], 200);
    }

    /**
     * Genera un mapa de disponibilidad mes a mes (día a día).
     */
    public static function calendario(WP_REST_Request $request): WP_REST_Response
    {
        $vehiculoId = (int) $request->get_param('vehiculo_id');
        $mes        = (int) $request->get_param('mes');
        $anio       = (int) $request->get_param('anio');

        $vehiculo = get_post($vehiculoId);
        if (!$vehiculo || $vehiculo->post_type !== 'vehiculo') {
            return new WP_REST_Response(['success' => false, 'error' => 'Vehículo no encontrado.'], 404);
        }

        $calendario = DisponibilidadService::calendarioMensual($vehiculoId, $mes, $anio);

        return new WP_REST_Response([
            'success'    => true,
            'vehiculoId' => $vehiculoId,
            'mes'        => $mes,
            'anio'       => $anio,
            'dias'       => $calendario,
        ], 200);
    }
}
