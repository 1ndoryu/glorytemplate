<?php

/**
 * Endpoints REST API para el módulo CAP
 * @package Glory\App\Api
 */

namespace Glory\App\Api;

class CapEndpoints
{
    private const NAMESPACE = 'cap/v1';
    private ?CapConfigEndpoints $configEndpoints = null;
    private ?CapAlumnosEndpoints $alumnosEndpoints = null;
    private ?CapAlumnosProgresoEndpoints $alumnosProgresoEndpoints = null;
    private ?CapDisponibilidadEndpoints $disponibilidadEndpoints = null;
    private ?CapCalendarioGeneracionEndpoints $calendarioGeneracionEndpoints = null;
    private ?CapClasesGestionEndpoints $clasesGestionEndpoints = null;
    private ?CapClasesLimpiezaEndpoints $clasesLimpiezaEndpoints = null;
    private ?CapRegistroEndpoints $registroEndpoints = null;
    private ?CapDemoEndpoints $demoEndpoints = null;
    private ?CapStripeEndpoints $stripeEndpoints = null;
    private ?CapReportesEndpoints $reportesEndpoints = null;

    private function obtenerConfigEndpoints(): CapConfigEndpoints
    {
        if ($this->configEndpoints === null) {
            $this->configEndpoints = new CapConfigEndpoints();
        }
        return $this->configEndpoints;
    }

    private function obtenerAlumnosEndpoints(): CapAlumnosEndpoints
    {
        if ($this->alumnosEndpoints === null) {
            $this->alumnosEndpoints = new CapAlumnosEndpoints();
        }
        return $this->alumnosEndpoints;
    }

    private function obtenerAlumnosProgresoEndpoints(): CapAlumnosProgresoEndpoints
    {
        if ($this->alumnosProgresoEndpoints === null) {
            $this->alumnosProgresoEndpoints = new CapAlumnosProgresoEndpoints();
        }
        return $this->alumnosProgresoEndpoints;
    }

    private function obtenerDisponibilidadEndpoints(): CapDisponibilidadEndpoints
    {
        if ($this->disponibilidadEndpoints === null) {
            $this->disponibilidadEndpoints = new CapDisponibilidadEndpoints();
        }
        return $this->disponibilidadEndpoints;
    }

    private function obtenerCalendarioGeneracionEndpoints(): CapCalendarioGeneracionEndpoints
    {
        if ($this->calendarioGeneracionEndpoints === null) {
            $this->calendarioGeneracionEndpoints = new CapCalendarioGeneracionEndpoints();
        }
        return $this->calendarioGeneracionEndpoints;
    }

    private function obtenerClasesGestionEndpoints(): CapClasesGestionEndpoints
    {
        if ($this->clasesGestionEndpoints === null) {
            $this->clasesGestionEndpoints = new CapClasesGestionEndpoints();
        }
        return $this->clasesGestionEndpoints;
    }

    private function obtenerClasesLimpiezaEndpoints(): CapClasesLimpiezaEndpoints
    {
        if ($this->clasesLimpiezaEndpoints === null) {
            $this->clasesLimpiezaEndpoints = new CapClasesLimpiezaEndpoints();
        }
        return $this->clasesLimpiezaEndpoints;
    }

    private function obtenerRegistroEndpoints(): CapRegistroEndpoints
    {
        if ($this->registroEndpoints === null) {
            $this->registroEndpoints = new CapRegistroEndpoints();
        }
        return $this->registroEndpoints;
    }

    private function obtenerDemoEndpoints(): CapDemoEndpoints
    {
        if ($this->demoEndpoints === null) {
            $this->demoEndpoints = new CapDemoEndpoints();
        }
        return $this->demoEndpoints;
    }

    private function obtenerStripeEndpoints(): CapStripeEndpoints
    {
        if ($this->stripeEndpoints === null) {
            $this->stripeEndpoints = new CapStripeEndpoints();
        }
        return $this->stripeEndpoints;
    }

    private function obtenerReportesEndpoints(): CapReportesEndpoints
    {
        if ($this->reportesEndpoints === null) {
            $this->reportesEndpoints = new CapReportesEndpoints();
        }
        return $this->reportesEndpoints;
    }

