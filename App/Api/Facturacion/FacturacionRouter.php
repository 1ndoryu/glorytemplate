<?php

namespace App\Api\Facturacion;

use App\Api\Facturacion\Controllers\ServiciosController;
use App\Api\Facturacion\Controllers\TrabajosController;
use App\Api\Facturacion\Controllers\FacturasController;
use App\Api\Facturacion\Controllers\ProductosController;
use App\Api\Facturacion\Controllers\UsuarioController;
use App\Api\Facturacion\Controllers\AdminStatsController;
use App\Api\Facturacion\Controllers\SetupController;
use App\Api\Facturacion\Controllers\BaseController;
use WP_REST_Server;

class FacturacionRouter
{
    private const API_NAMESPACE = 'glory/v1';

    public static function register(): void
    {
        add_action('rest_api_init', [self::class, 'registerRoutes']);
    }

    public static function registerRoutes(): void
    {
        /* Usuario actual */
        register_rest_route(self::API_NAMESPACE, '/usuario', [
            'methods' => WP_REST_Server::READABLE,
            'callback' => [UsuarioController::class, 'getUsuarioActual'],
            'permission_callback' => '__return_true',
        ]);

        /* Servicios publicados (catálogo) */
        register_rest_route(self::API_NAMESPACE, '/servicios', [
            [
                'methods' => WP_REST_Server::READABLE,
                'callback' => [ServiciosController::class, 'getServicios'],
                'permission_callback' => '__return_true',
            ],
            [
                'methods' => WP_REST_Server::CREATABLE,
                'callback' => [ServiciosController::class, 'crearServicio'],
                'permission_callback' => [ServiciosController::class, 'puedeCrearServicios'],
            ],
        ]);

        register_rest_route(self::API_NAMESPACE, '/servicios/(?P<id>\d+)', [
            'methods' => WP_REST_Server::READABLE,
            'callback' => [ServiciosController::class, 'getServicio'],
            'permission_callback' => '__return_true',
            'args' => self::validarIdArg(),
        ]);

        /* Trabajos contratados */
        register_rest_route(self::API_NAMESPACE, '/trabajos', [
            'methods' => WP_REST_Server::READABLE,
            'callback' => [TrabajosController::class, 'getTrabajos'],
            'permission_callback' => [BaseController::class, 'estaAutenticado'],
        ]);

        register_rest_route(self::API_NAMESPACE, '/trabajos/(?P<id>\d+)', [
            'methods' => WP_REST_Server::READABLE,
            'callback' => [TrabajosController::class, 'getTrabajo'],
            'permission_callback' => [TrabajosController::class, 'puedeVerTrabajo'],
            'args' => self::validarIdArg(),
        ]);

        register_rest_route(self::API_NAMESPACE, '/trabajos/(?P<id>\d+)/progreso', [
            'methods' => WP_REST_Server::CREATABLE,
            'callback' => [TrabajosController::class, 'actualizarProgreso'],
            'permission_callback' => [TrabajosController::class, 'esProveedorDelTrabajo'],
            'args' => self::validarIdArg(),
        ]);

        /* Hostings */
        register_rest_route(self::API_NAMESPACE, '/hostings', [
            'methods' => WP_REST_Server::READABLE,
            'callback' => [ProductosController::class, 'getHostings'],
            'permission_callback' => [BaseController::class, 'estaAutenticado'],
        ]);

        /* Dominios */
        register_rest_route(self::API_NAMESPACE, '/dominios', [
            'methods' => WP_REST_Server::READABLE,
            'callback' => [ProductosController::class, 'getDominios'],
            'permission_callback' => [BaseController::class, 'estaAutenticado'],
        ]);

        /* Facturas */
        register_rest_route(self::API_NAMESPACE, '/facturas', [
            'methods' => WP_REST_Server::READABLE,
            'callback' => [FacturasController::class, 'getFacturas'],
            'permission_callback' => [BaseController::class, 'estaAutenticado'],
        ]);

        register_rest_route(self::API_NAMESPACE, '/facturas/(?P<id>\d+)', [
            'methods' => WP_REST_Server::READABLE,
            'callback' => [FacturasController::class, 'getFactura'],
            'permission_callback' => [FacturasController::class, 'puedeVerFactura'],
            'args' => self::validarIdArg(),
        ]);

        register_rest_route(self::API_NAMESPACE, '/facturas/(?P<id>\d+)/pagar', [
            'methods' => WP_REST_Server::CREATABLE,
            'callback' => [FacturasController::class, 'iniciarPagoFactura'],
            'permission_callback' => [FacturasController::class, 'puedeVerFactura'],
            'args' => self::validarIdArg(),
        ]);

        /* Admin: Listado global de clientes */
        register_rest_route(self::API_NAMESPACE, '/admin/clientes', [
            'methods' => WP_REST_Server::READABLE,
            'callback' => [AdminStatsController::class, 'getClientes'],
            'permission_callback' => [BaseController::class, 'esAdmin'],
        ]);

        /* Admin: Dashboard stats */
        register_rest_route(self::API_NAMESPACE, '/admin/stats', [
            'methods' => WP_REST_Server::READABLE,
            'callback' => [AdminStatsController::class, 'getEstadisticasAdmin'],
            'permission_callback' => [BaseController::class, 'esAdmin'],
        ]);

        /* Setup / Seed */
        register_rest_route(self::API_NAMESPACE, '/seed', [
            'methods' => WP_REST_Server::CREATABLE,
            'callback' => [SetupController::class, 'runSeed'],
            'permission_callback' => [BaseController::class, 'esAdmin'],
        ]);
    }

    private static function validarIdArg(): array
    {
        return [
            'id' => [
                'validate_callback' => function ($param) {
                    return is_numeric($param) && $param > 0;
                },
            ],
        ];
    }
}
