<?php

/**
 * Modelo para configuración de centros/autoescuelas CAP
 * 
 * @package Glory\App\Models
 */

namespace Glory\App\Models;

use App\Config\Schema\_generated\CapCentrosCols;
use App\Config\Schema\_generated\CapConfiguracionCols;

class Configuracion
{
    private string $tablaCentros;
    private string $tablaConfig;

    public function __construct()
    {
        global $wpdb;
        $this->tablaCentros = $wpdb->prefix . CapCentrosCols::TABLA;
        $this->tablaConfig = $wpdb->prefix . CapConfiguracionCols::TABLA;
    }

    /**
     * Obtiene el ID del centro asociado a un usuario
     */
    public function getCentroIdByUserId(int $userId): ?int
    {
        global $wpdb;

        $centroId = $wpdb->get_var($wpdb->prepare(
            "SELECT id FROM {$this->tablaCentros} WHERE user_id = %d",
            $userId
        ));

        return $centroId ? (int) $centroId : null;
    }

    /**
     * Obtiene la configuración de un centro
     */
    public function obtener(int $centroId): array
    {
        global $wpdb;

        $config = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM {$this->tablaConfig} WHERE centro_id = %d",
            $centroId
        ), 'ARRAY_A');

        return $config ?: $this->configuracionDefecto($centroId);
    }

    /**
     * Configuración por defecto para nuevos centros
     */
    private function configuracionDefecto(int $centroId): array
    {
        return [
            CapConfiguracionCols::CENTRO_ID => $centroId,
            CapConfiguracionCols::TIMEZONE => 'Europe/Madrid',
            CapConfiguracionCols::HORA_INICIO_MANANA => '09:00',
            CapConfiguracionCols::HORA_FIN_MANANA => '14:00',
            CapConfiguracionCols::HORA_INICIO_TARDE => '16:00',
            CapConfiguracionCols::HORA_FIN_TARDE => '21:00',
            CapConfiguracionCols::VIERNES_ESPECIAL => 0,
            CapConfiguracionCols::HORA_FIN_VIERNES => '15:00',
            CapConfiguracionCols::ALUMNOS_MAX_CLASE => 20,
            CapConfiguracionCols::DURACION_CLASE => 60,
            CapConfiguracionCols::DURACION_DESCANSO => 15,
        ];
    }

    /**
     * Guarda o actualiza la configuración de un centro
     */
    public function guardar(int $centroId, array $datos): bool
    {
        global $wpdb;

        $existe = $wpdb->get_var($wpdb->prepare(
            "SELECT id FROM {$this->tablaConfig} WHERE centro_id = %d",
            $centroId
        ));

        $datosValidados = $this->validarDatos($datos);
        $datosValidados[CapConfiguracionCols::UPDATED_AT] = current_time('mysql');

        if ($existe) {
            $resultado = $wpdb->update(
                $this->tablaConfig,
                $datosValidados,
                [CapConfiguracionCols::CENTRO_ID => $centroId]
            );
        } else {
            $datosValidados[CapConfiguracionCols::CENTRO_ID] = $centroId;
            $datosValidados[CapConfiguracionCols::CREATED_AT] = current_time('mysql');
            $resultado = $wpdb->insert($this->tablaConfig, $datosValidados);
        }

        return $resultado !== false;
    }

    /**
     * Obtiene los datos del centro (nombre, contacto, etc.)
     */
    public function obtenerDatosCentro(int $centroId): ?array
    {
        global $wpdb;

        $centro = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM {$this->tablaCentros} WHERE id = %d",
            $centroId
        ), 'ARRAY_A');

        return $centro ?: null;
    }

    /**
     * Actualiza los datos del centro
     */
    public function actualizarDatosCentro(int $centroId, array $datos): bool
    {
        global $wpdb;

        $datosValidados = [];

        if (isset($datos[CapCentrosCols::NOMBRE])) {
            $datosValidados[CapCentrosCols::NOMBRE] = sanitize_text_field($datos[CapCentrosCols::NOMBRE]);
        }

        if (isset($datos[CapCentrosCols::DIRECCION])) {
            $datosValidados[CapCentrosCols::DIRECCION] = sanitize_text_field($datos[CapCentrosCols::DIRECCION]);
        }

        if (isset($datos[CapCentrosCols::TELEFONO])) {
            $datosValidados[CapCentrosCols::TELEFONO] = sanitize_text_field($datos[CapCentrosCols::TELEFONO]);
        }

        if (isset($datos[CapCentrosCols::EMAIL])) {
            $email = sanitize_email($datos[CapCentrosCols::EMAIL]);
            if (is_email($email)) {
                $datosValidados[CapCentrosCols::EMAIL] = $email;
            }
        }

        if (isset($datos[CapCentrosCols::LOGO_URL])) {
            $datosValidados[CapCentrosCols::LOGO_URL] = esc_url_raw($datos[CapCentrosCols::LOGO_URL]);
        }

        if (empty($datosValidados)) {
            return false;
        }

        $datosValidados[CapCentrosCols::UPDATED_AT] = current_time('mysql');

        $resultado = $wpdb->update(
            $this->tablaCentros,
            $datosValidados,
            [CapCentrosCols::ID => $centroId]
        );

        return $resultado !== false;
    }

    /**
     * Crea un nuevo centro para un usuario
     */
    public function crearCentro(int $userId, string $nombre): int|false
    {
        global $wpdb;

        /* Verificar que el usuario no tenga ya un centro */
        $existente = $this->getCentroIdByUserId($userId);
        if ($existente) {
            return false;
        }

        $insertado = $wpdb->insert($this->tablaCentros, [
            CapCentrosCols::USER_ID => $userId,
            CapCentrosCols::NOMBRE => sanitize_text_field($nombre),
            CapCentrosCols::CREATED_AT => current_time('mysql'),
            CapCentrosCols::UPDATED_AT => current_time('mysql'),
        ]);

        if (!$insertado) {
            return false;
        }

        $centroId = $wpdb->insert_id;

        /* Crear configuración por defecto */
        $configDefecto = $this->configuracionDefecto($centroId);
        $configDefecto[CapConfiguracionCols::CREATED_AT] = current_time('mysql');
        $configDefecto[CapConfiguracionCols::UPDATED_AT] = current_time('mysql');

        $wpdb->insert($this->tablaConfig, $configDefecto);

        return $centroId;
    }

    /**
     * Valida los datos de configuración
     */
    /**
     * Valida los datos de configuración
     */
    private function validarDatos(array $datos): array
    {
        $validados = [];

        /* Validación de timezone */
        if (isset($datos[CapConfiguracionCols::TIMEZONE])) {
            $tz = sanitize_text_field($datos[CapConfiguracionCols::TIMEZONE]);
            /* Verificar que sea una timezone válida */
            if (in_array($tz, timezone_identifiers_list(), true)) {
                $validados[CapConfiguracionCols::TIMEZONE] = $tz;
            }
        }

        /* Validación relajada de horas (acepta H:MM y HH:MM) */
        $horasValidas = function ($hora) {
            return preg_match('/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/', $hora);
        };

        if (isset($datos[CapConfiguracionCols::HORA_INICIO_MANANA]) && $horasValidas($datos[CapConfiguracionCols::HORA_INICIO_MANANA])) {
            $validados[CapConfiguracionCols::HORA_INICIO_MANANA] = $datos[CapConfiguracionCols::HORA_INICIO_MANANA];
        }

        if (isset($datos[CapConfiguracionCols::HORA_FIN_MANANA]) && $horasValidas($datos[CapConfiguracionCols::HORA_FIN_MANANA])) {
            $validados[CapConfiguracionCols::HORA_FIN_MANANA] = $datos[CapConfiguracionCols::HORA_FIN_MANANA];
        }

        if (isset($datos[CapConfiguracionCols::HORA_INICIO_TARDE]) && $horasValidas($datos[CapConfiguracionCols::HORA_INICIO_TARDE])) {
            $validados[CapConfiguracionCols::HORA_INICIO_TARDE] = $datos[CapConfiguracionCols::HORA_INICIO_TARDE];
        }

        if (isset($datos[CapConfiguracionCols::HORA_FIN_TARDE]) && $horasValidas($datos[CapConfiguracionCols::HORA_FIN_TARDE])) {
            $validados[CapConfiguracionCols::HORA_FIN_TARDE] = $datos[CapConfiguracionCols::HORA_FIN_TARDE];
        }

        if (isset($datos[CapConfiguracionCols::HORA_FIN_VIERNES]) && $horasValidas($datos[CapConfiguracionCols::HORA_FIN_VIERNES])) {
            $validados[CapConfiguracionCols::HORA_FIN_VIERNES] = $datos[CapConfiguracionCols::HORA_FIN_VIERNES];
        }

        if (isset($datos[CapConfiguracionCols::VIERNES_ESPECIAL])) {
            $validados[CapConfiguracionCols::VIERNES_ESPECIAL] = $datos[CapConfiguracionCols::VIERNES_ESPECIAL] ? 1 : 0;
        }

        /* Validación de Horarios Semanales (JSON Flexible) */
        if (isset($datos[CapConfiguracionCols::HORARIOS_SEMANALES])) {
            /* Si viene como string JSON, decodificar primero para validar */
            $horarios = is_string($datos[CapConfiguracionCols::HORARIOS_SEMANALES])
                ? json_decode($datos[CapConfiguracionCols::HORARIOS_SEMANALES], true)
                : $datos[CapConfiguracionCols::HORARIOS_SEMANALES];

            if (is_array($horarios)) {
                /* Sanitizar estructura: { lunes: [{inicio: '09:00', fin: '14:00'}], ... } */
                $horariosLimpios = [];
                $diasValidos = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];

                foreach ($diasValidos as $dia) {
                    if (isset($horarios[$dia]) && is_array($horarios[$dia])) {
                        $horariosLimpios[$dia] = [];
                        foreach ($horarios[$dia] as $rango) {
                            if (
                                isset($rango['inicio'], $rango['fin']) &&
                                $horasValidas($rango['inicio']) &&
                                $horasValidas($rango['fin'])
                            ) {
                                $horariosLimpios[$dia][] = [
                                    'inicio' => sanitize_text_field($rango['inicio']),
                                    'fin' => sanitize_text_field($rango['fin'])
                                ];
                            }
                        }
                    }
                }
                /* Guardar como JSON string */
                $validados[CapConfiguracionCols::HORARIOS_SEMANALES] = json_encode($horariosLimpios);
            }
        }

        if (isset($datos[CapConfiguracionCols::ALUMNOS_MAX_CLASE])) {
            $max = (int) $datos[CapConfiguracionCols::ALUMNOS_MAX_CLASE];
            $validados[CapConfiguracionCols::ALUMNOS_MAX_CLASE] = max(1, min(100, $max));
        }

        if (isset($datos[CapConfiguracionCols::DURACION_CLASE])) {
            $duracion = (int) $datos[CapConfiguracionCols::DURACION_CLASE];
            $validados[CapConfiguracionCols::DURACION_CLASE] = max(30, min(120, $duracion));
        }

        if (isset($datos[CapConfiguracionCols::DURACION_DESCANSO])) {
            $descanso = (int) $datos[CapConfiguracionCols::DURACION_DESCANSO];
            $validados[CapConfiguracionCols::DURACION_DESCANSO] = max(5, min(60, $descanso));
        }

        return $validados;
    }

    /**
     * Método auxiliar para asegurar que las columnas existen (Migración on-the-fly)
     */
    public function asegurarColumnaFlexibilidad(): void
    {
        global $wpdb;
        
        /* Verificar y crear columna horarios_semanales si no existe */
        $row = $wpdb->get_results("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = '{$this->tablaConfig}' AND COLUMN_NAME = 'horarios_semanales'");
        if (empty($row)) {
            $wpdb->query("ALTER TABLE {$this->tablaConfig} ADD COLUMN horarios_semanales LONGTEXT NULL DEFAULT NULL");
        }

        /* Verificar y crear columna timezone si no existe */
        $rowTz = $wpdb->get_results("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = '{$this->tablaConfig}' AND COLUMN_NAME = 'timezone'");
        if (empty($rowTz)) {
            $wpdb->query("ALTER TABLE {$this->tablaConfig} ADD COLUMN timezone VARCHAR(100) DEFAULT 'Europe/Madrid'");
        }
    }
}
