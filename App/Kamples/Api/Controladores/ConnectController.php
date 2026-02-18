<?php

/**
 * ConnectController — Stripe Connect para creadores (onboarding + payouts).
 *
 * POST /connect/onboarding  — Crear cuenta Express + enlace onboarding
 * GET  /connect/estado       — Estado de la cuenta Connect del creador
 * POST /connect/dashboard    — Generar login link al Stripe Express Dashboard
 * GET  /connect/balance      — Balance disponible/pendiente del creador
 *
 * @package Kamples
 */

namespace App\Kamples\Api\Controladores;

use App\Kamples\Auth\AuthMiddleware;
use App\Kamples\Api\Helpers\UsuarioHelper;
use App\Kamples\Services\StripeService;
use App\Kamples\KamplesLogger;
use App\Config\Schema\_generated\UsuariosExtCols;
use App\Kamples\Database\Repositories\UsuariosExtRepository;

class ConnectController
{
    public static function registrarRutas(string $namespace): void
    {
        register_rest_route($namespace, '/connect/onboarding', [
            'methods'             => 'POST',
            'callback'            => [self::class, 'onboarding'],
            'permission_callback' => [AuthMiddleware::class, 'requerirAuth'],
        ]);

        register_rest_route($namespace, '/connect/estado', [
            'methods'             => 'GET',
            'callback'            => [self::class, 'estado'],
            'permission_callback' => [AuthMiddleware::class, 'requerirAuth'],
        ]);

        register_rest_route($namespace, '/connect/dashboard', [
            'methods'             => 'POST',
            'callback'            => [self::class, 'dashboard'],
            'permission_callback' => [AuthMiddleware::class, 'requerirAuth'],
        ]);

        register_rest_route($namespace, '/connect/balance', [
            'methods'             => 'GET',
            'callback'            => [self::class, 'balance'],
            'permission_callback' => [AuthMiddleware::class, 'requerirAuth'],
        ]);
    }

    /**
     * POST /connect/onboarding — Crea cuenta Express y retorna enlace de onboarding.
     * Si el usuario ya tiene cuenta Connect, genera un nuevo enlace de onboarding
     * (útil si no completó el proceso anterior).
     */
    public static function onboarding(\WP_REST_Request $request): \WP_REST_Response
    {
        $userId = UsuarioHelper::obtenerIdPg();
        if (!$userId) return UsuarioHelper::respuestaNoEncontrado();

        $usuario = UsuarioHelper::obtenerPorId($userId);
        $email = $usuario[UsuariosExtCols::EMAIL] ?? '';

        if (empty($email)) {
            return new \WP_REST_Response([
                'ok' => false,
                'error' => 'Se necesita un email para configurar pagos',
            ], 400);
        }

        $connectId = $usuario[UsuariosExtCols::STRIPE_CONNECT_ID] ?? null;

        /* Si no tiene cuenta Connect, crearla */
        if (empty($connectId)) {
            $cuenta = StripeService::crearCuentaConnect($userId, $email);

            if (isset($cuenta['error'])) {
                KamplesLogger::error('Error creando cuenta Connect', ['error' => $cuenta['error']]);
                return new \WP_REST_Response([
                    'ok' => false,
                    'error' => $cuenta['error']['message'] ?? 'Error al crear cuenta de pagos',
                ], 500);
            }

            $connectId = $cuenta['id'] ?? null;
            if (!$connectId) {
                return new \WP_REST_Response([
                    'ok' => false,
                    'error' => 'No se pudo crear la cuenta de pagos',
                ], 500);
            }

            /* Actualizar rol a creador si aún es 'usuario' */
            if (($usuario[UsuariosExtCols::ROL] ?? 'usuario') === 'usuario') {
                UsuariosExtRepository::cambiarRol($userId, 'creador');
            }
        }

        /* Generar enlace de onboarding */
        $siteUrl = \home_url();
        $urlRetorno = $siteUrl . '/admin/dashboard/?connect=completado';
        $urlRefresh = $siteUrl . '/admin/dashboard/?connect=refresh';

        $enlace = StripeService::crearEnlaceOnboarding($connectId, $urlRetorno, $urlRefresh);

        if (isset($enlace['error'])) {
            KamplesLogger::error('Error generando enlace onboarding', ['error' => $enlace['error']]);
            return new \WP_REST_Response([
                'ok' => false,
                'error' => $enlace['error']['message'] ?? 'Error al generar enlace de configuración',
            ], 500);
        }

        if (!isset($enlace['url'])) {
            return new \WP_REST_Response([
                'ok' => false,
                'error' => 'No se generó URL de onboarding',
            ], 500);
        }

        KamplesLogger::info('Onboarding Connect iniciado', [
            'userId' => $userId,
            'connectId' => $connectId,
        ]);

        return new \WP_REST_Response([
            'ok'  => true,
            'url' => $enlace['url'],
        ], 200);
    }

