<?php

/**
 * PagosController — Checkout Stripe, webhooks y portal de facturación.
 *
 * POST  /pagos/checkout      — Crear sesión Stripe Checkout
 * POST  /pagos/portal        — Crear enlace al Customer Portal
 * POST  /pagos/webhook       — Webhook de Stripe (sin auth)
 * GET   /pagos/planes        — Info pública de planes
 *
 * sentinel-disable-file limite-lineas — Controller REST con 5 rutas + 5 webhook handlers.
 *
 * @package Kamples
 */

namespace App\Kamples\Api\Controladores;

use App\Kamples\Auth\AuthMiddleware;
use App\Kamples\Api\Helpers\UsuarioHelper;
use App\Kamples\Services\StripeService;
use App\Kamples\KamplesLogger;
use App\Kamples\Services\ServicioNotificaciones;
use App\Config\Schema\_generated\UsuariosExtCols;
use App\Config\Schema\_generated\UsuariosExtEnums;
use App\Config\Schema\_generated\SamplesCols;
use App\Config\Schema\_generated\TransaccionesEnums;
use App\Kamples\Database\Repositories\UsuariosExtRepository;
use App\Kamples\Database\Repositories\SamplesRepository;
use App\Kamples\Database\Repositories\TransaccionesRepository;
use App\Kamples\Services\ServicioEmailCompra;

class PagosController
{
    public static function registrarRutas(string $namespace): void
    {
        register_rest_route($namespace, '/pagos/checkout', [
            'methods'             => 'POST',
            'callback'            => [self::class, 'crearCheckout'],
            'permission_callback' => [AuthMiddleware::class, 'requerirAuth'],
        ]);

        register_rest_route($namespace, '/pagos/checkout-sample', [
            'methods'             => 'POST',
            'callback'            => [self::class, 'crearCheckoutSample'],
            'permission_callback' => [AuthMiddleware::class, 'requerirAuth'],
        ]);

        register_rest_route($namespace, '/pagos/portal', [
            'methods'             => 'POST',
            'callback'            => [self::class, 'crearPortal'],
            'permission_callback' => [AuthMiddleware::class, 'requerirAuth'],
        ]);

        register_rest_route($namespace, '/pagos/webhook', [
            'methods'             => 'POST',
            'callback'            => [self::class, 'webhook'],
            'permission_callback' => '__return_true',
        ]);

        register_rest_route($namespace, '/pagos/planes', [
            'methods'             => 'GET',
            'callback'            => [self::class, 'listarPlanes'],
            'permission_callback' => '__return_true',
        ]);
    }

    /*
     * POST /pagos/checkout — Crea sesión Stripe Checkout para suscripción.
     * Body: { plan: "pro"|"premium", periodo: "mensual"|"anual" }
     */
    public static function crearCheckout(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
        $userId = UsuarioHelper::obtenerIdPg();
        if (!$userId) return UsuarioHelper::respuestaNoEncontrado();

        $body = $request->get_json_params();
        $plan = $body['plan'] ?? '';
        $periodo = $body['periodo'] ?? 'mensual';

        if (!in_array($plan, ['pro', 'premium'], true)) {
            return new \WP_REST_Response(['code' => 'plan_invalido', 'message' => 'Plan debe ser pro o premium'], 400);
        }

        $siteUrl = \home_url();
        $urlExito = $siteUrl . '/planes/?checkout=exito';
        $urlCancelar = $siteUrl . '/planes/?checkout=cancelado';

        $resultado = StripeService::crearCheckoutSession($userId, $plan, $urlExito, $urlCancelar);

        if (isset($resultado['error'])) {
            KamplesLogger::error('Error creando checkout session', ['error' => $resultado['error']]);
            return new \WP_REST_Response([
                'code' => 'error_checkout',
                'message' => $resultado['error']['message'] ?? $resultado['error'],
            ], 500);
        }

        if (!isset($resultado['url'])) {
            return new \WP_REST_Response(['code' => 'sin_url', 'message' => 'No se generó URL de checkout'], 500);
        }

        return new \WP_REST_Response([
            'ok'  => true,
            'url' => $resultado['url'],
        ], 200);
        } catch (\Throwable $e) {
            KamplesLogger::error('Error en PagosController::crearCheckout', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return new \WP_REST_Response([
                'code' => 'error_interno',
                'message' => 'Error interno del servidor',
            ], 500);
        }
    }

