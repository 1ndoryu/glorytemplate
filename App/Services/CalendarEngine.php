<?php

/**
 * Motor de generación de calendarios CAP
 * Implementa el algoritmo de asignación respetando reglas legales
 * 
 * Algoritmo:
 * 1. Crear slots disponibles según configuración del centro
 * 2. Cruzar con disponibilidad de cada alumno
 * 3. Detectar conflictos de aforo
 * 4. Distribuir asignaturas óptimamente
 * 5. Respetar clases bloqueadas
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
        'conduccion_racional' => ['nombre' => 'Conducción racional', 'codigo' => 'CR', 'horas' => 7],
        'reglamentacion' => ['nombre' => 'Reglamentación', 'codigo' => 'REG', 'horas' => 4],
        'seguridad_vial' => ['nombre' => 'Seguridad vial', 'codigo' => 'SV', 'horas' => 6],
        'servicio_logistica' => ['nombre' => 'Servicio y logística', 'codigo' => 'SL', 'horas' => 4],
        'salud_seguridad' => ['nombre' => 'Salud y seguridad', 'codigo' => 'SS', 'horas' => 4],
        'medio_ambiente' => ['nombre' => 'Medio ambiente', 'codigo' => 'MA', 'horas' => 4],
        'mercancias_peligrosas' => ['nombre' => 'Mercancías peligrosas', 'codigo' => 'MP', 'horas' => 3],
        'viajeros' => ['nombre' => 'Viajeros', 'codigo' => 'VIA', 'horas' => 3],
    ];

    private int $centroId;
    private array $configuracion;
    private array $disponibilidadAlumnos;
    private array $clasesBloquedas;
    private array $slotsDisponibles;
    private int $duracionClase;
    private int $alumnosMaxClase;

    public function __construct(int $centroId)
    {
        $this->centroId = $centroId;
        $this->cargarConfiguracion();
        $this->aplicarTimezone();
    }

    /**
     * Aplica la zona horaria configurada para el centro
     */
    private function aplicarTimezone(): void
    {
        $timezone = $this->configuracion['timezone'] ?? 'Europe/Madrid';
        
        /* Validar que la timezone sea válida */
        if (in_array($timezone, timezone_identifiers_list(), true)) {
            date_default_timezone_set($timezone);
        } else {
            /* Fallback a Europe/Madrid si la timezone no es válida */
            date_default_timezone_set('Europe/Madrid');
        }
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
        ), 'ARRAY_A');

        $this->configuracion = $config ?: $this->configuracionDefecto();
        $this->duracionClase = (int) ($this->configuracion['duracion_clase'] ?? 60);
        $this->alumnosMaxClase = (int) ($this->configuracion['alumnos_max_clase'] ?? 20);
    }

    /**
     * Configuración por defecto si no existe
     */
    private function configuracionDefecto(): array
    {
        return [
            'timezone' => 'Europe/Madrid',
            'hora_inicio_manana' => '09:00',
            'hora_fin_manana' => '14:00',
            'hora_inicio_tarde' => '16:00',
            'hora_fin_tarde' => '21:00',
            'viernes_especial' => false,
            'hora_fin_viernes' => '15:00',
            'alumnos_max_clase' => 20,
            'duracion_clase' => 60,
            'duracion_descanso' => 15,
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
        if (empty($alumnosIds)) {
            return [
                'exito' => false,
                'clases' => [],
                'conflictos' => [],
                'mensaje' => 'No hay alumnos seleccionados para generar el calendario'
            ];
        }

        $this->cargarDisponibilidad($alumnosIds);
        $this->cargarClasesBloqueadas($fechaInicioSemana);
        $this->generarSlotsDisponibles($fechaInicioSemana);

        $conflictos = [];
        $clasesGeneradas = [];

        /* Paso 1: Crear matriz de demanda por slot */
        $demandaPorSlot = $this->calcularDemandaPorSlot($alumnosIds);

        /* Paso 2: Detectar conflictos de aforo */
        $conflictos = $this->detectarConflictosAforo($demandaPorSlot);

        /* Paso 3: Si hay conflictos, retornar para que el usuario resuelva */
        if (!empty($conflictos)) {
            return [
                'exito' => false,
                'clases' => [],
                'conflictos' => $conflictos,
                'mensaje' => 'Se detectaron conflictos de aforo que requieren atención'
            ];
        }

        /* Paso 4: Generar distribución de asignaturas */
        $distribucion = $this->distribuirAsignaturas($demandaPorSlot);

        /* Paso 5: Crear las clases en la base de datos */
        $clasesGeneradas = $this->crearClases($distribucion, $fechaInicioSemana);

        /* Paso 6: Calcular avisos de horas no cubiertas */
        $avisos = $this->calcularAvisosHorasNoCubiertas($demandaPorSlot, $fechaInicioSemana);

        return [
            'exito' => true,
            'clases' => $clasesGeneradas,
            'conflictos' => [],
            'avisos' => $avisos,
            'mensaje' => 'Calendario generado exitosamente'
        ];
    }

    /**
     * Mapeo de nombre de día a número (1=lunes ... 5=viernes)
     */
    private const DIAS_A_NUMERO = [
        'lunes' => 1,
        'martes' => 2,
        'miercoles' => 3,
        'miércoles' => 3,
        'jueves' => 4,
        'viernes' => 5,
    ];

    /**
     * Carga la disponibilidad de los alumnos seleccionados
     * 
     * Lee columnas dia (varchar: "lunes", "martes"...) y hora (slot: "09:00")
     * del esquema real y las convierte al formato interno del motor.
     */
    private function cargarDisponibilidad(array $alumnosIds): void
    {
        global $wpdb;
        $tabla = $wpdb->prefix . 'cap_disponibilidad';

        if (empty($alumnosIds)) {
            $this->disponibilidadAlumnos = [];
            return;
        }

        $placeholders = implode(',', array_fill(0, count($alumnosIds), '%d'));
        $query = $wpdb->prepare(
            "SELECT alumno_id, dia, hora, disponible 
             FROM {$tabla} 
             WHERE alumno_id IN ($placeholders)
             AND disponible = 1",
            $alumnosIds
        );

        $resultados = $wpdb->get_results($query, 'ARRAY_A');

        $this->disponibilidadAlumnos = [];
        foreach ($resultados as $row) {
            $alumnoId = (int) $row['alumno_id'];
            $diaTexto = strtolower(trim($row['dia']));
            $hora = $row['hora'];

            /* Convertir nombre de día a número */
            $diaSemana = self::DIAS_A_NUMERO[$diaTexto] ?? null;
            if ($diaSemana === null) {
                continue; // Día inválido, saltar
            }

            if (!isset($this->disponibilidadAlumnos[$alumnoId])) {
                $this->disponibilidadAlumnos[$alumnoId] = [];
            }

            /* Cada slot es una disponibilidad puntual de 1 hora (duración de clase) */
            $horaFin = date('H:i', strtotime($hora) + ($this->duracionClase * 60));

            $this->disponibilidadAlumnos[$alumnoId][] = [
                'dia' => $diaSemana,
                'inicio' => $hora,
                'fin' => $horaFin,
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

        /* Usar DateTime para calcular fecha fin, evitando problemas de timezone */
        $fechaBase = \DateTime::createFromFormat('!Y-m-d', $fechaInicioSemana);
        if (!$fechaBase) {
            $this->clasesBloquedas = [];
            return;
        }
        $fechaFinObj = clone $fechaBase;
        $fechaFinObj->modify('+4 days');
        $fechaFin = $fechaFinObj->format('Y-m-d');

        $this->clasesBloquedas = $wpdb->get_results($wpdb->prepare(
            "SELECT * FROM {$tabla} 
             WHERE centro_id = %d 
             AND fecha BETWEEN %s AND %s 
             AND bloqueada = 1",
            $this->centroId,
            $fechaInicioSemana,
            $fechaFin
        ), 'ARRAY_A');
    }

    /**
     * Genera los slots disponibles para la semana según la configuración
     */
    private function generarSlotsDisponibles(string $fechaInicioSemana): void
    {
        $this->slotsDisponibles = [];

        /* Intentar usar configuración flexible (JSON) */
        $horariosFlexibles = !empty($this->configuracion['horarios_semanales'])
            ? json_decode($this->configuracion['horarios_semanales'], true)
            : null;

        /* Mapeo de índice de día (0-6) a claves del JSON */
        $nombresDias = [0 => 'lunes', 1 => 'martes', 2 => 'miercoles', 3 => 'jueves', 4 => 'viernes', 5 => 'sabado', 6 => 'domingo'];

        /*
         * Usar DateTime para evitar problemas de timezone con strtotime.
         * DateTime::createFromFormat con '!' inicializa la hora a 00:00:00
         */
        $fechaBase = \DateTime::createFromFormat('!Y-m-d', $fechaInicioSemana);
        if (!$fechaBase) {
            error_log("[CAP ENGINE ERROR] No se pudo parsear fecha: '$fechaInicioSemana'");
            return;
        }

        for ($dia = 0; $dia < 5; $dia++) { // Lunes a Viernes
            $fechaObj = clone $fechaBase;
            $fechaObj->modify("+{$dia} days");
            $fecha = $fechaObj->format('Y-m-d');
            
            $diaSemana = $dia + 1; // 1 = Lunes ... 5 = Viernes
            $nombreDia = $nombresDias[$dia];

            $this->slotsDisponibles[$fecha] = [];

            if ($horariosFlexibles && isset($horariosFlexibles[$nombreDia]) && is_array($horariosFlexibles[$nombreDia])) {
                /* Logica NUEVA: Usar rangos flexibles por día */
                foreach ($horariosFlexibles[$nombreDia] as $rango) {
                    if (!isset($rango['inicio']) || !isset($rango['fin'])) continue;

                    $nuevosSlots = $this->generarSlotsRango(
                        $rango['inicio'],
                        $rango['fin'],
                        $fecha,
                        $diaSemana
                    );
                    $this->slotsDisponibles[$fecha] = array_merge($this->slotsDisponibles[$fecha], $nuevosSlots);
                }
            } else {
                /* Logica LEGACY: Usar mañana/tarde fijo con viernes especial */
                $slotsMorning = $this->generarSlotsRango(
                    $this->configuracion['hora_inicio_manana'],
                    $this->configuracion['hora_fin_manana'],
                    $fecha,
                    $diaSemana
                );

                $horaFinTarde = $this->configuracion['hora_fin_tarde'];
                if ($diaSemana === 5 && $this->configuracion['viernes_especial']) {
                    $horaFinTarde = $this->configuracion['hora_fin_viernes'];
                }

                $slotsAfternoon = $this->generarSlotsRango(
                    $this->configuracion['hora_inicio_tarde'],
                    $horaFinTarde,
                    $fecha,
                    $diaSemana
                );

                $this->slotsDisponibles[$fecha] = array_merge($slotsMorning, $slotsAfternoon);
            }
        }
    }

    /**
     * Genera slots para un rango horario específico
     */
    private function generarSlotsRango(string $horaInicio, string $horaFin, string $fecha, int $diaSemana): array
    {
        $slots = [];
        $inicio = strtotime($horaInicio);
        $fin = strtotime($horaFin);

        /* Validación básica para evitar bucles infinitos si las horas están mal */
        if ($inicio >= $fin) return [];

        $duracion = $this->duracionClase * 60; // en segundos

        while ($inicio + $duracion <= $fin) {
            $slotKey = date('H:i', $inicio);
            $slotFin = date('H:i', $inicio + $duracion);

            /* Verificar que el slot no esté bloqueado */
            $estaBloqueado = $this->slotEstaBloqueado($fecha, $slotKey);

            if (!$estaBloqueado) {
                $slots[] = [
                    'fecha' => $fecha,
                    'dia_semana' => $diaSemana,
                    'hora_inicio' => $slotKey,
                    'hora_fin' => $slotFin,
                    'disponible' => true
                ];
            }

            $inicio += $duracion;
        }

        return $slots;
    }

    /**
     * Verifica si un slot está bloqueado por una clase existente
     */
    private function slotEstaBloqueado(string $fecha, string $horaInicio): bool
    {
        foreach ($this->clasesBloquedas as $clase) {
            if ($clase['fecha'] === $fecha && $clase['hora_inicio'] === $horaInicio) {
                return true;
            }
        }
        return false;
    }

    /**
     * Calcula la demanda de alumnos por cada slot
     */
    private function calcularDemandaPorSlot(array $alumnosIds): array
    {
        $demanda = [];

        foreach ($this->slotsDisponibles as $fecha => $slots) {
            foreach ($slots as $slot) {
                $slotKey = $fecha . '_' . $slot['hora_inicio'];
                $demanda[$slotKey] = [
                    'fecha' => $fecha,
                    'dia_semana' => $slot['dia_semana'],
                    'hora_inicio' => $slot['hora_inicio'],
                    'hora_fin' => $slot['hora_fin'],
                    'alumnos' => [],
                    'total' => 0
                ];

                /* Contar alumnos disponibles para este slot */
                foreach ($alumnosIds as $alumnoId) {
                    if ($this->alumnoDisponibleEnSlot($alumnoId, $slot['dia_semana'], $slot['hora_inicio'], $slot['hora_fin'])) {
                        $demanda[$slotKey]['alumnos'][] = $alumnoId;
                        $demanda[$slotKey]['total']++;
                    }
                }
            }
        }

        return $demanda;
    }

    /**
     * Verifica si un alumno está disponible en un slot específico
     */
    private function alumnoDisponibleEnSlot(int $alumnoId, int $diaSemana, string $horaInicio, string $horaFin): bool
    {
        if (!isset($this->disponibilidadAlumnos[$alumnoId])) {
            return false;
        }

        $inicioSlot = strtotime($horaInicio);
        $finSlot = strtotime($horaFin);

        foreach ($this->disponibilidadAlumnos[$alumnoId] as $disponibilidad) {
            if ($disponibilidad['dia'] !== $diaSemana) {
                continue;
            }

            $inicioDisp = strtotime($disponibilidad['inicio']);
            $finDisp = strtotime($disponibilidad['fin']);

            /* El slot debe estar completamente dentro de la disponibilidad */
            if ($inicioSlot >= $inicioDisp && $finSlot <= $finDisp) {
                return true;
            }
        }

        return false;
    }

    /**
     * Detecta conflictos de aforo (más alumnos que capacidad)
     */
    private function detectarConflictosAforo(array $demandaPorSlot): array
    {
        $conflictos = [];

        foreach ($demandaPorSlot as $slotKey => $datos) {
            if ($datos['total'] > $this->alumnosMaxClase) {
                $conflictos[] = [
                    'tipo' => 'aforo',
                    'slot_key' => $slotKey,
                    'fecha' => $datos['fecha'],
                    'hora_inicio' => $datos['hora_inicio'],
                    'hora_fin' => $datos['hora_fin'],
                    'demanda' => $datos['total'],
                    'capacidad' => $this->alumnosMaxClase,
                    'exceso' => $datos['total'] - $this->alumnosMaxClase,
                    'alumnos' => $datos['alumnos']
                ];
            }
        }

        return $conflictos;
    }

    /**
     * Distribuye las asignaturas en los slots disponibles
     */
    private function distribuirAsignaturas(array $demandaPorSlot): array
    {
        $distribucion = [];
        $asignaturasRestantes = [];

        /* Inicializar horas restantes por asignatura */
        foreach (self::ASIGNATURAS as $key => $asignatura) {
            $asignaturasRestantes[$key] = $asignatura['horas'] * 60; // en minutos
        }

        /* Ordenar slots por fecha y hora */
        uksort($demandaPorSlot, function ($a, $b) {
            return strcmp($a, $b);
        });

        foreach ($demandaPorSlot as $slotKey => $datos) {
            if ($datos['total'] === 0) {
                continue; // Saltar slots sin alumnos
            }

            /* Seleccionar asignatura con más minutos restantes */
            $asignaturaSeleccionada = null;
            $maxMinutos = 0;

            foreach ($asignaturasRestantes as $key => $minutos) {
                if ($minutos > $maxMinutos) {
                    $maxMinutos = $minutos;
                    $asignaturaSeleccionada = $key;
                }
            }

            if ($asignaturaSeleccionada === null) {
                continue; // Todas las asignaturas completas
            }

            /* Asignar este slot a la asignatura */
            $distribucion[] = [
                'fecha' => $datos['fecha'],
                'hora_inicio' => $datos['hora_inicio'],
                'hora_fin' => $datos['hora_fin'],
                'asignatura' => $asignaturaSeleccionada,
                'asignatura_nombre' => self::ASIGNATURAS[$asignaturaSeleccionada]['nombre'],
                'alumnos' => $datos['alumnos']
            ];

            /* Restar minutos de la asignatura */
            $asignaturasRestantes[$asignaturaSeleccionada] -= $this->duracionClase;
            if ($asignaturasRestantes[$asignaturaSeleccionada] < 0) {
                $asignaturasRestantes[$asignaturaSeleccionada] = 0;
            }
        }

        return $distribucion;
    }

    /**
     * Crea las clases en la base de datos
     */
    private function crearClases(array $distribucion, string $fechaInicioSemana): array
    {
        global $wpdb;
        $tablaClases = $wpdb->prefix . 'cap_clases';
        $tablaAsistencia = $wpdb->prefix . 'cap_asistencia';

        /* Calcular fecha fin usando DateTime para evitar problemas de timezone */
        $fechaBase = \DateTime::createFromFormat('!Y-m-d', $fechaInicioSemana);
        $fechaFin = $fechaBase ? (clone $fechaBase)->modify('+4 days')->format('Y-m-d') : $fechaInicioSemana;

        /* Primero eliminar clases no bloqueadas de la semana */
        $wpdb->query($wpdb->prepare(
            "DELETE FROM {$tablaClases} 
             WHERE centro_id = %d 
             AND fecha BETWEEN %s AND %s 
             AND bloqueada = 0",
            $this->centroId,
            $fechaInicioSemana,
            $fechaFin
        ));

        $clasesCreadas = [];

        foreach ($distribucion as $clase) {
            /* Crear la clase */
            $insertado = $wpdb->insert($tablaClases, [
                'centro_id' => $this->centroId,
                'fecha' => $clase['fecha'],
                'hora_inicio' => $clase['hora_inicio'],
                'hora_fin' => $clase['hora_fin'],
                'asignatura' => $clase['asignatura'],
                'duracion_minutos' => $this->duracionClase,
                'bloqueada' => 0,
                'created_at' => current_time('mysql')
            ]);

            if ($insertado) {
                $claseId = $wpdb->insert_id;

                /* Asignar alumnos a la clase */
                foreach ($clase['alumnos'] as $alumnoId) {
                    $wpdb->insert($tablaAsistencia, [
                        'clase_id' => $claseId,
                        'alumno_id' => $alumnoId,
                        'asistio' => 0,
                        'created_at' => current_time('mysql')
                    ]);
                }

                $clasesCreadas[] = [
                    'id' => $claseId,
                    'fecha' => $clase['fecha'],
                    'hora_inicio' => $clase['hora_inicio'],
                    'hora_fin' => $clase['hora_fin'],
                    'asignatura' => $clase['asignatura'],
                    'asignatura_nombre' => $clase['asignatura_nombre'],
                    'alumnos_count' => count($clase['alumnos'])
                ];
            }
        }

        return $clasesCreadas;
    }

    /**
     * Genera con resolución de conflictos (alumnos excluidos)
     * 
     * @param string $fechaInicioSemana Fecha del lunes
     * @param array $alumnosIds Todos los alumnos
     * @param array $exclusiones Array de [slot_key => [alumno_ids excluidos]]
     */
    public function generarConExclusiones(string $fechaInicioSemana, array $alumnosIds, array $exclusiones): array
    {
        $this->cargarDisponibilidad($alumnosIds);
        $this->cargarClasesBloqueadas($fechaInicioSemana);
        $this->generarSlotsDisponibles($fechaInicioSemana);

        /* Calcular demanda aplicando exclusiones */
        $demandaPorSlot = $this->calcularDemandaPorSlot($alumnosIds);

        /* Aplicar exclusiones */
        foreach ($exclusiones as $slotKey => $alumnosExcluidos) {
            if (isset($demandaPorSlot[$slotKey])) {
                $demandaPorSlot[$slotKey]['alumnos'] = array_diff(
                    $demandaPorSlot[$slotKey]['alumnos'],
                    $alumnosExcluidos
                );
                $demandaPorSlot[$slotKey]['total'] = count($demandaPorSlot[$slotKey]['alumnos']);
            }
        }

        /* Verificar que no quedan conflictos */
        $conflictos = $this->detectarConflictosAforo($demandaPorSlot);
        if (!empty($conflictos)) {
            return [
                'exito' => false,
                'clases' => [],
                'conflictos' => $conflictos,
                'mensaje' => 'Aún hay conflictos de aforo sin resolver'
            ];
        }

        /* Generar distribución y crear clases */
        $distribucion = $this->distribuirAsignaturas($demandaPorSlot);
        $clasesGeneradas = $this->crearClases($distribucion, $fechaInicioSemana);

        /* Calcular avisos de horas no cubiertas */
        $avisos = $this->calcularAvisosHorasNoCubiertas($demandaPorSlot, $fechaInicioSemana);

        return [
            'exito' => true,
            'clases' => $clasesGeneradas,
            'conflictos' => [],
            'avisos' => $avisos,
            'mensaje' => 'Calendario generado exitosamente'
        ];
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

    /**
     * Calcula las horas totales asignadas a un alumno
     */
    private function calcularHorasTotales(array $clases, int $alumnoId): float
    {
        $minutosTotales = 0;

        foreach ($clases as $clase) {
            if (in_array($alumnoId, $clase['alumnos'] ?? [])) {
                $minutosTotales += $this->duracionClase;
            }
        }

        return $minutosTotales / 60;
    }

    /**
     * Cuenta los días únicos con clases para un alumno
     */
    private function contarDiasUnicos(array $clases, int $alumnoId): int
    {
        $dias = [];

        foreach ($clases as $clase) {
            if (in_array($alumnoId, $clase['alumnos'] ?? [])) {
                $dias[$clase['fecha']] = true;
            }
        }

        return count($dias);
    }

    /**
     * Calcula el máximo de horas en un día para un alumno
     */
    private function calcularMaxHorasDia(array $clases, int $alumnoId): float
    {
        $minutosPorDia = [];

        foreach ($clases as $clase) {
            if (in_array($alumnoId, $clase['alumnos'] ?? [])) {
                $fecha = $clase['fecha'];
                if (!isset($minutosPorDia[$fecha])) {
                    $minutosPorDia[$fecha] = 0;
                }
                $minutosPorDia[$fecha] += $this->duracionClase;
            }
        }

        return empty($minutosPorDia) ? 0 : max($minutosPorDia) / 60;
    }

    /**
     * Obtiene estadísticas de generación para preview
     */
    public function obtenerPreview(string $fechaInicioSemana, array $alumnosIds): array
    {
        $this->cargarDisponibilidad($alumnosIds);
        $this->generarSlotsDisponibles($fechaInicioSemana);

        $demandaPorSlot = $this->calcularDemandaPorSlot($alumnosIds);
        $conflictos = $this->detectarConflictosAforo($demandaPorSlot);

        $slotsConDemanda = array_filter($demandaPorSlot, fn($s) => $s['total'] > 0);

        return [
            'total_slots' => count($slotsConDemanda),
            'total_horas_estimadas' => count($slotsConDemanda) * $this->duracionClase / 60,
            'conflictos' => count($conflictos),
            'alumnos' => count($alumnosIds),
            'puede_generar' => empty($conflictos)
        ];
    }

    /**
     * Calcula avisos de horas no cubiertas por día
     * 
     * Compara los slots disponibles del centro contra los slots que 
     * efectivamente tienen alumnos asignados para detectar huecos.
     * 
     * @param array $demandaPorSlot Demanda calculada por slot
     * @param string $fechaInicioSemana Fecha inicio de la semana
     * @return array Lista de avisos por día con horas no cubiertas
     */
    private function calcularAvisosHorasNoCubiertas(array $demandaPorSlot, string $fechaInicioSemana): array
    {
        $avisos = [];
        $nombresDias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

        /* Agrupar slots por fecha */
        $slotsPorFecha = [];
        foreach ($this->slotsDisponibles as $fecha => $slots) {
            $slotsPorFecha[$fecha] = [
                'disponibles' => count($slots),
                'cubiertos' => 0,
                'horasDisponibles' => 0,
                'horasCubiertas' => 0,
                'slotsNoCubiertos' => []
            ];
            
            foreach ($slots as $slot) {
                $slotsPorFecha[$fecha]['horasDisponibles'] += $this->duracionClase / 60;
            }
        }

        /* Contar slots cubiertos (con al menos 1 alumno) */
        foreach ($demandaPorSlot as $slotKey => $datos) {
            $fecha = $datos['fecha'];
            if (!isset($slotsPorFecha[$fecha])) {
                continue;
            }

            if ($datos['total'] > 0) {
                $slotsPorFecha[$fecha]['cubiertos']++;
                $slotsPorFecha[$fecha]['horasCubiertas'] += $this->duracionClase / 60;
            } else {
                /* Registrar slot sin cobertura */
                $slotsPorFecha[$fecha]['slotsNoCubiertos'][] = [
                    'inicio' => $datos['hora_inicio'],
                    'fin' => $datos['hora_fin']
                ];
            }
        }

        /* Generar avisos para días con huecos */
        foreach ($slotsPorFecha as $fecha => $stats) {
            $noCubiertos = $stats['disponibles'] - $stats['cubiertos'];
            
            if ($noCubiertos > 0) {
                /* Calcular día de la semana */
                $timestamp = strtotime($fecha);
                $diaSemana = (int) date('N', $timestamp); // 1=lunes, 7=domingo
                $nombreDia = $nombresDias[$diaSemana - 1] ?? 'Día';

                /* Agrupar rangos consecutivos de horas no cubiertas */
                $rangosNoCubiertos = $this->agruparRangosConsecutivos($stats['slotsNoCubiertos']);

                $avisos[] = [
                    'fecha' => $fecha,
                    'diaNombre' => $nombreDia,
                    'horasDisponibles' => round($stats['horasDisponibles'], 1),
                    'horasCubiertas' => round($stats['horasCubiertas'], 1),
                    'horasNoCubiertas' => round($stats['horasDisponibles'] - $stats['horasCubiertas'], 1),
                    'rangosNoCubiertos' => $rangosNoCubiertos
                ];
            }
        }

        return $avisos;
    }

    /**
     * Agrupa slots consecutivos en rangos para mostrar en avisos
     * Ej: [09:00-10:00, 10:00-11:00, 14:00-15:00] => ["09:00 - 11:00", "14:00 - 15:00"]
     */
    private function agruparRangosConsecutivos(array $slots): array
    {
        if (empty($slots)) {
            return [];
        }

        /* Ordenar por hora de inicio */
        usort($slots, function ($a, $b) {
            return strcmp($a['inicio'], $b['inicio']);
        });

        $rangos = [];
        $rangoActual = [
            'inicio' => $slots[0]['inicio'],
            'fin' => $slots[0]['fin']
        ];

        for ($i = 1; $i < count($slots); $i++) {
            $slot = $slots[$i];
            
            /* Si este slot comienza donde termina el anterior, extender el rango */
            if ($slot['inicio'] === $rangoActual['fin']) {
                $rangoActual['fin'] = $slot['fin'];
            } else {
                /* Guardar rango actual y empezar uno nuevo */
                $rangos[] = $rangoActual['inicio'] . ' - ' . $rangoActual['fin'];
                $rangoActual = [
                    'inicio' => $slot['inicio'],
                    'fin' => $slot['fin']
                ];
            }
        }

        /* Agregar último rango */
        $rangos[] = $rangoActual['inicio'] . ' - ' . $rangoActual['fin'];

        return $rangos;
    }
}
