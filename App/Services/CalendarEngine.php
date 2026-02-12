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
    
    /* Horas ya completadas por cada alumno (minutos) - para limitar a 35h */
    private array $minutosCompletadosPorAlumno = [];
    /* Horas asignadas durante esta generación (minutos) */
    private array $minutosAsignadosPorAlumno = [];
    /* Minutos restantes por asignatura para cada alumno */
    private array $minutosRestantesAsignaturaPorAlumno = [];

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
     * @param string|null $fechaDesde Si se especifica, solo genera desde esta fecha (Y-m-d)
     * @return array Resultado con clases generadas y posibles conflictos
     */
    public function generar(string $fechaInicioSemana, array $alumnosIds, ?string $fechaDesde = null): array
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
        $this->cargarHorasCompletadasAlumnos($alumnosIds, $fechaInicioSemana);
        $this->cargarMinutosRestantesAsignaturaAlumnos($alumnosIds, $fechaInicioSemana);
        $this->generarSlotsDisponibles($fechaInicioSemana);

        /*
         * Si se recibió fechaDesde, filtrar slots para no generar
         * antes de esa fecha. Útil cuando se genera a mitad de semana.
         */
        if ($fechaDesde !== null) {
            $this->filtrarSlotsDesdeFecha($fechaDesde);
        }

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
        $clasesGeneradas = $this->crearClases($distribucion, $fechaInicioSemana, $fechaDesde);

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
     * 
     * NOTA: La grilla de disponibilidad guarda slots de 1 hora (09:00, 10:00...).
     * La interpolación se hace en alumnoDisponibleEnSlot() para soportar
     * duraciones de clase menores a 1 hora.
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

            /*
             * Cada registro de disponibilidad representa 1 hora completa.
             * Ej: hora=09:00 significa disponible de 09:00 a 10:00.
             * Esto permite clases de 30, 45 o 60 min dentro de ese bloque.
             */
            $horaFin = date('H:i', strtotime($hora) + 3600); // Siempre 1 hora

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
     * Carga las horas ya asignadas de cada alumno.
     * 
     * Esto es CRÍTICO para no asignar más de 35h por alumno.
     * Cuenta TODAS las clases asignadas EXCEPTO las de la semana que se está
     * regenerando (porque esas se borran y se reemplazan).
     * 
     * @param array $alumnosIds IDs de alumnos
     * @param string $semanaExcluir Fecha del lunes de la semana a excluir (que se regenera)
     */
    private function cargarHorasCompletadasAlumnos(array $alumnosIds, string $semanaExcluir = ''): void
    {
        global $wpdb;
        $tablaAsistencia = $wpdb->prefix . 'cap_asistencia';
        $tablaClases = $wpdb->prefix . 'cap_clases';

        $this->minutosCompletadosPorAlumno = [];
        $this->minutosAsignadosPorAlumno = [];

        if (empty($alumnosIds)) {
            return;
        }

        $placeholders = implode(',', array_fill(0, count($alumnosIds), '%d'));

        /*
         * Sumar minutos de TODAS las clases asignadas a cada alumno,
         * excluyendo la semana que se está regenerando.
         * Esto incluye clases pasadas y futuras de otras semanas.
         */
        $condicionExcluir = '';
        $params = $alumnosIds;
        
        /* Añadir centro_id después de los alumno_ids */
        $params[] = $this->centroId;

        if (!empty($semanaExcluir)) {
            /* Calcular rango de la semana a excluir (lunes a viernes) */
            $fechaBase = \DateTime::createFromFormat('!Y-m-d', $semanaExcluir);
            if ($fechaBase) {
                $fechaFinSemana = (clone $fechaBase)->modify('+4 days')->format('Y-m-d');
                $condicionExcluir = ' AND (c.fecha < %s OR c.fecha > %s)';
                $params[] = $semanaExcluir;
                $params[] = $fechaFinSemana;
            }
        }

           $queryStr = "SELECT a.alumno_id, COALESCE(SUM(c.duracion_minutos), 0) as minutos_completados
               FROM {$tablaAsistencia} a
               JOIN {$tablaClases} c ON a.clase_id = c.id
               WHERE a.alumno_id IN ({$placeholders})
               AND c.centro_id = %d
               {$condicionExcluir}
               GROUP BY a.alumno_id";

           $resultados = $wpdb->get_results($wpdb->prepare($queryStr, $params), ARRAY_A);

        /* Inicializar todos en 0 */
        foreach ($alumnosIds as $alumnoId) {
            $this->minutosCompletadosPorAlumno[(int) $alumnoId] = 0;
            $this->minutosAsignadosPorAlumno[(int) $alumnoId] = 0;
        }

        /* Actualizar con los valores reales */
        foreach ($resultados as $row) {
            $this->minutosCompletadosPorAlumno[(int) $row['alumno_id']] = (int) $row['minutos_completados'];
        }
    }

    /**
     * Verifica si un alumno puede recibir más horas (no ha llegado a 35h).
     * Considera las horas ya completadas + las asignadas durante esta generación.
     */
    private function alumnoNecesitaMasHoras(int $alumnoId): bool
    {
        $limitMinutos = self::HORAS_TOTALES_CURSO * 60; /* 35h = 2100 min */
        $minutosActuales = ($this->minutosCompletadosPorAlumno[$alumnoId] ?? 0) 
                         + ($this->minutosAsignadosPorAlumno[$alumnoId] ?? 0);
        
        return $minutosActuales < $limitMinutos;
    }

    /**
     * Registra minutos asignados a un alumno durante esta generación.
     */
    private function registrarMinutosAsignados(int $alumnoId, int $minutos): void
    {
        if (!isset($this->minutosAsignadosPorAlumno[$alumnoId])) {
            $this->minutosAsignadosPorAlumno[$alumnoId] = 0;
        }
        $this->minutosAsignadosPorAlumno[$alumnoId] += $minutos;
    }

    /**
     * Genera los slots disponibles para la semana según la configuración
     */
    private function generarSlotsDisponibles(string $fechaInicioSemana): void
    {
        $this->slotsDisponibles = [];

        /* Intentar usar configuración flexible (JSON) */
        $horariosFlexibles = $this->obtenerHorariosFlexiblesNormalizados();
        $usarHorarioFlexible = $horariosFlexibles !== null;

        if (defined('WP_DEBUG') && WP_DEBUG) {
            $modo = $usarHorarioFlexible ? 'flexible' : 'legacy';
            error_log("[CAP ENGINE] generarSlotsDisponibles usando modo: {$modo}");
        }

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

            if ($usarHorarioFlexible) {
                /* Logica NUEVA: Usar rangos flexibles por día */
                $rangosDia = $horariosFlexibles[$nombreDia] ?? [];
                foreach ($rangosDia as $rango) {
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
     * Obtiene horarios flexibles normalizados por día.
     * Devuelve null cuando no hay configuración flexible válida.
     */
    private function obtenerHorariosFlexiblesNormalizados(): ?array
    {
        $raw = $this->configuracion['horarios_semanales'] ?? null;
        if ($raw === null || $raw === '') {
            return null;
        }

        $horarios = is_string($raw) ? json_decode($raw, true) : $raw;
        if (!is_array($horarios)) {
            return null;
        }

        $dias = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
        $normalizados = [];
        foreach ($dias as $dia) {
            $normalizados[$dia] = [];
        }

        foreach ($horarios as $diaRaw => $rangosRaw) {
            if (!is_string($diaRaw)) {
                continue;
            }

            $dia = $this->normalizarClaveDia($diaRaw);
            if (!isset($normalizados[$dia])) {
                continue;
            }

            $rangos = $rangosRaw;
            if (is_array($rangosRaw) && isset($rangosRaw['rangos']) && is_array($rangosRaw['rangos'])) {
                $rangos = $rangosRaw['rangos'];
            }

            if (!is_array($rangos)) {
                continue;
            }

            foreach ($rangos as $rango) {
                if (!is_array($rango) || !isset($rango['inicio'], $rango['fin'])) {
                    continue;
                }

                $inicio = $this->normalizarHora($rango['inicio']);
                $fin = $this->normalizarHora($rango['fin']);

                if ($inicio === '' || $fin === '' || strtotime($inicio) >= strtotime($fin)) {
                    continue;
                }

                $normalizados[$dia][] = [
                    'inicio' => $inicio,
                    'fin' => $fin,
                ];
            }
        }

        return $normalizados;
    }

    /**
     * Normaliza claves de día para soportar tildes y variantes.
     */
    private function normalizarClaveDia(string $dia): string
    {
        $dia = strtolower(trim($dia));
        $dia = str_replace(['á', 'é', 'í', 'ó', 'ú'], ['a', 'e', 'i', 'o', 'u'], $dia);
        return $dia;
    }

    /**
     * Normaliza hora a HH:MM y valida formato.
     */
    private function normalizarHora(string $hora): string
    {
        $hora = trim($hora);

        if (!preg_match('/^([0-1]?\d|2[0-3]):([0-5]\d)$/', $hora, $matches)) {
            return '';
        }

        $h = str_pad($matches[1], 2, '0', STR_PAD_LEFT);
        $m = $matches[2];
        return "{$h}:{$m}";
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
     * 
     * Soporta interpolación: si la disponibilidad está guardada en bloques de 1 hora
     * (ej: 09:00-10:00) y la clase dura menos (ej: 30 min), una clase de 09:30-10:00
     * se considera cubierta porque cae dentro del bloque de disponibilidad.
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

            /*
             * Interpolación: el slot de clase debe estar COMPLETAMENTE contenido
             * dentro del bloque de disponibilidad.
             * 
             * Ej: Disponibilidad 09:00-10:00, Clase 09:30-10:00 → OK
             * Ej: Disponibilidad 09:00-10:00, Clase 09:45-10:15 → NO (se pasa del bloque)
             */
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
     * Distribuye las asignaturas en los slots disponibles.
     *
     * IMPORTANTE: la selección se hace por déficit real de los alumnos
     * disponibles en cada slot. Se evita así asignar horas de asignaturas
     * ya cubiertas para ese alumno y se corrige la desviación por desglose.
     */
    private function distribuirAsignaturas(array $demandaPorSlot): array
    {
        $distribucion = [];

        /* Ordenar slots por fecha y hora */
        uksort($demandaPorSlot, function ($a, $b) {
            return strcmp($a, $b);
        });

        foreach ($demandaPorSlot as $slotKey => $datos) {
            if ($datos['total'] === 0) {
                continue;
            }

            /*
             * FILTRO CRITICO: Solo incluir alumnos que aun necesitan mas horas.
             * Esto previene que un alumno supere las 35h del curso.
             */
            $alumnosElegibles = [];
            foreach ($datos['alumnos'] as $alumnoId) {
                if ($this->alumnoNecesitaMasHoras((int) $alumnoId)) {
                    $alumnosElegibles[] = $alumnoId;
                }
            }

            if (empty($alumnosElegibles)) {
                continue;
            }

            $asignaturaSeleccionada = null;
            $alumnosParaAsignar = [];
            $mejorScore = -1.0;
            $mejorCantidad = -1;
            $mejorMinutos = -1;

            foreach (array_keys(self::ASIGNATURAS) as $codigoAsignatura) {
                $score = 0.0;
                $cantidad = 0;
                $minutosPendientes = 0;
                $candidatos = [];

                foreach ($alumnosElegibles as $alumnoId) {
                    $alumnoIdInt = (int) $alumnoId;
                    $minutosRestantes = $this->obtenerMinutosRestantesAsignatura($alumnoIdInt, $codigoAsignatura);

                    if ($minutosRestantes <= 0) {
                        continue;
                    }

                    $candidatos[] = $alumnoIdInt;
                    $cantidad++;
                    $minutosPendientes += $minutosRestantes;
                    $totalAsignatura = self::ASIGNATURAS[$codigoAsignatura]['horas'] * 60;
                    $score += $minutosRestantes / max(1, $totalAsignatura);
                }

                if ($cantidad === 0) {
                    continue;
                }

                if (
                    $score > $mejorScore
                    || ($score === $mejorScore && $cantidad > $mejorCantidad)
                    || ($score === $mejorScore && $cantidad === $mejorCantidad && $minutosPendientes > $mejorMinutos)
                ) {
                    $mejorScore = $score;
                    $mejorCantidad = $cantidad;
                    $mejorMinutos = $minutosPendientes;
                    $asignaturaSeleccionada = $codigoAsignatura;
                    $alumnosParaAsignar = $candidatos;
                }
            }

            if ($asignaturaSeleccionada === null || empty($alumnosParaAsignar)) {
                continue;
            }

            $distribucion[] = [
                'fecha' => $datos['fecha'],
                'hora_inicio' => $datos['hora_inicio'],
                'hora_fin' => $datos['hora_fin'],
                'asignatura' => $asignaturaSeleccionada,
                'asignatura_nombre' => self::ASIGNATURAS[$asignaturaSeleccionada]['nombre'],
                'alumnos' => $alumnosParaAsignar
            ];

            /*
             * Registrar los minutos asignados a cada alumno.
             * Fundamental para que en el proximo slot se considere el progreso acumulado.
             */
            foreach ($alumnosParaAsignar as $alumnoId) {
                $this->registrarMinutosAsignados((int) $alumnoId, $this->duracionClase);
                $this->registrarMinutosAsignadosAsignatura((int) $alumnoId, $asignaturaSeleccionada, $this->duracionClase);
            }
        }

        return $distribucion;
    }

    /**
     * Carga minutos restantes por asignatura para cada alumno.
     */
    private function cargarMinutosRestantesAsignaturaAlumnos(array $alumnosIds, string $semanaExcluir = ''): void
    {
        global $wpdb;
        $tablaAsistencia = $wpdb->prefix . 'cap_asistencia';
        $tablaClases = $wpdb->prefix . 'cap_clases';

        $this->minutosRestantesAsignaturaPorAlumno = [];

        if (empty($alumnosIds)) {
            return;
        }

        foreach ($alumnosIds as $alumnoId) {
            $alumnoIdInt = (int) $alumnoId;
            $this->minutosRestantesAsignaturaPorAlumno[$alumnoIdInt] = [];
            foreach (self::ASIGNATURAS as $codigo => $asignatura) {
                $this->minutosRestantesAsignaturaPorAlumno[$alumnoIdInt][$codigo] = (int) $asignatura['horas'] * 60;
            }
        }

        $placeholders = implode(',', array_fill(0, count($alumnosIds), '%d'));
        $condicionExcluir = '';
        $params = $alumnosIds;
        $params[] = $this->centroId;

        if (!empty($semanaExcluir)) {
            $fechaBase = \DateTime::createFromFormat('!Y-m-d', $semanaExcluir);
            if ($fechaBase) {
                $fechaFinSemana = (clone $fechaBase)->modify('+4 days')->format('Y-m-d');
                $condicionExcluir = ' AND (c.fecha < %s OR c.fecha > %s)';
                $params[] = $semanaExcluir;
                $params[] = $fechaFinSemana;
            }
        }

        $queryStr = "SELECT a.alumno_id, c.asignatura, COALESCE(SUM(c.duracion_minutos), 0) as minutos
            FROM {$tablaAsistencia} a
            JOIN {$tablaClases} c ON a.clase_id = c.id
            WHERE a.alumno_id IN ({$placeholders})
              AND c.centro_id = %d
              {$condicionExcluir}
            GROUP BY a.alumno_id, c.asignatura";

        $resultados = $wpdb->get_results($wpdb->prepare($queryStr, $params), ARRAY_A);

        foreach ($resultados as $row) {
            $alumnoId = (int) $row['alumno_id'];
            $codigo = $this->normalizarCodigoAsignatura((string) $row['asignatura']);
            if (!isset(self::ASIGNATURAS[$codigo])) {
                continue;
            }

            $minutosAsignados = (int) $row['minutos'];
            $restanteActual = $this->minutosRestantesAsignaturaPorAlumno[$alumnoId][$codigo] ?? 0;
            $this->minutosRestantesAsignaturaPorAlumno[$alumnoId][$codigo] = max(0, $restanteActual - $minutosAsignados);
        }
    }

    /**
     * Obtiene minutos restantes por asignatura para un alumno.
     */
    private function obtenerMinutosRestantesAsignatura(int $alumnoId, string $asignatura): int
    {
        return (int) ($this->minutosRestantesAsignaturaPorAlumno[$alumnoId][$asignatura] ?? 0);
    }

    /**
     * Registra minutos asignados en la asignatura para un alumno.
     */
    private function registrarMinutosAsignadosAsignatura(int $alumnoId, string $asignatura, int $minutos): void
    {
        if (!isset($this->minutosRestantesAsignaturaPorAlumno[$alumnoId][$asignatura])) {
            return;
        }

        $restante = $this->minutosRestantesAsignaturaPorAlumno[$alumnoId][$asignatura];
        $this->minutosRestantesAsignaturaPorAlumno[$alumnoId][$asignatura] = max(0, $restante - $minutos);
    }

    /**
     * Normaliza codigos legacy de asignatura a codigo canonico.
     */
    private function normalizarCodigoAsignatura(string $codigo): string
    {
        $codigoLimpio = strtolower(trim($codigo));
        $alias = [
            '1' => 'conduccion_racional',
            '2' => 'reglamentacion',
            '3' => 'seguridad_vial',
            '4' => 'servicio_logistica',
            '5' => 'salud_seguridad',
            '6' => 'medio_ambiente',
            '7' => 'mercancias_peligrosas',
            '8' => 'viajeros',
            'cr' => 'conduccion_racional',
            'reg' => 'reglamentacion',
            'sv' => 'seguridad_vial',
            'sl' => 'servicio_logistica',
            'ss' => 'salud_seguridad',
            'ma' => 'medio_ambiente',
            'mp' => 'mercancias_peligrosas',
            'via' => 'viajeros',
            'racionalizacion' => 'conduccion_racional',
            'entorno_economico' => 'medio_ambiente',
            'operativa' => 'servicio_logistica',
            'normativa' => 'reglamentacion',
            'conduccion_economica' => 'conduccion_racional',
        ];

        return $alias[$codigoLimpio] ?? $codigoLimpio;
    }

    /**
     * Crea las clases en la base de datos
     * 
     * @param string|null $fechaDesde Si se pasa, solo borra clases desde esta fecha en adelante
     */
    private function crearClases(array $distribucion, string $fechaInicioSemana, ?string $fechaDesde = null): array
    {
        global $wpdb;
        $tablaClases = $wpdb->prefix . 'cap_clases';
        $tablaAsistencia = $wpdb->prefix . 'cap_asistencia';

        /* Calcular fecha fin usando DateTime para evitar problemas de timezone */
        $fechaBase = \DateTime::createFromFormat('!Y-m-d', $fechaInicioSemana);
        $fechaFin = $fechaBase ? (clone $fechaBase)->modify('+4 days')->format('Y-m-d') : $fechaInicioSemana;

        /* Determinar desde qué fecha borrar clases */
        $fechaBorradoDesde = $fechaDesde ?? $fechaInicioSemana;

        /* Primero eliminar clases no bloqueadas del rango */
        $wpdb->query($wpdb->prepare(
            "DELETE FROM {$tablaClases} 
             WHERE centro_id = %d 
             AND fecha BETWEEN %s AND %s 
             AND bloqueada = 0",
            $this->centroId,
            $fechaBorradoDesde,
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
        $this->cargarHorasCompletadasAlumnos($alumnosIds, $fechaInicioSemana);
        $this->cargarMinutosRestantesAsignaturaAlumnos($alumnosIds, $fechaInicioSemana);
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
        $this->cargarHorasCompletadasAlumnos($alumnosIds, $fechaInicioSemana);
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
     * Filtra los slots disponibles para solo incluir los de fechaDesde en adelante.
     * Se usa cuando se genera desde un día específico (no desde el lunes).
     */
    private function filtrarSlotsDesdeFecha(string $fechaDesde): void
    {
        foreach ($this->slotsDisponibles as $fecha => $slots) {
            if ($fecha < $fechaDesde) {
                unset($this->slotsDisponibles[$fecha]);
            }
        }
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
