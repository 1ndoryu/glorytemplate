<?php

/**
 * Registro de controladores y servicios del proyecto Cresta Campers.
 *
 * Este archivo es incluido automáticamente por incluirArchivos('App/').
 * Llama al método register() de cada componente para engancharse a los hooks de WP.
 */

use App\Api\VehiculoController;
use App\Api\DisponibilidadController;
use App\Api\ReservaController;
use App\Api\StripeWebhookHandler;
use App\Api\AdminController;
use App\Admin\ReservaAdmin;
use App\Admin\VehiculoAdmin;
use App\Admin\DashboardWidget;
use App\Admin\ExportReservas;
use App\Config\ReactContext;
use App\Seo\CrestaSeo;

// Registrar endpoints REST
VehiculoController::register();
DisponibilidadController::register();
ReservaController::register();
StripeWebhookHandler::register();
AdminController::register();

// Registrar personalización del admin
ReservaAdmin::register();
VehiculoAdmin::register();
DashboardWidget::register();
ExportReservas::register();

// Registrar contexto React + SEO
ReactContext::register();
CrestaSeo::register();
