<?php

/**
 * Modelo para configuración de centros/autoescuelas CAP
 * 
 * @package Glory\App\Models
 */

namespace Glory\App\Models;

class Configuracion
{
    private string $tablaCentros;
    private string $tablaConfig;

    public function __construct()
    {
        global $wpdb;
        $this->tablaCentros = $wpdb->prefix . 'cap_centros';
        $this->tablaConfig = $wpdb->prefix . 'cap_configuracion';
        $this->asegurarColumnaFlexibilidad();
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
        ), ARRAY_A);

        return $config ?: $this->configuracionDefecto($centroId);
    }

    /**
     * Configuración por defecto para nuevos centros
     */
    private function configuracionDefecto(int $centroId): array
    {
        return [
            'centro_id' => $centroId,
            'hora_inicio_manana' => '09:00',
            'hora_fin_manana' => '14:00',
            'hora_inicio_tarde' => '16:00',
            'hora_fin_tarde' => '21:00',
            'viernes_especial' => 0,
            'hora_fin_viernes' => '15:00',
            'alumnos_max_clase' => 20,
            'duracion_clase' => 60,
            'duracion_descanso' => 15,
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
        $datosValidados['updated_at'] = current_time('mysql');

        if ($existe) {
            $resultado = $wpdb->update(
                $this->tablaConfig,
                $datosValidados,
                ['centro_id' => $centroId]
            );
        } else {
            $datosValidados['centro_id'] = $centroId;
            $datosValidados['created_at'] = current_time('mysql');
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
        ), ARRAY_A);

        return $centro ?: null;
    }

    /**
     * Actualiza los datos del centro
     */
    public function actualizarDatosCentro(int $centroId, array $datos): bool
    {
        global $wpdb;

        $datosValidados = [];

        if (isset($datos['nombre'])) {
            $datosValidados['nombre'] = sanitize_text_field($datos['nombre']);
        }

        if (isset($datos['direccion'])) {
            $datosValidados['direccion'] = sanitize_text_field($datos['direccion']);
        }

        if (isset($datos['telefono'])) {
            $datosValidados['telefono'] = sanitize_text_field($datos['telefono']);
        }

        if (isset($datos['email'])) {
            $email = sanitize_email($datos['email']);
            if (is_email($email)) {
                $datosValidados['email'] = $email;
            }
        }

        if (isset($datos['logo_url'])) {
            $datosValidados['logo_url'] = esc_url_raw($datos['logo_url']);
        }

        if (empty($datosValidados)) {
            return false;
        }

        $datosValidados['updated_at'] = current_time('mysql');

        $resultado = $wpdb->update(
            $this->tablaCentros,
            $datosValidados,
            ['id' => $centroId]
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
            'user_id' => $userId,
            'nombre' => sanitize_text_field($nombre),
            'created_at' => current_time('mysql'),
            'updated_at' => current_time('mysql'),
        ]);

        if (!$insertado) {
            return false;
        }

        $centroId = $wpdb->insert_id;

        /* Crear configuración por defecto */
        $configDefecto = $this->configuracionDefecto($centroId);
        $configDefecto['created_at'] = current_time('mysql');
        $configDefecto['updated_at'] = current_time('mysql');

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

        /* Validación relajada de horas (acepta H:MM y HH:MM) */
        $horasValidas = function ($hora) {
            return preg_match('/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/', $hora);
        };

        if (isset($datos['hora_inicio_manana']) && $horasValidas($datos['hora_inicio_manana'])) {
            $validados['hora_inicio_manana'] = $datos['hora_inicio_manana'];
        }

        if (isset($datos['hora_fin_manana']) && $horasValidas($datos['hora_fin_manana'])) {
            $validados['hora_fin_manana'] = $datos['hora_fin_manana'];
        }

        if (isset($datos['hora_inicio_tarde']) && $horasValidas($datos['hora_inicio_tarde'])) {
            $validados['hora_inicio_tarde'] = $datos['hora_inicio_tarde'];
        }

        if (isset($datos['hora_fin_tarde']) && $horasValidas($datos['hora_fin_tarde'])) {
            $validados['hora_fin_tarde'] = $datos['hora_fin_tarde'];
        }

        if (isset($datos['hora_fin_viernes']) && $horasValidas($datos['hora_fin_viernes'])) {
            $validados['hora_fin_viernes'] = $datos['hora_fin_viernes'];
        }

        if (isset($datos['viernes_especial'])) {
            $validados['viernes_especial'] = $datos['viernes_especial'] ? 1 : 0;
        }

        /* Validación de Horarios Semanales (JSON Flexible) */
        if (isset($datos['horarios_semanales'])) {
            /* Si viene como string JSON, decodificar primero para validar */
            $horarios = is_string($datos['horarios_semanales'])
                ? json_decode($datos['horarios_semanales'], true)
                : $datos['horarios_semanales'];

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
                $validados['horarios_semanales'] = json_encode($horariosLimpios);
            }
        }

        if (isset($datos['alumnos_max_clase'])) {
            $max = absint($datos['alumnos_max_clase']);
            $validados['alumnos_max_clase'] = max(1, min(100, $max));
        }

        if (isset($datos['duracion_clase'])) {
            $duracion = absint($datos['duracion_clase']);
            $validados['duracion_clase'] = max(30, min(120, $duracion));
        }

        if (isset($datos['duracion_descanso'])) {
            $descanso = absint($datos['duracion_descanso']);
            $validados['duracion_descanso'] = max(5, min(60, $descanso));
        }

        return $validados;
    }

    /**
     * Método auxiliar para asegurar que la columna existe (Migración on-the-fly)
     * Se puede llamar desde el constructor o antes de guardar
     */
    public function asegurarColumnaFlexibilidad(): void
    {
        global $wpdb;
        $row = $wpdb->get_results("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = '{$this->tablaConfig}' AND COLUMN_NAME = 'horarios_semanales'");

        if (empty($row)) {
            $wpdb->query("ALTER TABLE {$this->tablaConfig} ADD COLUMN horarios_semanales LONGTEXT NULL DEFAULT NULL");
        }
    }
}