    /*
     * POST /pagos/checkout-sample — Crea sesion Stripe Checkout para compra individual de sample.
     * Body: { sampleId: number }
     */
    public static function crearCheckoutSample(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            $userId = UsuarioHelper::obtenerIdPg();
            if (!$userId) return UsuarioHelper::respuestaNoEncontrado();

            $body = $request->get_json_params();
            $sampleId = (int) ($body['sampleId'] ?? 0);

            if ($sampleId <= 0) {
                return new \WP_REST_Response(['code' => 'sample_invalido', 'message' => 'ID de sample requerido'], 400);
            }

            /* Verificar que el sample existe, es premium y tiene precio */
            $sample = SamplesRepository::buscarParaDescarga($sampleId);
            if (!$sample) {
                return new \WP_REST_Response(['code' => 'sample_no_encontrado'], 404);
            }

            $esPremium = (bool) ($sample[SamplesCols::ES_PREMIUM] ?? false);
            $precio = isset($sample[SamplesCols::PRECIO]) ? (float) $sample[SamplesCols::PRECIO] : 0;

            if (!$esPremium || $precio <= 0) {
                return new \WP_REST_Response(['code' => 'no_comprable', 'message' => 'Este sample no tiene precio de venta'], 400);
            }

            /* No permitir comprar tu propio sample */
            $creadorId = (int) ($sample[SamplesCols::CREADOR_ID] ?? 0);
            if ($creadorId === $userId) {
                return new \WP_REST_Response(['code' => 'propio_sample', 'message' => 'No puedes comprar tu propio sample'], 400);
            }

            /* Verificar si ya lo compro */
            if (TransaccionesRepository::haComprado($userId, $sampleId)) {
                return new \WP_REST_Response(['code' => 'ya_comprado', 'message' => 'Ya compraste este sample'], 400);
            }

            $siteUrl = \home_url();
            $urlExito = $siteUrl . '/descargas/?compra=exito&sample=' . $sampleId;
            $urlCancelar = $siteUrl . '/sample/' . ($sample[SamplesCols::SLUG] ?? $sampleId) . '/?compra=cancelado';

            $resultado = StripeService::crearCheckoutSample(
                $userId,
                $sampleId,
                $sample[SamplesCols::TITULO] ?? 'Sample',
                $precio,
                $creadorId,
                $urlExito,
                $urlCancelar
            );

            if (isset($resultado['error'])) {
                KamplesLogger::error('Error creando checkout sample', ['error' => $resultado['error']]);
                return new \WP_REST_Response([
                    'code' => 'error_checkout',
                    'message' => $resultado['error']['message'] ?? $resultado['error'],
                ], 500);
            }

            if (!isset($resultado['url'])) {
                return new \WP_REST_Response(['code' => 'sin_url', 'message' => 'No se generó URL de checkout'], 500);
            }

            return new \WP_REST_Response([
                'ok'  => true,
                'url' => $resultado['url'],
            ], 200);
        } catch (\Throwable $e) {
            KamplesLogger::error('Error en PagosController::crearCheckoutSample', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return new \WP_REST_Response([
                'code' => 'error_interno',
                'message' => 'Error interno del servidor',
            ], 500);
        }
    }

    /*
     * POST /pagos/portal — Crea enlace al Customer Portal para gestionar suscripción.
     */
    public static function crearPortal(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
        $userId = UsuarioHelper::obtenerIdPg();
        if (!$userId) return UsuarioHelper::respuestaNoEncontrado();

        $urlRetorno = \home_url('/planes/');

        $resultado = StripeService::crearPortalSession($userId, $urlRetorno);

        if (isset($resultado['error'])) {
            return new \WP_REST_Response([
                'code' => 'error_portal',
                'message' => $resultado['error']['message'] ?? $resultado['error'],
            ], 500);
        }

        return new \WP_REST_Response([
            'ok'  => true,
            'url' => $resultado['url'],
        ], 200);
        } catch (\Throwable $e) {
            KamplesLogger::error('Error en PagosController::crearPortal', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return new \WP_REST_Response([
                'code' => 'error_interno',
                'message' => 'Error interno del servidor',
            ], 500);
        }
    }