    public function registrarRutas(): void
    {
        $configEndpoints = $this->obtenerConfigEndpoints();
        $alumnosEndpoints = $this->obtenerAlumnosEndpoints();
        $alumnosProgresoEndpoints = $this->obtenerAlumnosProgresoEndpoints();
        $disponibilidadEndpoints = $this->obtenerDisponibilidadEndpoints();
        $calendarioGeneracionEndpoints = $this->obtenerCalendarioGeneracionEndpoints();
        $clasesGestionEndpoints = $this->obtenerClasesGestionEndpoints();
        $clasesLimpiezaEndpoints = $this->obtenerClasesLimpiezaEndpoints();
        $registroEndpoints = $this->obtenerRegistroEndpoints();
        $demoEndpoints = $this->obtenerDemoEndpoints();
        $stripeEndpoints = $this->obtenerStripeEndpoints();
        $reportesEndpoints = $this->obtenerReportesEndpoints();

        register_rest_route(self::NAMESPACE, '/config', [
            ['methods' => 'GET', 'callback' => $configEndpoints->callbackSeguro('obtenerConfig'), 'permission_callback' => [$configEndpoints, 'verificarPermisos']],
            ['methods' => 'POST', 'callback' => $configEndpoints->callbackSeguro('guardarConfig'), 'permission_callback' => [$configEndpoints, 'verificarPermisos']],
        ]);

        register_rest_route(self::NAMESPACE, '/alumnos', [
            ['methods' => 'GET', 'callback' => $alumnosEndpoints->callbackSeguro('listarAlumnos'), 'permission_callback' => [$alumnosEndpoints, 'verificarPermisos']],
            ['methods' => 'POST', 'callback' => $alumnosEndpoints->callbackSeguro('crearAlumno'), 'permission_callback' => [$alumnosEndpoints, 'verificarPermisos']],
        ]);
        
        register_rest_route(self::NAMESPACE, '/alumnos/por-ids', [
            ['methods' => 'GET', 'callback' => $alumnosEndpoints->callbackSeguro('listarAlumnosPorIds'), 'permission_callback' => [$alumnosEndpoints, 'verificarPermisos']],
        ]);

        register_rest_route(self::NAMESPACE, '/alumnos/(?P<id>\d+)', [
            ['methods' => 'PUT', 'callback' => $alumnosEndpoints->callbackSeguro('actualizarAlumno'), 'permission_callback' => [$alumnosEndpoints, 'verificarPermisos']],
            ['methods' => 'DELETE', 'callback' => $alumnosEndpoints->callbackSeguro('eliminarAlumno'), 'permission_callback' => [$alumnosEndpoints, 'verificarPermisos']],
        ]);

        register_rest_route(self::NAMESPACE, '/alumnos/(?P<id>\d+)/progreso', [
            'methods' => 'GET',
            'callback' => $alumnosProgresoEndpoints->callbackSeguro('obtenerProgresoAlumno'),
            'permission_callback' => [$alumnosProgresoEndpoints, 'verificarPermisos'],
        ]);

        register_rest_route(self::NAMESPACE, '/clases', [
            'methods' => 'GET',
            'callback' => $calendarioGeneracionEndpoints->callbackSeguro('obtenerClases'),
            'permission_callback' => [$calendarioGeneracionEndpoints, 'verificarPermisos'],
        ]);

        register_rest_route(self::NAMESPACE, '/clases/(?P<id>\d+)', [
            ['methods' => 'PUT', 'callback' => $clasesGestionEndpoints->callbackSeguro('actualizarClase'), 'permission_callback' => [$clasesGestionEndpoints, 'verificarPermisos']],
            ['methods' => 'DELETE', 'callback' => $clasesGestionEndpoints->callbackSeguro('eliminarClase'), 'permission_callback' => [$clasesGestionEndpoints, 'verificarPermisos']],
        ]);

        register_rest_route(self::NAMESPACE, '/generar', [
            'methods' => 'POST',
            'callback' => $calendarioGeneracionEndpoints->callbackSeguro('generarCalendario'),
            'permission_callback' => [$calendarioGeneracionEndpoints, 'verificarPermisos'],
        ]);

        register_rest_route(self::NAMESPACE, '/generar/preview', [
            'methods' => 'POST',
            'callback' => $calendarioGeneracionEndpoints->callbackSeguro('previewCalendario'),
            'permission_callback' => [$calendarioGeneracionEndpoints, 'verificarPermisos'],
        ]);

        register_rest_route(self::NAMESPACE, '/generar/con-exclusiones', [
            'methods' => 'POST',
            'callback' => $calendarioGeneracionEndpoints->callbackSeguro('generarConExclusiones'),
            'permission_callback' => [$calendarioGeneracionEndpoints, 'verificarPermisos'],
        ]);

        register_rest_route(self::NAMESPACE, '/clases/(?P<id>\d+)/toggle-bloqueo', [
            'methods' => 'POST',
            'callback' => $clasesGestionEndpoints->callbackSeguro('toggleBloqueoClase'),
            'permission_callback' => [$clasesGestionEndpoints, 'verificarPermisos'],
        ]);

        register_rest_route(self::NAMESPACE, '/dashboard', [
            'methods' => 'GET',
            'callback' => $configEndpoints->callbackSeguro('obtenerDashboard'),
            'permission_callback' => [$configEndpoints, 'verificarPermisos'],
        ]);

        /* Endpoint público de registro */
        register_rest_route(self::NAMESPACE, '/registro', [
            'methods' => 'POST',
            'callback' => $registroEndpoints->callbackSeguro('registrarUsuario'),
            'permission_callback' => '__return_true',
        ]);

        /* Endpoints de disponibilidad */
        register_rest_route(self::NAMESPACE, '/disponibilidad/(?P<alumnoId>\d+)', [
            ['methods' => 'GET', 'callback' => $disponibilidadEndpoints->callbackSeguro('obtenerDisponibilidad'), 'permission_callback' => [$disponibilidadEndpoints, 'verificarPermisos']],
            ['methods' => 'POST', 'callback' => $disponibilidadEndpoints->callbackSeguro('guardarDisponibilidad'), 'permission_callback' => [$disponibilidadEndpoints, 'verificarPermisos']],
        ]);

        /* Endpoints de modo demo (solo administradores) */
        register_rest_route(self::NAMESPACE, '/demo/status', [
            'methods' => 'GET',
            'callback' => $demoEndpoints->callbackSeguro('obtenerEstadoDemo'),
            'permission_callback' => [$demoEndpoints, 'verificarPermisosAdmin'],
        ]);

        register_rest_route(self::NAMESPACE, '/demo/seed', [
            'methods' => 'POST',
            'callback' => $demoEndpoints->callbackSeguro('seedDatosDemo'),
            'permission_callback' => [$demoEndpoints, 'verificarPermisosAdmin'],
        ]);

        register_rest_route(self::NAMESPACE, '/demo/clean', [
            'methods' => 'DELETE',
            'callback' => $demoEndpoints->callbackSeguro('limpiarDatosDemo'),
            'permission_callback' => [$demoEndpoints, 'verificarPermisosAdmin'],
        ]);

        /* Endpoint para eliminar todas las clases (incluye huérfanas) */
        register_rest_route(self::NAMESPACE, '/clases/limpiar-todas', [
            'methods' => 'DELETE',
            'callback' => $clasesLimpiezaEndpoints->callbackSeguro('eliminarTodasLasClases'),
            'permission_callback' => [$clasesLimpiezaEndpoints, 'verificarPermisosAdmin'],
        ]);

        /* Endpoint para eliminar clases de una semana específica */
        register_rest_route(self::NAMESPACE, '/clases/limpiar-semana', [
            'methods' => 'DELETE',
            'callback' => $clasesLimpiezaEndpoints->callbackSeguro('eliminarClasesSemana'),
            'permission_callback' => [$clasesLimpiezaEndpoints, 'verificarPermisos'],
        ]);

        /* Endpoints de reportes PDF */
        register_rest_route(self::NAMESPACE, '/reportes/plan-alumno/(?P<alumnoId>\d+)', [
            'methods' => 'GET',
            'callback' => $reportesEndpoints->callbackSeguro('generarReportePlanAlumno'),
            'permission_callback' => [$reportesEndpoints, 'verificarPermisos'],
        ]);

        register_rest_route(self::NAMESPACE, '/reportes/control-horas', [
            'methods' => 'GET',
            'callback' => $reportesEndpoints->callbackSeguro('generarReporteControlHoras'),
            'permission_callback' => [$reportesEndpoints, 'verificarPermisos'],
        ]);

        /*
         * Endpoint de diagnóstico de progreso (solo admin).
         * Compara datos crudos de BD con datos normalizados para un alumno.
         * Uso temporal para auditar incongruencias.
         */
        register_rest_route(self::NAMESPACE, '/debug/progreso/(?P<id>\d+)', [
            'methods' => 'GET',
            'callback' => $alumnosProgresoEndpoints->callbackSeguro('debugProgresoAlumno'),
            'permission_callback' => [$alumnosProgresoEndpoints, 'verificarPermisosAdmin'],
        ]);

        /* Endpoints de Stripe - Configuración (solo admin) */
        register_rest_route(self::NAMESPACE, '/stripe/config', [
            ['methods' => 'GET', 'callback' => $stripeEndpoints->callbackSeguro('obtenerConfigStripe'), 'permission_callback' => [$stripeEndpoints, 'verificarPermisosAdmin']],
            ['methods' => 'POST', 'callback' => $stripeEndpoints->callbackSeguro('guardarConfigStripe'), 'permission_callback' => [$stripeEndpoints, 'verificarPermisosAdmin']],
        ]);

        /* Checkout (usuarios autenticados) */
        register_rest_route(self::NAMESPACE, '/stripe/checkout', [
            'methods' => 'POST',
            'callback' => $stripeEndpoints->callbackSeguro('crearStripeCheckout'),
            'permission_callback' => [$stripeEndpoints, 'verificarPermisos'],
        ]);

        /* Portal de cliente (usuarios autenticados) */
        register_rest_route(self::NAMESPACE, '/stripe/portal', [
            'methods' => 'POST',
            'callback' => $stripeEndpoints->callbackSeguro('obtenerStripePortal'),
            'permission_callback' => [$stripeEndpoints, 'verificarPermisos'],
        ]);

        /* Webhook de Stripe (público, validado por firma) */
        register_rest_route(self::NAMESPACE, '/stripe-webhook', [
            'methods' => 'POST',
            'callback' => $stripeEndpoints->callbackSeguro('procesarStripeWebhook'),
            'permission_callback' => '__return_true',
        ]);
    }
}
