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
     * Si el usuario no tiene centro y tiene rol apropiado, lo crea automáticamente
     */
    public function getCentroIdActual(): ?int
    {
        $userId = get_current_user_id();
        if (!$userId) {
            return null;
        }

        $centroId = $this->configModel->getCentroIdByUserId($userId);

        /*
         * H.7 Fix: Si el usuario tiene rol cap_admin o administrator pero no tiene centro,
         * crear uno automáticamente. Esto soluciona el caso de usuarios que no
         * pasaron por el flujo de registro.
         */
        if (!$centroId) {
            $user = wp_get_current_user();
            $tieneRolValido = in_array('cap_admin', $user->roles) || in_array('administrator', $user->roles);

            if ($tieneRolValido) {
                $nombreCentro = 'Centro de ' . $user->display_name;
                $centroId = $this->configModel->crearCentro($userId, $nombreCentro);

                if ($centroId) {
                    /* Crear suscripción trial para el nuevo centro */
                    global $wpdb;
                    $tablaSuscripciones = $wpdb->prefix . 'cap_suscripciones';
                    $wpdb->insert($tablaSuscripciones, [
                        'centro_id' => $centroId,
                        'estado' => 'activa',
                        'fecha_inicio' => current_time('mysql'),
                        'fecha_fin' => date('Y-m-d', strtotime('+14 days')),
                        'created_at' => current_time('mysql'),
                        'updated_at' => current_time('mysql'),
                    ]);

                    error_log("[CAP] Centro creado automáticamente para user_id: {$userId}, centro_id: {$centroId}");
                }
            }
        }

        return $centroId;
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