    /*
     * POST /pagos/webhook — Procesa eventos de Stripe.
     * Eventos manejados:
     * - checkout.session.completed → activar suscripción
     * - customer.subscription.updated → cambio de plan
     * - customer.subscription.deleted → cancelar/vencer
     */
    public static function webhook(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
        $payload = $request->get_body();
        $signature = $request->get_header('stripe-signature') ?? '';

        if (!StripeService::verificarWebhook($payload, $signature)) {
            KamplesLogger::warning('Webhook Stripe: firma inválida');
            return new \WP_REST_Response(['error' => 'Firma inválida'], 400);
        }

        $evento = \json_decode($payload, true);
        if (\json_last_error() !== \JSON_ERROR_NONE || !\is_array($evento)) {
            KamplesLogger::warning('Webhook Stripe: payload JSON invalido', ['error' => \json_last_error_msg()]);
            return new \WP_REST_Response(['error' => 'Payload invalido'], 400);
        }
        $tipo = $evento['type'] ?? '';
        $datos = $evento['data']['object'] ?? [];

        KamplesLogger::info('Webhook Stripe recibido', ['tipo' => $tipo]);

        switch ($tipo) {
            case 'checkout.session.completed':
                /* Distinguir suscripcion vs compra de sample via metadata */
                $metaTipo = $datos['metadata']['tipo'] ?? '';
                if ($metaTipo === TransaccionesEnums::TIPO_COMPRA_SAMPLE) {
                    self::procesarCompraSampleCompletada($datos);
                } else {
                    self::procesarCheckoutCompletado($datos);
                }
                break;

            case 'customer.subscription.updated':
                self::procesarSuscripcionActualizada($datos);
                break;

            case 'customer.subscription.deleted':
                self::procesarSuscripcionCancelada($datos);
                break;

            case 'account.updated':
                self::procesarCuentaConnectActualizada($datos);
                break;

            default:
                KamplesLogger::info('Webhook Stripe: evento no manejado', ['tipo' => $tipo]);
        }

        return new \WP_REST_Response(['recibido' => true], 200);
        } catch (\Throwable $e) {
            KamplesLogger::error('Error en PagosController::webhook', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            /* Retornar 200 para evitar reintentos de Stripe */
            return new \WP_REST_Response(['recibido' => true, 'error_interno' => true], 200);
        }
    }

    /*
     * GET /pagos/planes — Info pública de planes con precios y límites.
     */
    public static function listarPlanes(\WP_REST_Request $request): \WP_REST_Response
    {
        return new \WP_REST_Response([
            'planes' => [
                /* [183A-96] Revenue share unificado 80/20 para todos los planes */
                'free' => [
                    'nombre'           => 'Free',
                    'precioMensual'    => 0,
                    'precioAnual'      => 0,
                    'descargasDia'     => 5,
                    'subidasMes'       => -1,
                    'transferenciaGb'  => 1,
                    'revenueShare'     => '80/20',
                    'pruebaGratuita'   => 30,
                    'descargasPrueba'  => 20,
                ],
                'pro' => [
                    'nombre'           => 'Pro',
                    'precioMensual'    => 9.99,
                    'precioAnual'      => 99.90,
                    'descargasDia'     => 50,
                    'subidasMes'       => -1,
                    'transferenciaGb'  => 10,
                    'revenueShare'     => '80/20',
                ],
                'premium' => [
                    'nombre'           => 'Premium',
                    'precioMensual'    => 19.99,
                    'precioAnual'      => 199.90,
                    'descargasDia'     => -1,
                    'subidasMes'       => -1,
                    'transferenciaGb'  => 50,
                    'revenueShare'     => '80/20',
                ],
            ],
        ], 200);
    }

    /* PROCESADORES WEBHOOK */

