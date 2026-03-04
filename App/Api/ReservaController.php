<?php

namespace App\Api;

use WP_REST_Request;
use WP_REST_Response;
use App\Services\DisponibilidadService;
use App\Services\PrecioService;
use Glory\Services\Stripe\StripeApiClient;
use Glory\Core\GloryLogger;

/**
 * REST Controller para reservas.
 *
 * POST /glory/v1/reservas      — Crea reserva + sesión Stripe Checkout
 * GET  /glory/v1/reservas/{id} — Detalle de reserva (validado por email)
 */
class ReservaController
{
    public static function register(): void
    {
        add_action('rest_api_init', [self::class, 'registerRoutes']);
    }

    public static function registerRoutes(): void
    {
        register_rest_route('glory/v1', '/reservas', [
            'methods'             => 'POST',
            'callback'            => [self::class, 'crear'],
            'permission_callback' => '__return_true',
            'args'                => [
                'vehiculo_id'  => ['required' => true,  'validate_callback' => fn($v) => is_numeric($v)],
                'fecha_inicio' => ['required' => true,  'sanitize_callback' => 'sanitize_text_field'],
                'fecha_fin'    => ['required' => true,  'sanitize_callback' => 'sanitize_text_field'],
                'nombre'       => ['required' => true,  'sanitize_callback' => 'sanitize_text_field'],
                'email'        => ['required' => true,  'sanitize_callback' => 'sanitize_email', 'validate_callback' => fn($v) => is_email($v)],
                'telefono'     => ['required' => true,  'sanitize_callback' => 'sanitize_text_field'],
                'notas'        => ['required' => false, 'sanitize_callback' => 'sanitize_textarea_field', 'default' => ''],
            ],
        ]);

        register_rest_route('glory/v1', '/reservas/(?P<id>\d+)', [
            'methods'             => 'GET',
            'callback'            => [self::class, 'detalle'],
            'permission_callback' => '__return_true',
            'args'                => [
                'id'    => ['required' => true, 'validate_callback' => fn($v) => is_numeric($v)],
                'email' => ['required' => true, 'sanitize_callback' => 'sanitize_email'],
            ],
        ]);
    }

