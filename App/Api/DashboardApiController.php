<?php

/**
 * Dashboard API Controller
 *
 * Maneja los endpoints REST para el dashboard de productividad personal.
 * Permite guardar y cargar datos del usuario (hábitos, tareas, notas, proyectos).
 *
 * Endpoints:
 * - GET  /wp-json/glory/v1/dashboard       → Cargar datos del usuario
 * - POST /wp-json/glory/v1/dashboard       → Guardar datos del usuario
 * - GET  /wp-json/glory/v1/dashboard/sync  → Estado de sincronización
 *
 * @package App\Api
 */

namespace App\Api;

use App\Repository\DashboardRepository;
use App\Services\SuscripcionService;
use Glory\Services\Stripe\StripeConfig;
use Glory\Services\Stripe\StripeCheckoutService;

class DashboardApiController
{
    private const API_NAMESPACE = 'glory/v1';

    /**
     * Registra los endpoints REST
     */
    public static function register(): void
    {
        add_action('rest_api_init', [self::class, 'registerRoutes']);
    }

    /**
     * Define las rutas REST
     */
    public static function registerRoutes(): void
    {
        /* Endpoint principal: Cargar datos */
        register_rest_route(self::API_NAMESPACE, '/dashboard', [
            [
                'methods' => \WP_REST_Server::READABLE,
                'callback' => [self::class, 'loadDashboard'],
                'permission_callback' => [self::class, 'requireAuthentication'],
            ],
            [
                'methods' => \WP_REST_Server::CREATABLE,
                'callback' => [self::class, 'saveDashboard'],
                'permission_callback' => [self::class, 'requireAuthentication'],
                'args' => self::getSaveArgs(),
            ],
        ]);

        /* Endpoint de sincronización: Estado y timestamp */
        register_rest_route(self::API_NAMESPACE, '/dashboard/sync', [
            'methods' => \WP_REST_Server::READABLE,
            'callback' => [self::class, 'getSyncStatus'],
            'permission_callback' => [self::class, 'requireAuthentication'],
        ]);

        /* Endpoint incremental: Solo cambios desde timestamp */
        register_rest_route(self::API_NAMESPACE, '/dashboard/changes', [
            [
                'methods' => \WP_REST_Server::READABLE,
                'callback' => [self::class, 'getChangesSince'],
                'permission_callback' => [self::class, 'requireAuthentication'],
                'args' => [
                    'since' => [
                        'required' => true,
                        'validate_callback' => fn($param) => is_numeric($param),
                        'sanitize_callback' => 'absint',
                    ],
                ],
            ],
            [
                'methods' => \WP_REST_Server::CREATABLE,
                'callback' => [self::class, 'pushChanges'],
                'permission_callback' => [self::class, 'requireAuthentication'],
                'args' => [
                    'changes' => [
                        'required' => true,
                        'validate_callback' => fn($param) => is_array($param),
                    ],
                    'clientTimestamp' => [
                        'required' => true,
                        'validate_callback' => fn($param) => is_numeric($param),
                    ],
                ],
            ],
        ]);

        /* Endpoints de suscripción */
        register_rest_route(self::API_NAMESPACE, '/suscripcion', [
            'methods' => \WP_REST_Server::READABLE,
            'callback' => [self::class, 'getSuscripcion'],
            'permission_callback' => [self::class, 'requireAuthentication'],
        ]);

        register_rest_route(self::API_NAMESPACE, '/suscripcion/trial', [
            'methods' => \WP_REST_Server::CREATABLE,
            'callback' => [self::class, 'activarTrial'],
            'permission_callback' => [self::class, 'requireAuthentication'],
        ]);

        /* Endpoints de cifrado */
        register_rest_route(self::API_NAMESPACE, '/seguridad/cifrado', [
            [
                'methods' => \WP_REST_Server::READABLE,
                'callback' => [self::class, 'getEstadoCifrado'],
                'permission_callback' => [self::class, 'requireAuthentication'],
            ],
            [
                'methods' => \WP_REST_Server::CREATABLE,
                'callback' => [self::class, 'toggleCifrado'],
                'permission_callback' => [self::class, 'requireAuthentication'],
                'args' => [
                    'habilitar' => [
                        'required' => true,
                        'validate_callback' => function ($param) {
                            return is_bool($param) || $param === 'true' || $param === 'false' || $param === 1 || $param === 0 || $param === '1' || $param === '0';
                        },
                        'sanitize_callback' => function ($param) {
                            if (is_bool($param)) {
                                return $param;
                            }
                            return $param === 'true' || $param === '1' || $param === 1;
                        },
                    ],
                ],
            ],
        ]);

        /* Endpoints de Stripe - Checkout */
        register_rest_route(self::API_NAMESPACE, '/stripe/checkout', [
            'methods' => \WP_REST_Server::CREATABLE,
            'callback' => [self::class, 'createCheckoutSession'],
            'permission_callback' => [self::class, 'requireAuthentication'],
            'args' => [
                'plan' => [
                    'required' => true,
                    'validate_callback' => fn($param) => in_array($param, ['monthly', 'yearly']),
                ],
            ],
        ]);

        /* Webhook de Stripe - No requiere auth, usa firma */
        register_rest_route(self::API_NAMESPACE, '/stripe/webhook', [
            'methods' => \WP_REST_Server::CREATABLE,
            'callback' => [self::class, 'handleStripeWebhook'],
            'permission_callback' => '__return_true',
        ]);

        /* Portal de facturacion de Stripe */
        register_rest_route(self::API_NAMESPACE, '/stripe/portal', [
            'methods' => \WP_REST_Server::CREATABLE,
            'callback' => [self::class, 'createBillingPortal'],
            'permission_callback' => [self::class, 'requireAuthentication'],
        ]);
    }