    private static function procesarCheckoutCompletado(array $sesion): void
    {
        $userId = (int) ($sesion['metadata']['user_id'] ?? 0);
        $plan = $sesion['metadata'][UsuariosExtCols::PLAN] ?? '';
        $subscriptionId = $sesion['subscription'] ?? '';

        if (!$userId || !$plan) {
            KamplesLogger::error('Webhook checkout: metadata incompleta', $sesion);
            return;
        }

        $affected = UsuariosExtRepository::actualizarPlanYSuscripcion($userId, $plan, $subscriptionId);

        /* O07: Verificar que el UPDATE afectó al menos 1 fila */
        if ($affected === 0) {
            KamplesLogger::error('Webhook checkout: UPDATE no afectó ninguna fila (userId inexistente?)', [
                'userId' => $userId, UsuariosExtCols::PLAN => $plan, 'subscriptionId' => $subscriptionId,
            ]);
            return;
        }

        KamplesLogger::info('Suscripción activada vía checkout', [
            'userId' => $userId,
            UsuariosExtCols::PLAN   => $plan,
            'subscriptionId' => $subscriptionId,
        ]);

        /* C266: Notificar pago exitoso + ascenso de plan */
        ServicioNotificaciones::pagoExitoso($userId, $plan, 'Suscripcion activada');
        if (in_array($plan, ['pro', 'premium'], true)) {
            ServicioNotificaciones::ascensoPlan($userId, 'free', $plan);
        }
    }

    private static function procesarSuscripcionActualizada(array $suscripcion): void
    {
        $customerId = $suscripcion['customer'] ?? '';
        $estado = $suscripcion['status'] ?? '';

        if (empty($customerId)) return;

        $usuario = UsuariosExtRepository::buscarPorStripeCustomerId($customerId);

        if (!$usuario) {
            KamplesLogger::warning('Webhook subscription.updated: customer no encontrado', ['customerId' => $customerId]);
            return;
        }

        /* Si la suscripción está activa o en trial, extraer y actualizar plan en BD */
        if (in_array($estado, ['active', 'trialing'], true)) {
            /* O08: Extraer plan actual de Stripe para sincronizar BD */
            $planStripe = null;
            $items = $suscripcion['items']['data'] ?? [];
            if (!empty($items)) {
                $lookupKey = $items[0]['price']['lookup_key'] ?? '';
                $planStripe = match (true) {
                    str_contains($lookupKey, 'premium') => 'premium',
                    str_contains($lookupKey, 'pro') => 'pro',
                    default => null,
                };
            }
            if ($planStripe) {
                /* C266: Leer plan anterior ANTES de actualizar para comparar */
                $planViejo = $usuario[UsuariosExtCols::PLAN] ?? 'free';

                UsuariosExtRepository::actualizarPlanYSuscripcion((int) $usuario[UsuariosExtCols::ID], $planStripe);
                KamplesLogger::info('Plan actualizado vía webhook', ['userId' => $usuario[UsuariosExtCols::ID], 'plan' => $planStripe]);

                /* C266: Notificar cambio de plan si es diferente */
                if ($planViejo !== $planStripe) {
                    ServicioNotificaciones::ascensoPlan((int) $usuario[UsuariosExtCols::ID], $planViejo, $planStripe);
                }
            } else {
                KamplesLogger::info('Suscripción activa/trial (plan no extraído)', ['userId' => $usuario[UsuariosExtCols::ID], 'estado' => $estado]);
            }
        } else {
            UsuariosExtRepository::actualizarPlanYSuscripcion((int) $usuario[UsuariosExtCols::ID], 'free');
            KamplesLogger::info('Suscripción degradada a free', ['userId' => $usuario[UsuariosExtCols::ID], 'estado' => $estado]);
        }
    }

    private static function procesarSuscripcionCancelada(array $suscripcion): void
    {
        $customerId = $suscripcion['customer'] ?? '';

        if (empty($customerId)) return;

        $usuario = UsuariosExtRepository::buscarPorStripeCustomerId($customerId);

        if (!$usuario) return;

        UsuariosExtRepository::cancelarSuscripcion((int) $usuario[UsuariosExtCols::ID]);

        KamplesLogger::info('Suscripción cancelada → plan free', ['userId' => $usuario[UsuariosExtCols::ID]]);
    }