    /**
     * Crea una reserva y genera la sesión de Stripe Checkout.
     *
     * Flujo:
     * 1. Valida vehículo y fechas
     * 2. Verifica disponibilidad server-side
     * 3. Calcula precio en backend (no confía en frontend)
     * 4. Crea post de reserva con estado "pendiente"
     * 5. Crea sesión de Stripe Checkout con price_data dinámico
     * 6. Devuelve URL de checkout
     */
    public static function crear(WP_REST_Request $request): WP_REST_Response
    {
        try {
            $vehiculoId  = (int) $request->get_param('vehiculo_id');
            $fechaInicio = $request->get_param('fecha_inicio');
            $fechaFin    = $request->get_param('fecha_fin');
            $nombre      = $request->get_param('nombre');
            $email       = $request->get_param('email');
            $telefono    = $request->get_param('telefono');
            $notas       = $request->get_param('notas');

        // 1. Validar vehículo
        $vehiculo = get_post($vehiculoId);
        if (!$vehiculo || $vehiculo->post_type !== 'vehiculo' || $vehiculo->post_status !== 'publish') {
            return new WP_REST_Response(['success' => false, 'error' => 'Vehículo no encontrado.'], 404);
        }

        $vehiculoActivo = get_post_meta($vehiculoId, '_vehiculo_activo', true);
        if ($vehiculoActivo !== '1') {
            return new WP_REST_Response(['success' => false, 'error' => 'Este vehículo no está disponible actualmente.'], 400);
        }

        // 2. Validar formato de fechas
        $inicio = \DateTime::createFromFormat('Y-m-d', $fechaInicio);
        $fin    = \DateTime::createFromFormat('Y-m-d', $fechaFin);

        if (!$inicio || !$fin || $fin <= $inicio) {
            return new WP_REST_Response(['success' => false, 'error' => 'Fechas inválidas.'], 400);
        }

        // 3. Verificar disponibilidad server-side
        $disponibilidad = DisponibilidadService::verificar($vehiculoId, $fechaInicio, $fechaFin);
        if (!$disponibilidad['disponible']) {
            return new WP_REST_Response([
                'success' => false,
                'error'   => 'El vehículo no está disponible para las fechas seleccionadas.',
                'motivo'  => $disponibilidad['motivo'] ?? '',
            ], 409);
        }

        // 4. Calcular precio en backend (NUNCA confiar en datos del frontend)
        $precioBase = (float) get_post_meta($vehiculoId, '_vehiculo_precio_base', true);
        $calculo    = PrecioService::calcularReserva($precioBase, $fechaInicio, $fechaFin);

        if ($calculo['noches'] === 0 || $calculo['total'] <= 0) {
            return new WP_REST_Response(['success' => false, 'error' => 'Error al calcular el precio.'], 500);
        }

        // Determinar la temporada predominante
        $temporadaPredominante = self::temporadaPredominante($calculo['desglose']);

        // 5. Crear reserva con estado "pendiente"
        $reservaId = wp_insert_post([
            'post_type'   => 'reserva',
            'post_status' => 'publish',
            'post_title'  => sprintf(
                'Reserva — %s — %s al %s',
                get_post_meta($vehiculoId, '_vehiculo_nombre', true) ?: $vehiculo->post_title,
                $fechaInicio,
                $fechaFin
            ),
        ]);

        if (is_wp_error($reservaId)) {
            GloryLogger::error('Error al crear reserva: ' . $reservaId->get_error_message());
            return new WP_REST_Response(['success' => false, 'error' => 'Error interno al crear la reserva.'], 500);
        }

        // Guardar metas
        $precioNoche = $calculo['noches'] > 0 ? round($calculo['total'] / $calculo['noches'], 2) : 0;
        $metas = [
            '_reserva_vehiculo_id'        => $vehiculoId,
            '_reserva_fecha_inicio'       => $fechaInicio,
            '_reserva_fecha_fin'          => $fechaFin,
            '_reserva_noches'             => $calculo['noches'],
            '_reserva_precio_noche'       => $precioNoche,
            '_reserva_precio_total'       => $calculo['total'],
            '_reserva_estado'             => 'pendiente',
            '_reserva_nombre_cliente'     => $nombre,
            '_reserva_email_cliente'      => $email,
            '_reserva_telefono_cliente'   => $telefono,
            '_reserva_notas'              => $notas,
            '_reserva_temporada'          => $temporadaPredominante,
        ];

        foreach ($metas as $key => $value) {
            update_post_meta($reservaId, $key, $value);
        }

        // 6. Crear sesión de Stripe Checkout con precio dinámico
        $stripeResult = self::crearSesionStripe($reservaId, $calculo, $vehiculoId, $email);

        if (!$stripeResult['success']) {
            // Si Stripe falla, marcar reserva como cancelada
            update_post_meta($reservaId, '_reserva_estado', 'cancelada');
            GloryLogger::error('Error Stripe al crear sesión: ' . ($stripeResult['error'] ?? 'Desconocido'));
            return new WP_REST_Response([
                'success' => false,
                'error'   => 'Error al procesar el pago. Inténtalo de nuevo.',
            ], 502);
        }

        // Guardar datos de Stripe en la reserva
        update_post_meta($reservaId, '_reserva_stripe_session_id', $stripeResult['sessionId']);

        GloryLogger::info("Reserva #{$reservaId} creada — Stripe session: {$stripeResult['sessionId']}");

        return new WP_REST_Response([
            'success'     => true,
            'reservaId'   => $reservaId,
            'checkoutUrl' => $stripeResult['url'],
            'precio'      => [
                'total'    => $calculo['total'],
                'noches'   => $calculo['noches'],
                'desglose' => $calculo['desglose'],
            ],
        ], 201);
        } catch (\Throwable $e) {
            GloryLogger::error('ReservaController::crear — ' . $e->getMessage());
            return new WP_REST_Response(['success' => false, 'error' => 'Error interno.'], 500);
        }
    }

