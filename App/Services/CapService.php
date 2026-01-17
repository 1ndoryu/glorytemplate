<?php

/**
 * Servicio principal del módulo CAP
 * Orquesta la lógica de negocio entre modelos y endpoints
 * 
 * @package Glory\App\Services
 */

namespace Glory\App\Services;

use Glory\App\Models\Alumno;
use Glory\App\Models\Clase;
use Glory\App\Models\Configuracion;

class CapService
{
    private static ?CapService $instance = null;
    private Alumno $alumnoModel;
    private Clase $claseModel;
    private Configuracion $configModel;

    private function __construct()
    {
        $this->alumnoModel = new Alumno();
        $this->claseModel = new Clase();
        $this->configModel = new Configuracion();
    }

    public static function getInstance(): CapService
    {
        if (self::$instance === null) {
            self::$instance = new CapService();
        }
        return self::$instance;
    }

    /**
     * Obtiene el ID del centro asociado al usuario actual
     */
    public function getCentroIdActual(): ?int
    {
        $userId = get_current_user_id();
        if (!$userId) {
            return null;
        }

        return $this->configModel->getCentroIdByUserId($userId);
    }

    /**
     * Verifica si el usuario tiene una suscripción activa
     */
    public function tieneSubscripcionActiva(): bool
    {
        $centroId = $this->getCentroIdActual();
        if (!$centroId) {
            return false;
        }

        global $wpdb;
        $tabla = $wpdb->prefix . 'cap_suscripciones';

        $estado = $wpdb->get_var($wpdb->prepare(
            "SELECT estado FROM {$tabla} WHERE centro_id = %d ORDER BY created_at DESC LIMIT 1",
            $centroId
        ));

        return $estado === 'activa';
    }

    /**
     * Obtiene el resumen del dashboard para el centro actual
     */
    public function getDashboardResumen(): array
    {
        $centroId = $this->getCentroIdActual();
        if (!$centroId) {
            return [
                'error' => 'No se encontró el centro asociado'
            ];
        }

        $alumnos = $this->alumnoModel->contarPorCentro($centroId);
        $clasesEstaSemana = $this->claseModel->contarSemanaActual($centroId);
        $config = $this->configModel->obtener($centroId);

        return [
            'totalAlumnos' => $alumnos,
            'clasesEstaSemana' => $clasesEstaSemana,
            'capacidadMaxima' => $config['alumnos_max_clase'] ?? 20,
            'suscripcionActiva' => $this->tieneSubscripcionActiva(),
        ];
    }
}