    /**
     * Argumentos de validación para el endpoint de guardado
     */
    private static function getSaveArgs(): array
    {
        return [
            'habitos' => [
                'required' => false,
                'validate_callback' => fn($param) => is_array($param),
                'default' => [],
            ],
            'tareas' => [
                'required' => false,
                'validate_callback' => fn($param) => is_array($param),
                'default' => [],
            ],
            'proyectos' => [
                'required' => false,
                'validate_callback' => fn($param) => is_array($param),
                'default' => [],
            ],
            'notas' => [
                'required' => false,
                'validate_callback' => fn($param) => is_string($param) || is_array($param),
                'default' => '',
            ],
            'configuracion' => [
                'required' => false,
                'validate_callback' => fn($param) => is_array($param),
                'default' => [],
            ],
        ];
    }

    /**
     * Verifica que el usuario esté autenticado
     */
    public static function requireAuthentication(): bool
    {
        return is_user_logged_in();
    }

    /**
     * Carga todos los datos del dashboard del usuario actual
     */
    public static function loadDashboard(\WP_REST_Request $request): \WP_REST_Response
    {
        $userId = get_current_user_id();

        try {
            $repository = new DashboardRepository($userId);
            $data = $repository->loadAll();

            return new \WP_REST_Response([
                'success' => true,
                'data' => $data,
                'meta' => [
                    'userId' => $userId,
                    'loadedAt' => current_time('c'),
                    'serverTimestamp' => time() * 1000,
                ],
            ], 200);
        } catch (\Exception $e) {
            error_log("[DashboardAPI] ERROR loadDashboard: " . $e->getMessage());
            return new \WP_REST_Response([
                'success' => false,
                'message' => 'Error al cargar datos: ' . $e->getMessage(),
                'code' => 'load_error',
            ], 500);
        } catch (\Error $e) {
            error_log("[DashboardAPI] FATAL loadDashboard: " . $e->getMessage());
            return new \WP_REST_Response([
                'success' => false,
                'message' => 'Error fatal: ' . $e->getMessage(),
                'code' => 'fatal_error',
            ], 500);
        }
    }