    /**
     * Detalle de una reserva — requiere email como verificación.
     */
    public static function detalle(WP_REST_Request $request): WP_REST_Response
    {
        $reservaId = (int) $request->get_param('id');
        $email     = $request->get_param('email');

        $reserva = get_post($reservaId);
        if (!$reserva || $reserva->post_type !== 'reserva') {
            return new WP_REST_Response(['success' => false, 'error' => 'Reserva no encontrada.'], 404);
        }

        // Verificar email para acceso
        $emailReserva = get_post_meta($reservaId, '_reserva_email_cliente', true);
        if (strtolower($email) !== strtolower($emailReserva)) {
            return new WP_REST_Response(['success' => false, 'error' => 'Email no coincide con la reserva.'], 403);
        }

        $vehiculoId = (int) get_post_meta($reservaId, '_reserva_vehiculo_id', true);

        return new WP_REST_Response([
            'success' => true,
            'reserva' => [
                'id'            => $reservaId,
                'estado'        => get_post_meta($reservaId, '_reserva_estado', true),
                'fechaInicio'   => get_post_meta($reservaId, '_reserva_fecha_inicio', true),
                'fechaFin'      => get_post_meta($reservaId, '_reserva_fecha_fin', true),
                'noches'        => (int) get_post_meta($reservaId, '_reserva_noches', true),
                'precioNoche'   => (float) get_post_meta($reservaId, '_reserva_precio_noche', true),
                'precioTotal'   => (float) get_post_meta($reservaId, '_reserva_precio_total', true),
                'temporada'     => get_post_meta($reservaId, '_reserva_temporada', true),
                'nombreCliente' => get_post_meta($reservaId, '_reserva_nombre_cliente', true),
                'emailCliente'  => get_post_meta($reservaId, '_reserva_email_cliente', true),
                'telefono'      => get_post_meta($reservaId, '_reserva_telefono_cliente', true),
                'notas'         => get_post_meta($reservaId, '_reserva_notas', true),
                'vehiculo'      => [
                    'id'        => $vehiculoId,
                    'nombre'    => get_post_meta($vehiculoId, '_vehiculo_nombre', true),
                    'ubicacion' => get_post_meta($vehiculoId, '_vehiculo_ubicacion', true),
                ],
                'recogida' => get_option('cresta_horario_recogida', '16:00'),
                'devolucion' => get_option('cresta_horario_devolucion', '10:00'),
            ],
        ], 200);
    }

    /**
     * Crea una sesión de Stripe Checkout con precio dinámico (price_data).
     */
    private static function crearSesionStripe(int $reservaId, array $calculo, int $vehiculoId, string $email): array
    {
        $stripeClient = new StripeApiClient();

        $vehiculoNombre = get_post_meta($vehiculoId, '_vehiculo_nombre', true) ?: get_the_title($vehiculoId);
        $moneda         = strtolower(get_option('cresta_moneda', 'eur'));
        $totalCentimos  = (int) round($calculo['total'] * 100);

        $siteUrl    = home_url();
        $successUrl = $siteUrl . '/confirmacion/?session_id={CHECKOUT_SESSION_ID}&reserva_id=' . $reservaId;
        $cancelUrl  = $siteUrl . '/reservar/?cancelado=1&vehiculo_id=' . $vehiculoId;

        $params = [
            'mode'                                     => 'payment',
            'customer_email'                           => $email,
            'line_items[0][price_data][currency]'      => $moneda,
            'line_items[0][price_data][unit_amount]'   => $totalCentimos,
            'line_items[0][price_data][product_data][name]'        => sprintf('Reserva %s — %d noches', $vehiculoNombre, $calculo['noches']),
            'line_items[0][price_data][product_data][description]' => sprintf(
                'Del %s al %s',
                get_post_meta($reservaId, '_reserva_fecha_inicio', true),
                get_post_meta($reservaId, '_reserva_fecha_fin', true)
            ),
            'line_items[0][quantity]'                   => 1,
            'success_url'                               => $successUrl,
            'cancel_url'                                => $cancelUrl,
            'metadata[reserva_id]'                      => $reservaId,
            'metadata[vehiculo_id]'                     => $vehiculoId,
            'payment_intent_data[metadata][reserva_id]' => $reservaId,
            'payment_intent_data[metadata][vehiculo_id]' => $vehiculoId,
        ];

        $result = $stripeClient->post('/checkout/sessions', $params);

        if ($result['success']) {
            return [
                'success'   => true,
                'sessionId' => $result['data']['id'],
                'url'       => $result['data']['url'],
            ];
        }

        return [
            'success' => false,
            'error'   => $result['error'] ?? 'Error creando sesión de Stripe.',
        ];
    }

    /**
     * Determina la temporada predominante del desglose.
     */
    private static function temporadaPredominante(array $desglose): string
    {
        $conteo = [];
        foreach ($desglose as $dia) {
            $temp = $dia['temporada'] ?? 'baja';
            $conteo[$temp] = ($conteo[$temp] ?? 0) + 1;
        }

        arsort($conteo);
        return array_key_first($conteo) ?: 'baja';
    }
}
