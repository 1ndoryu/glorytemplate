<?php

namespace App\Api\Facturacion\Controllers;

use App\Api\Facturacion\Services\FacturacionFormatter;
use WP_REST_Request;
use WP_REST_Response;
use WP_Query;

use App\Api\Facturacion\Controllers\BaseController;
use Stripe\Stripe;
use Stripe\PaymentIntent;
use Exception;

class FacturasController extends BaseController
{
    public static function getFacturas(WP_REST_Request $request): WP_REST_Response
    {
        $userId = get_current_user_id();
        $esAdmin = self::esAdmin();

        $args = [
            'post_type' => 'glory_factura',
            'post_status' => 'publish',
            'posts_per_page' => -1,
            'orderby' => 'date',
            'order' => 'DESC',
        ];

        if (!$esAdmin) {
            $args['author'] = $userId;
        }

        $query = new WP_Query($args);
        $facturas = array_map(function ($post) {
            return FacturacionFormatter::factura($post);
        }, $query->posts);

        return self::success($facturas, 200, '', ['total' => count($facturas)]);
    }

    public static function getFactura(WP_REST_Request $request): WP_REST_Response
    {
        $id = (int) $request->get_param('id');
        $post = get_post($id);

        if (!$post || $post->post_type !== 'glory_factura') {
            return self::error('Factura no encontrada', 404);
        }

        return self::success(FacturacionFormatter::factura($post));
    }

    public static function iniciarPagoFactura(WP_REST_Request $request): WP_REST_Response
    {
        $id = (int) $request->get_param('id');
        $post = get_post($id);

        if (!$post || $post->post_type !== 'glory_factura') {
            return self::error('Factura no encontrada', 404);
        }

        $estado = get_post_meta($id, '_estado', true);
        if ($estado === 'pagada') {
            return self::error('Esta factura ya está pagada');
        }

        $total = (float) get_post_meta($id, '_total', true);
        $stripeKey = $_ENV['STRIPE_SECRET_KEY'] ?? null;

        if (!$stripeKey) {
            return self::error('Sistema de pagos no configurado (Falta STRIPE_SECRET_KEY)', 500);
        }

        try {
            Stripe::setApiKey($stripeKey); // @phpstan-ignore-line

            $paymentIntent = PaymentIntent::create([
                'amount' => (int) round($total * 100), // Centavos
                'currency' => 'usd', // TODO: Hacer configurable via opciones
                'metadata' => [
                    'factura_id' => $id,
                    'wp_user_id' => get_current_user_id()
                ],
                'automatic_payment_methods' => [
                    'enabled' => true,
                ],
            ]);

            return self::success([
                'clientSecret' => $paymentIntent->client_secret,
                'facturaId' => $id,
                'total' => $total,
                'stripePublicKey' => $_ENV['STRIPE_PUBLIC_KEY'] ?? ''
            ]);
        } catch (Exception $e) {
            return self::error('Error Stripe: ' . $e->getMessage(), 500);
        }
    }

    /* Permisos */

    public static function puedeVerFactura(WP_REST_Request $request): bool
    {
        if (!is_user_logged_in()) {
            return false;
        }

        $facturaId = (int) $request->get_param('id');
        $factura = get_post($facturaId);

        if (!$factura || $factura->post_type !== 'glory_factura') {
            return false;
        }

        if (current_user_can('manage_options')) {
            return true;
        }

        return $factura->post_author == get_current_user_id();
    }
}