    /**
     * Guarda los datos del dashboard del usuario actual
     */
    public static function saveDashboard(\WP_REST_Request $request): \WP_REST_Response
    {
        $userId = get_current_user_id();

        $data = [
            'habitos' => $request->get_param('habitos') ?? [],
            'tareas' => $request->get_param('tareas') ?? [],
            'proyectos' => $request->get_param('proyectos') ?? [],
            'notas' => $request->get_param('notas') ?? '',
            'configuracion' => $request->get_param('configuracion') ?? [],
        ];

        try {
            $repository = new DashboardRepository($userId);
            $suscripcionService = new SuscripcionService($userId);

            /* Validar límites del plan */
            $erroresLimite = $suscripcionService->validarLimites($data);
            if (!empty($erroresLimite)) {
                error_log("[DashboardAPI] Límites excedidos: " . json_encode($erroresLimite));
                return new \WP_REST_Response([
                    'success' => false,
                    'message' => 'Límites del plan excedidos',
                    'errors' => $erroresLimite,
                    'code' => 'plan_limit_exceeded',
                    'suscripcion' => $suscripcionService->getInfoCompleta(),
                ], 403);
            }

            /* Validar estructura de datos */
            $validation = $repository->validateData($data);
            if (!$validation['valid']) {
                error_log("[DashboardAPI] Validacion fallida: " . json_encode($validation['errors']));
                return new \WP_REST_Response([
                    'success' => false,
                    'message' => 'Datos inválidos',
                    'errors' => $validation['errors'],
                    'code' => 'validation_error',
                ], 400);
            }

            /* Guardar datos */
            $result = $repository->saveAll($data);

            if (!$result) {
                error_log("[DashboardAPI] saveAll devolvió false");
                return new \WP_REST_Response([
                    'success' => false,
                    'message' => 'Error al guardar datos',
                    'code' => 'save_error',
                ], 500);
            }

            return new \WP_REST_Response([
                'success' => true,
                'message' => 'Datos guardados correctamente',
                'meta' => [
                    'userId' => $userId,
                    'savedAt' => current_time('c'),
                    'serverTimestamp' => time() * 1000,
                    'counts' => [
                        'habitos' => count($data['habitos']),
                        'tareas' => count($data['tareas']),
                        'proyectos' => count($data['proyectos']),
                    ],
                ],
            ], 200);
        } catch (\Exception $e) {
            error_log("[DashboardAPI] ERROR saveDashboard: " . $e->getMessage());
            return new \WP_REST_Response([
                'success' => false,
                'message' => 'Error interno: ' . $e->getMessage(),
                'code' => 'internal_error',
            ], 500);
        } catch (\Error $e) {
            error_log("[DashboardAPI] FATAL saveDashboard: " . $e->getMessage());
            return new \WP_REST_Response([
                'success' => false,
                'message' => 'Error fatal: ' . $e->getMessage(),
                'code' => 'fatal_error',
            ], 500);
        }
    }