    /**
     * GET /connect/estado — Retorna el estado de la cuenta Connect del creador.
     */
    public static function estado(): \WP_REST_Response
    {
        $userId = UsuarioHelper::obtenerIdPg();
        if (!$userId) return UsuarioHelper::respuestaNoEncontrado();

        $usuario = UsuarioHelper::obtenerPorId($userId);
        $connectId = $usuario[UsuariosExtCols::STRIPE_CONNECT_ID] ?? null;

        /* Sin cuenta Connect → estado: no_configurado */
        if (empty($connectId)) {
            return new \WP_REST_Response([
                'ok' => true,
                'data' => [
                    'estado'          => 'no_configurado',
                    'connectId'       => null,
                    'cargosActivos'   => false,
                    'payoutsActivos'  => false,
                    'detalle'         => null,
                ],
            ], 200);
        }

        /* Consultar estado real en Stripe */
        $cuenta = StripeService::obtenerCuentaConnect($connectId);

        if (isset($cuenta['error'])) {
            return new \WP_REST_Response([
                'ok' => true,
                'data' => [
                    'estado'          => 'error',
                    'connectId'       => $connectId,
                    'cargosActivos'   => false,
                    'payoutsActivos'  => false,
                    'detalle'         => $cuenta['error']['message'] ?? 'Error consultando Stripe',
                ],
            ], 200);
        }

        $cargosActivos = (bool) ($cuenta['charges_enabled'] ?? false);
        $payoutsActivos = (bool) ($cuenta['payouts_enabled'] ?? false);
        $detallesPendientes = !empty($cuenta['requirements']['currently_due']);

        /* Determinar estado semántico */
        if ($cargosActivos && $payoutsActivos) {
            $estado = 'activo';
        } elseif ($detallesPendientes) {
            $estado = 'pendiente';
        } else {
            $estado = 'restringido';
        }

        return new \WP_REST_Response([
            'ok' => true,
            'data' => [
                'estado'          => $estado,
                'connectId'       => $connectId,
                'cargosActivos'   => $cargosActivos,
                'payoutsActivos'  => $payoutsActivos,
                'detalle'         => $detallesPendientes
                    ? 'Hay información pendiente por completar en Stripe'
                    : null,
                'requerimientosPendientes' => count($cuenta['requirements']['currently_due'] ?? []),
            ],
        ], 200);
    }

    /**
     * POST /connect/dashboard — Genera login_link al Express Dashboard de Stripe.
     */
    public static function dashboard(): \WP_REST_Response
    {
        $userId = UsuarioHelper::obtenerIdPg();
        if (!$userId) return UsuarioHelper::respuestaNoEncontrado();

        $usuario = UsuarioHelper::obtenerPorId($userId);
        $connectId = $usuario[UsuariosExtCols::STRIPE_CONNECT_ID] ?? null;

        if (empty($connectId)) {
            return new \WP_REST_Response([
                'ok' => false,
                'error' => 'No tienes cuenta de pagos configurada. Haz el onboarding primero.',
            ], 400);
        }

        $loginLink = StripeService::crearLoginLink($connectId);

        if (isset($loginLink['error'])) {
            KamplesLogger::error('Error generando login link Connect', ['error' => $loginLink['error']]);
            return new \WP_REST_Response([
                'ok' => false,
                'error' => $loginLink['error']['message'] ?? 'Error al generar enlace del dashboard',
            ], 500);
        }

        return new \WP_REST_Response([
            'ok'  => true,
            'url' => $loginLink['url'],
        ], 200);
    }

    /**
     * GET /connect/balance — Balance disponible y pendiente del creador.
     */
    public static function balance(): \WP_REST_Response
    {
        $userId = UsuarioHelper::obtenerIdPg();
        if (!$userId) return UsuarioHelper::respuestaNoEncontrado();

        $usuario = UsuarioHelper::obtenerPorId($userId);
        $connectId = $usuario[UsuariosExtCols::STRIPE_CONNECT_ID] ?? null;

        if (empty($connectId)) {
            return new \WP_REST_Response([
                'ok' => true,
                'data' => [
                    'disponible' => 0,
                    'pendiente'  => 0,
                    'moneda'     => 'usd',
                ],
            ], 200);
        }

        $balance = StripeService::obtenerBalanceConnect($connectId);

        if (isset($balance['error'])) {
            KamplesLogger::error('Error obteniendo balance Connect', [
                'userId'    => $userId,
                'connectId' => $connectId,
                'error'     => $balance['error'],
            ]);
            return new \WP_REST_Response([
                'ok' => false,
                'error' => 'No se pudo obtener el balance. Intenta de nuevo más tarde.',
            ], 502);
        }

        /* Stripe devuelve amounts en centavos, convertir a dólares */
        $disponible = 0;
        $pendiente = 0;
        $moneda = 'usd';

        if (!empty($balance['available'])) {
            foreach ($balance['available'] as $b) {
                $disponible += (int) ($b['amount'] ?? 0);
                $moneda = $b['currency'] ?? 'usd';
            }
        }

        if (!empty($balance['pending'])) {
            foreach ($balance['pending'] as $b) {
                $pendiente += (int) ($b['amount'] ?? 0);
            }
        }

        return new \WP_REST_Response([
            'ok' => true,
            'data' => [
                'disponible' => $disponible / 100,
                'pendiente'  => $pendiente / 100,
                'moneda'     => $moneda,
            ],
        ], 200);
    }
}
