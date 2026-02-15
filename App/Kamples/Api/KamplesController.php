<?php

/**
 * KamplesController — Router principal de la API REST.
 *
 * Solo registra rutas y delega a sub-controladores por dominio (SOLID SRP).
 * Toda la lógica de negocio vive en App\Kamples\Api\Controladores\*.
 *
 * @package Kamples
 */

namespace App\Kamples\Api;

use App\Kamples\Api\Controladores\DiagnosticoController;
use App\Kamples\Api\Controladores\SamplesController;
use App\Kamples\Api\Controladores\PerfilController;
use App\Kamples\Api\Controladores\SocialController;
use App\Kamples\Api\Controladores\MensajesController;
use App\Kamples\Api\Controladores\DashboardController;
use App\Kamples\Api\Controladores\NotificacionesController;
use App\Kamples\Api\Controladores\ColeccionesController;
use App\Kamples\Api\Controladores\ReproduccionesController;
use App\Kamples\Api\Controladores\PublicacionesController;
use App\Kamples\Api\Controladores\DescargasController;
use App\Kamples\Api\Controladores\ColoresController;
use App\Kamples\Api\Controladores\PagosController;

class KamplesController
{
    public const NAMESPACE = 'kamples/v1';

    /*
     * Registra el hook rest_api_init.
     * Se invoca desde KamplesInit::init().
     */
    public static function registrar(): void
    {
        add_action('rest_api_init', [self::class, 'registrarRutas']);
    }

    /*
     * Delega el registro de rutas a cada sub-controlador.
     * Cada controlador registra sus propias rutas bajo el namespace compartido.
     */
    public static function registrarRutas(): void
    {
        $ns = self::NAMESPACE;

        DiagnosticoController::registrarRutas($ns);
        SamplesController::registrarRutas($ns);
        PerfilController::registrarRutas($ns);
        SocialController::registrarRutas($ns);
        MensajesController::registrarRutas($ns);
        DashboardController::registrarRutas($ns);
        NotificacionesController::registrarRutas($ns);
        ColeccionesController::registrarRutas($ns);
        ReproduccionesController::registrarRutas($ns);
        PublicacionesController::registrarRutas($ns);
        DescargasController::registrarRutas($ns);
        ColoresController::registrarRutas($ns);
        PagosController::registrarRutas($ns);
    }
}