    /**
     * Obtiene el estado de sincronización
     */
    public static function getSyncStatus(\WP_REST_Request $request): \WP_REST_Response
    {
        $userId = get_current_user_id();

        try {
            $repository = new DashboardRepository($userId);
            $status = $repository->getSyncStatus();

            return new \WP_REST_Response([
                'success' => true,
                'data' => $status,
            ], 200);
        } catch (\Exception $e) {
            return new \WP_REST_Response([
                'success' => false,
                'message' => 'Error al obtener estado: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Obtiene cambios desde un timestamp (sync incremental)
     */
    public static function getChangesSince(\WP_REST_Request $request): \WP_REST_Response
    {
        $userId = get_current_user_id();
        $since = (int) $request->get_param('since');

        try {
            $repository = new DashboardRepository($userId);
            $changes = $repository->getChangesSince($since);

            return new \WP_REST_Response([
                'success' => true,
                'data' => $changes,
                'meta' => [
                    'since' => $since,
                    'serverTimestamp' => time() * 1000,
                ],
            ], 200);
        } catch (\Exception $e) {
            return new \WP_REST_Response([
                'success' => false,
                'message' => 'Error al obtener cambios: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Recibe cambios incrementales del cliente
     */
    public static function pushChanges(\WP_REST_Request $request): \WP_REST_Response
    {
        $userId = get_current_user_id();
        $changes = $request->get_param('changes');
        $clientTimestamp = (int) $request->get_param('clientTimestamp');

        try {
            $repository = new DashboardRepository($userId);
            $result = $repository->applyChanges($changes, $clientTimestamp);

            return new \WP_REST_Response([
                'success' => true,
                'data' => $result,
                'meta' => [
                    'appliedChanges' => count($changes),
                    'serverTimestamp' => time() * 1000,
                ],
            ], 200);
        } catch (\Exception $e) {
            return new \WP_REST_Response([
                'success' => false,
                'message' => 'Error al aplicar cambios: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Obtiene información de suscripción del usuario
     */
    public static function getSuscripcion(\WP_REST_Request $request): \WP_REST_Response
    {
        $userId = get_current_user_id();

        try {
            $service = new SuscripcionService($userId);
            $info = $service->getInfoCompleta();

            return new \WP_REST_Response([
                'success' => true,
                'data' => $info,
            ], 200);
        } catch (\Exception $e) {
            return new \WP_REST_Response([
                'success' => false,
                'message' => 'Error al obtener suscripción: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Activa el trial de Premium
     */
    public static function activarTrial(\WP_REST_Request $request): \WP_REST_Response
    {
        $userId = get_current_user_id();

        try {
            $service = new SuscripcionService($userId);
            $resultado = $service->activarTrial();

            $status = $resultado['exito'] ? 200 : 400;

            return new \WP_REST_Response([
                'success' => $resultado['exito'],
                'message' => $resultado['mensaje'],
                'data' => $resultado['suscripcion'] ?? $service->getInfoCompleta(),
            ], $status);
        } catch (\Exception $e) {
            return new \WP_REST_Response([
                'success' => false,
                'message' => 'Error al activar trial: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Obtiene el estado de cifrado del usuario
     */
    public static function getEstadoCifrado(\WP_REST_Request $request): \WP_REST_Response
    {
        $userId = get_current_user_id();

        try {
            $repository = new DashboardRepository($userId);

            return new \WP_REST_Response([
                'success' => true,
                'data' => [
                    'habilitado' => $repository->esCifradoActivo(),
                    'algoritmo' => 'AES-256-GCM',
                    'tipoClaveDerivacion' => 'HKDF-SHA256',
                ],
            ], 200);
        } catch (\Exception $e) {
            return new \WP_REST_Response([
                'success' => false,
                'message' => 'Error al obtener estado de cifrado: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Habilita o deshabilita el cifrado de datos
     */
    public static function toggleCifrado(\WP_REST_Request $request): \WP_REST_Response
    {
        $userId = get_current_user_id();
        $habilitar = $request->get_param('habilitar');

        try {
            $repository = new DashboardRepository($userId);

            if ($habilitar) {
                $resultado = $repository->habilitarCifrado();
                $mensaje = $resultado
                    ? 'Cifrado habilitado. Tus datos ahora están protegidos.'
                    : 'Error al habilitar el cifrado.';
            } else {
                $resultado = $repository->deshabilitarCifrado();
                $mensaje = $resultado
                    ? 'Cifrado deshabilitado. Los datos se almacenan sin cifrar.'
                    : 'Error al deshabilitar el cifrado.';
            }

            return new \WP_REST_Response([
                'success' => $resultado,
                'message' => $mensaje,
                'data' => [
                    'habilitado' => $repository->esCifradoActivo(),
                ],
            ], $resultado ? 200 : 500);
        } catch (\Exception $e) {
            return new \WP_REST_Response([
                'success' => false,
                'message' => 'Error al cambiar cifrado: ' . $e->getMessage(),
            ], 500);
        }
    }

    /* 
     *
     * STRIPE INTEGRATION METHODS
     *
     */

    /**
     * IDs de precios de Stripe
     * En produccion estos deberian venir de opciones de WP o constantes
     */
    private static function getStripePriceId(string $plan): string
    {
        $prices = [
            'monthly' => defined('GLORY_STRIPE_PRICE_MONTHLY')
                ? GLORY_STRIPE_PRICE_MONTHLY
                : get_option('glory_stripe_price_monthly', ''),
            'yearly' => defined('GLORY_STRIPE_PRICE_YEARLY')
                ? GLORY_STRIPE_PRICE_YEARLY
                : get_option('glory_stripe_price_yearly', ''),
        ];

        return $prices[$plan] ?? '';
    }

    /**
     * Crea una sesion de checkout de Stripe
     */
    public static function createCheckoutSession(\WP_REST_Request $request): \WP_REST_Response
    {
        $userId = get_current_user_id();
        $plan = $request->get_param('plan');

        /* Verificar que Stripe esta configurado */
        if (!StripeConfig::isConfigured()) {
            return new \WP_REST_Response([
                'success' => false,
                'message' => 'Stripe no está configurado',
                'code' => 'stripe_not_configured',
            ], 500);
        }

        $priceId = self::getStripePriceId($plan);
        if (empty($priceId)) {
            return new \WP_REST_Response([
                'success' => false,
                'message' => 'Plan no válido',
                'code' => 'invalid_plan',
            ], 400);
        }

        try {
            $user = wp_get_current_user();
            $checkoutService = new StripeCheckoutService();

            /* Verificar si el usuario ya uso el trial */
            $suscripcionService = new SuscripcionService($userId);
            $suscripcion = $suscripcionService->getSuscripcion();
            $trialDays = empty($suscripcion['trialUsado']) ? 14 : 0;

            $baseUrl = home_url('/');
            $result = $checkoutService->createSubscriptionSession([
                'priceId' => $priceId,
                'successUrl' => $baseUrl . '?checkout=success&session_id={CHECKOUT_SESSION_ID}',
                'cancelUrl' => $baseUrl . '?checkout=cancelled',
                'customerEmail' => $user->user_email,
                'trialDays' => $trialDays,
                'metadata' => [
                    'user_id' => $userId,
                    'plan' => $plan,
                    'wp_user_email' => $user->user_email,
                ],
                'allowPromotionCodes' => true,
            ]);

            if (!$result['success']) {
                return new \WP_REST_Response([
                    'success' => false,
                    'message' => $result['error'] ?? 'Error al crear sesión de pago',
                    'code' => 'checkout_error',
                ], 500);
            }

            return new \WP_REST_Response([
                'success' => true,
                'data' => [
                    'sessionId' => $result['sessionId'],
                    'url' => $result['url'],
                ],
            ], 200);
        } catch (\Exception $e) {
            error_log('[DashboardAPI] Stripe checkout error: ' . $e->getMessage());
            return new \WP_REST_Response([
                'success' => false,
                'message' => 'Error interno al procesar pago',
                'code' => 'internal_error',
            ], 500);
        }
    }

    /**
     * Maneja webhooks de Stripe
     */
    public static function handleStripeWebhook(\WP_REST_Request $request): \WP_REST_Response
    {
        $handler = new StripeWebhookHandler();
        return $handler->handle($request);
    }

    /**
     * Crea una sesion del portal de facturacion de Stripe
     */
    public static function createBillingPortal(\WP_REST_Request $request): \WP_REST_Response
    {
        $userId = get_current_user_id();

        /* Obtener customer ID del usuario */
        $customerId = get_user_meta($userId, 'glory_stripe_customer_id', true);

        if (empty($customerId)) {
            return new \WP_REST_Response([
                'success' => false,
                'message' => 'No tienes una suscripción activa',
                'code' => 'no_subscription',
            ], 400);
        }

        try {
            $client = new \Glory\Services\Stripe\StripeApiClient();
            $result = $client->createBillingPortalSession(
                $customerId,
                home_url('/')
            );

            if (!$result['success']) {
                return new \WP_REST_Response([
                    'success' => false,
                    'message' => $result['error'] ?? 'Error al crear portal',
                    'code' => 'portal_error',
                ], 500);
            }

            return new \WP_REST_Response([
                'success' => true,
                'data' => [
                    'url' => $result['data']['url'],
                ],
            ], 200);
        } catch (\Exception $e) {
            return new \WP_REST_Response([
                'success' => false,
                'message' => 'Error interno',
                'code' => 'internal_error',
            ], 500);
        }
    }
}

/* Registrar el controlador automaticamente */
DashboardApiController::register();