    /**
     * account.updated — Actualiza estado de cuenta Connect del creador.
     * Stripe envía este evento cuando cambian capabilities, payouts o charges.
     */
    private static function procesarCuentaConnectActualizada(array $cuenta): void
    {
        $connectId = $cuenta['id'] ?? '';

        if (empty($connectId)) return;

        $usuario = UsuariosExtRepository::buscarPorStripeConnectId($connectId);

        if (!$usuario) {
            KamplesLogger::warning('Webhook account.updated: connect_id no encontrado', ['connectId' => $connectId]);
            return;
        }

        $cargosActivos = (bool) ($cuenta['charges_enabled'] ?? false);
        $payoutsActivos = (bool) ($cuenta['payouts_enabled'] ?? false);

        KamplesLogger::info('Cuenta Connect actualizada', [
            'userId'   => $usuario[UsuariosExtCols::ID],
            'connectId' => $connectId,
            'charges'  => $cargosActivos,
            'payouts'  => $payoutsActivos,
        ]);
    }

    /**
     * Procesa compra individual de sample completada vía Stripe Checkout.
     * Registra transaccion, notifica y envia email con enlace de descarga.
     */
    private static function procesarCompraSampleCompletada(array $sesion): void
    {
        $userId = (int) ($sesion['metadata']['user_id'] ?? 0);
        $sampleId = (int) ($sesion['metadata']['sample_id'] ?? 0);
        $creadorId = (int) ($sesion['metadata']['creador_id'] ?? 0);
        $precio = (float) ($sesion['metadata']['precio'] ?? 0);
        $stripePaymentId = $sesion['payment_intent'] ?? null;

        if (!$userId || !$sampleId || !$creadorId || $precio <= 0) {
            KamplesLogger::error('Webhook compra_sample: metadata incompleta', $sesion['metadata'] ?? []);
            return;
        }

        /* [183A-96] Idempotencia: verificar stripe_payment_id antes de insertar.
         * Protege contra reintentos de webhook de Stripe. */
        if ($stripePaymentId && TransaccionesRepository::existeStripePaymentId($stripePaymentId)) {
            KamplesLogger::info('Webhook compra_sample: stripe_payment_id ya procesado', [
                'stripePaymentId' => $stripePaymentId,
            ]);
            return;
        }

        /* Evitar procesar duplicados por comprador + sample */
        if (TransaccionesRepository::haComprado($userId, $sampleId)) {
            KamplesLogger::info('Webhook compra_sample: ya procesada (duplicado)', [
                'userId' => $userId, 'sampleId' => $sampleId,
            ]);
            return;
        }

        /* Calcular revenue share para el creador */
        $creador = UsuariosExtRepository::buscarPorId($creadorId);
        $planCreador = $creador[UsuariosExtCols::PLAN] ?? UsuariosExtEnums::PLAN_FREE;
        $shares = StripeService::calcularRevenueShareSample($precio, $planCreador);

        $transaccionId = TransaccionesRepository::registrarCompraSample(
            $userId,
            $creadorId,
            $sampleId,
            $precio,
            $shares['pagoCreador'],
            $shares['comisionPlataforma'],
            $stripePaymentId
        );

        KamplesLogger::info('Compra de sample registrada', [
            'transaccionId' => $transaccionId,
            'comprador'     => $userId,
            'creador'       => $creadorId,
            'sample'        => $sampleId,
            'precio'        => $precio,
            'pagoCreador'   => $shares['pagoCreador'],
        ]);

        /* Notificar al creador */
        ServicioNotificaciones::compraSample($creadorId, $userId, $sampleId, $precio);

        /* Enviar email al comprador con enlace de descarga */
        try {
            ServicioEmailCompra::enviarConfirmacionCompra($userId, $sampleId, $precio);
        } catch (\Throwable $e) {
            KamplesLogger::error('Error enviando email de compra', [
                'userId' => $userId, 'sampleId' => $sampleId, 'error' => $e->getMessage(),
            ]);
        }
    }
}
