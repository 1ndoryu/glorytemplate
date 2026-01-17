<?php

/**
 * Motor de generación de calendarios CAP
 * Implementa el algoritmo de asignación respetando reglas legales
 * 
 * @package Glory\App\Services
 */

namespace Glory\App\Services;

class CalendarEngine
{
    /* Constantes legales del curso CAP */
    const HORAS_TOTALES_CURSO = 35;
    const MINIMO_DIAS = 4;
    const MAXIMO_HORAS_DIA_ALUMNO = 9;
    const DESCANSO_6_HORAS = 30; // minutos
    const DESCANSO_9_HORAS = 45; // minutos

    /* Asignaturas del CAP con sus duraciones en horas */
    const ASIGNATURAS = [
        'conduccion_prevencion' => ['nombre' => 'Conducción y Prevención', 'horas' => 7],
        'reglamentacion' => ['nombre' => 'Reglamentación', 'horas' => 4],
        'logistica' => ['nombre' => 'Logística', 'horas' => 4],
        'medio_ambiente' => ['nombre' => 'Medio Ambiente', 'horas' => 4],
        'seguridad_vial' => ['nombre' => 'Seguridad Vial', 'horas' => 4],
        'salud' => ['nombre' => 'Salud', 'horas' => 4],
        'servicio' => ['nombre' => 'Servicio', 'horas' => 4],
        'emergencias' => ['nombre' => 'Emergencias', 'horas' => 4],
    ];

    private int $centroId;
    private array $configuracion;
    private array $disponibilidadAlumnos;
    private array $clasesBloquedas;

    public function __construct(int $centroId)
    {
        $this->centroId = $centroId;
        $this->cargarConfiguracion();
    }

    /**
     * Carga la configuración del centro desde la base de datos
     */
    private function cargarConfiguracion(): void
    {
        global $wpdb;
        $tabla = $wpdb->prefix . 'cap_configuracion';

        $config = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM {$tabla} WHERE centro_id = %d",
            $this->centroId
        ), ARRAY_A);

        $this->configuracion = $config ?: $this->configuracionDefecto();
    }

    /**
     * Configuración por defecto si no existe
     */
    private function configuracionDefecto(): array
    {
        return [
            'hora_inicio_manana' => '09:00',
            'hora_fin_manana' => '14:00',
            'hora_inicio_tarde' => '16:00',
            'hora_fin_tarde' => '21:00',
            'viernes_especial' => false,
            'hora_fin_viernes' => '15:00',
            'alumnos_max_clase' => 20,
            'duracion_clase' => 60, // minutos
        ];
    }

    /**
     * Genera el calendario para la semana especificada
     * 
     * @param string $fechaInicioSemana Fecha del lunes (Y-m-d)
     * @param array $alumnosIds IDs de alumnos a incluir
     * @return array Resultado con clases generadas y posibles conflictos
     */
    public function generar(string $fechaInicioSemana, array $alumnosIds): array
    {
        $this->cargarDisponibilidad($alumnosIds);
        $this->cargarClasesBloqueadas($fechaInicioSemana);

        $conflictos = [];
        $clasesGeneradas = [];

        /* 
         * TO-DO: Implementar algoritmo completo de asignación
         * 1. Crear matriz de slots disponibles por día
         * 2. Cruzar con disponibilidad de cada alumno
         * 3. Detectar conflictos de aforo
         * 4. Distribuir asignaturas óptimamente
         * 5. Respetar clases bloqueadas
         */

        return [
            'exito' => empty($conflictos),
            'clases' => $clasesGeneradas,
            'conflictos' => $conflictos,
        ];
    }

    /**
     * Carga la disponibilidad de los alumnos seleccionados
     */
    private function cargarDisponibilidad(array $alumnosIds): void
    {
        global $wpdb;
        $tabla = $wpdb->prefix . 'cap_disponibilidad';

        $placeholders = implode(',', array_fill(0, count($alumnosIds), '%d'));
        $query = $wpdb->prepare(
            "SELECT alumno_id, dia_semana, hora_inicio, hora_fin 
             FROM {$tabla} 
             WHERE alumno_id IN ($placeholders)",
            $alumnosIds
        );

        $resultados = $wpdb->get_results($query, ARRAY_A);

        $this->disponibilidadAlumnos = [];
        foreach ($resultados as $row) {
            $alumnoId = $row['alumno_id'];
            if (!isset($this->disponibilidadAlumnos[$alumnoId])) {
                $this->disponibilidadAlumnos[$alumnoId] = [];
            }
            $this->disponibilidadAlumnos[$alumnoId][] = [
                'dia' => $row['dia_semana'],
                'inicio' => $row['hora_inicio'],
                'fin' => $row['hora_fin'],
            ];
        }
    }

    /**
     * Carga las clases ya bloqueadas para la semana
     */
    private function cargarClasesBloqueadas(string $fechaInicioSemana): void
    {
        global $wpdb;
        $tabla = $wpdb->prefix . 'cap_clases';

        $fechaFin = date('Y-m-d', strtotime($fechaInicioSemana . ' +4 days'));

        $this->clasesBloquedas = $wpdb->get_results($wpdb->prepare(
            "SELECT * FROM {$tabla} 
             WHERE centro_id = %d 
             AND fecha BETWEEN %s AND %s 
             AND bloqueada = 1",
            $this->centroId,
            $fechaInicioSemana,
            $fechaFin
        ), ARRAY_A);
    }

    /**
     * Valida que un calendario cumple las reglas del CAP
     */
    public function validarReglas(array $clases, int $alumnoId): array
    {
        $errores = [];

        $horasTotales = $this->calcularHorasTotales($clases, $alumnoId);
        $diasUnicos = $this->contarDiasUnicos($clases, $alumnoId);
        $maxHorasDia = $this->calcularMaxHorasDia($clases, $alumnoId);

        if ($horasTotales < self::HORAS_TOTALES_CURSO) {
            $errores[] = "Faltan " . (self::HORAS_TOTALES_CURSO - $horasTotales) . " horas para completar el curso";
        }

        if ($diasUnicos < self::MINIMO_DIAS) {
            $errores[] = "El curso debe realizarse en al menos " . self::MINIMO_DIAS . " días";
        }

        if ($maxHorasDia > self::MAXIMO_HORAS_DIA_ALUMNO) {
            $errores[] = "Ningún día puede superar " . self::MAXIMO_HORAS_DIA_ALUMNO . " horas por alumno";
        }

        return $errores;
    }

    private function calcularHorasTotales(array $clases, int $alumnoId): float
    {
        /* TO-DO: Implementar cálculo real */
        return 0;
    }

    private function contarDiasUnicos(array $clases, int $alumnoId): int
    {
        /* TO-DO: Implementar conteo real */
        return 0;
    }

    private function calcularMaxHorasDia(array $clases, int $alumnoId): float
    {
        /* TO-DO: Implementar cálculo real */
        return 0;
    }
}
