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
use App\Kamples\Api\Controladores\ConnectController;
use App\Kamples\Api\Controladores\ExperimentosController;
use App\Kamples\Api\Controladores\EmbeddingsController;
use App\Kamples\Api\Controladores\ComentariosController;
use App\Kamples\Api\Controladores\AuthController;
use App\Kamples\Api\Controladores\GoogleAuthController;
use App\Kamples\Api\Controladores\AdminController;
use App\Kamples\Api\Controladores\DuplicadosController;
use App\Kamples\Api\Controladores\ColaIaController;
use App\Kamples\Api\Controladores\SyncController;
use App\Kamples\Api\Controladores\CancionesController;
use App\Kamples\Api\Controladores\ArtistasController;
use App\Kamples\Api\Controladores\RelacionesController;
use App\Kamples\Api\Controladores\ContribucionesController;
use App\Kamples\Api\Controladores\ReporteLegalController;
use App\Kamples\Api\Controladores\ReporteErrorController;
use App\Kamples\Api\Controladores\ModeracionController;
use App\Kamples\Api\Controladores\DevController;
use App\Kamples\Api\Controladores\ProcesosFondoController;
use App\Kamples\Api\Controladores\PapeleraController;
use App\Kamples\Api\Controladores\DesktopUpdateController;
use App\Kamples\Api\Controladores\BusquedaRapidaController;
use App\Kamples\Api\Controladores\WsController;
use App\Kamples\Api\Controladores\PushController;
use App\Kamples\Api\Controladores\FcmController;
use App\Kamples\Api\Controladores\CodigoGratisController;
use App\Kamples\Api\Controladores\ArticulosController;
use App\Kamples\Api\Controladores\AlgoTimingController;
use App\Kamples\Api\Controladores\AutomatizacionController;

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
        ModeracionController::registrarRutas($ns);
        MensajesController::registrarRutas($ns);
        DashboardController::registrarRutas($ns);
        NotificacionesController::registrarRutas($ns);
        ColeccionesController::registrarRutas($ns);
        ReproduccionesController::registrarRutas($ns);
        PublicacionesController::registrarRutas($ns);
        DescargasController::registrarRutas($ns);
        ColoresController::registrarRutas($ns);
        PagosController::registrarRutas($ns);
        ConnectController::registrarRutas($ns);
        ExperimentosController::registrarRutas($ns);
        EmbeddingsController::registrarRutas($ns);
        ComentariosController::registrarRutas($ns);
        AuthController::registrarRutas($ns);
        GoogleAuthController::registrarRutas($ns);
        AdminController::registrarRutas($ns);
        DuplicadosController::registrarRutas($ns);
        ColaIaController::registrarRutas($ns);
        SyncController::registrarRutas($ns);
        CancionesController::registrarRutas($ns);
        ArtistasController::registrarRutas($ns);
        RelacionesController::registrarRutas($ns);
        ContribucionesController::registrarRutas($ns);
        ReporteLegalController::registrarRutas($ns);
        ReporteErrorController::registrarRutas($ns);
        ProcesosFondoController::registrarRutas($ns);
        PapeleraController::registrarRutas($ns);
        DesktopUpdateController::registrarRutas($ns);
        BusquedaRapidaController::registrarRutas($ns);
        WsController::registrarRutas($ns);
        PushController::registrarRutas($ns);
        FcmController::registrarRutas($ns);
        DevController::registrarRutas($ns);
        CodigoGratisController::registrarRutas($ns);
        ArticulosController::registrarRutas($ns);
        AlgoTimingController::registrarRutas($ns);
        AutomatizacionController::registrarRutas($ns);
    }
}
