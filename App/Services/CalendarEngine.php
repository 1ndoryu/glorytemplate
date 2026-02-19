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

use App\Config\Schema\CapAsignaturasConstants;

class CalendarEngine
{
    /* Constantes legales del curso CAP */
    const HORAS_TOTALES_CURSO = 35;
    const MINIMO_DIAS = 4;
    const MAXIMO_HORAS_DIA_ALUMNO = 9;

    /*
     * Asignaturas del CAP: delegadas a CapAsignaturasConstants (fuente unica de verdad).
     * Se mantiene la referencia aqui para compatibilidad con sub-servicios del motor.
     */
    const ASIGNATURAS = CapAsignaturasConstants::ASIGNATURAS;

    private int $centroId;
    private array $configuracion;
    private array $disponibilidadAlumnos;
    private array $slotsDisponibles;
    private int $duracionClase;
    private int $alumnosMaxClase;
    
    /* Horas ya completadas por cada alumno (minutos) - para limitar a 35h */
    private array $minutosCompletadosPorAlumno = [];
    /* Horas asignadas durante esta generación (minutos) */
    private array $minutosAsignadosPorAlumno = [];
    /* Minutos restantes por asignatura para cada alumno */
    private array $minutosRestantesAsignaturaPorAlumno = [];
    private CalendarReglasValidator $calendarReglasValidator;
    private CalendarDemandCalculator $calendarDemandCalculator;
    private CalendarPersistenceService $calendarPersistenceService;
    private CalendarCoverageNoticeBuilder $calendarCoverageNoticeBuilder;
    private CalendarSubjectDistributor $calendarSubjectDistributor;
    private CalendarEngineConfigProvider $calendarEngineConfigProvider;
    private CalendarConflictDetector $calendarConflictDetector;
    private CalendarWeekContextBuilder $calendarWeekContextBuilder;

    public function __construct(int $centroId)
    {
        $this->centroId = $centroId;
        $this->calendarReglasValidator = new CalendarReglasValidator();
        $this->calendarDemandCalculator = new CalendarDemandCalculator();
        $this->calendarPersistenceService = new CalendarPersistenceService();
        $this->calendarCoverageNoticeBuilder = new CalendarCoverageNoticeBuilder();
        $this->calendarSubjectDistributor = new CalendarSubjectDistributor();
        $this->calendarEngineConfigProvider = new CalendarEngineConfigProvider();
        $this->calendarConflictDetector = new CalendarConflictDetector();
        $this->calendarWeekContextBuilder = new CalendarWeekContextBuilder();
        $this->cargarConfiguracion();
        $this->aplicarTimezone();
    }

    private function aplicarTimezone(): void
    {
        $this->calendarEngineConfigProvider->aplicarTimezone($this->configuracion);
    }

    private function cargarConfiguracion(): void
    {
        $resultado = $this->calendarEngineConfigProvider->cargarConfiguracion($this->centroId);
        $this->configuracion = $resultado['configuracion'];
        $this->duracionClase = $resultado['duracionClase'];
        $this->alumnosMaxClase = $resultado['alumnosMaxClase'];
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

        $contexto = $this->calendarWeekContextBuilder->construirParaGeneracion(
            $this->centroId,
            $this->configuracion,
            $this->duracionClase,
            self::ASIGNATURAS,
            $alumnosIds,
            $fechaInicioSemana,
            $fechaDesde
        );

        $this->disponibilidadAlumnos = $contexto['disponibilidadAlumnos'];
        $this->slotsDisponibles = $contexto['slotsDisponibles'];
        $this->minutosCompletadosPorAlumno = $contexto['minutosCompletadosPorAlumno'];
        $this->minutosAsignadosPorAlumno = $contexto['minutosAsignadosPorAlumno'];
        $this->minutosRestantesAsignaturaPorAlumno = $contexto['minutosRestantesAsignaturaPorAlumno'];

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
     * Calcula la demanda de alumnos por cada slot
     */
    private function calcularDemandaPorSlot(array $alumnosIds): array
    {
        return $this->calendarDemandCalculator->calcularDemandaPorSlot(
            $this->slotsDisponibles,
            $alumnosIds,
            $this->disponibilidadAlumnos
        );
    }

    /**
     * Detecta conflictos de aforo (más alumnos que capacidad)
     */
    private function detectarConflictosAforo(array $demandaPorSlot): array
    {
        return $this->calendarConflictDetector->detectarConflictosAforo(
            $demandaPorSlot,
            $this->alumnosMaxClase
        );
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
        $resultado = $this->calendarSubjectDistributor->distribuirAsignaturas(
            $demandaPorSlot,
            self::ASIGNATURAS,
            $this->duracionClase,
            self::HORAS_TOTALES_CURSO,
            $this->minutosCompletadosPorAlumno,
            $this->minutosAsignadosPorAlumno,
            $this->minutosRestantesAsignaturaPorAlumno
        );

        $this->minutosAsignadosPorAlumno = $resultado['minutosAsignadosPorAlumno'];
        $this->minutosRestantesAsignaturaPorAlumno = $resultado['minutosRestantesAsignaturaPorAlumno'];

        return $resultado['distribucion'];
    }

    /**
     * Crea las clases en la base de datos
     * 
     * @param string|null $fechaDesde Si se pasa, solo borra clases desde esta fecha en adelante
     */
    private function crearClases(array $distribucion, string $fechaInicioSemana, ?string $fechaDesde = null): array
    {
        return $this->calendarPersistenceService->crearClases(
            $distribucion,
            $this->centroId,
            $this->duracionClase,
            $fechaInicioSemana,
            $fechaDesde
        );
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
        $contexto = $this->calendarWeekContextBuilder->construirParaGeneracion(
            $this->centroId,
            $this->configuracion,
            $this->duracionClase,
            self::ASIGNATURAS,
            $alumnosIds,
            $fechaInicioSemana
        );

        $this->disponibilidadAlumnos = $contexto['disponibilidadAlumnos'];
        $this->slotsDisponibles = $contexto['slotsDisponibles'];
        $this->minutosCompletadosPorAlumno = $contexto['minutosCompletadosPorAlumno'];
        $this->minutosAsignadosPorAlumno = $contexto['minutosAsignadosPorAlumno'];
        $this->minutosRestantesAsignaturaPorAlumno = $contexto['minutosRestantesAsignaturaPorAlumno'];

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
        return $this->calendarReglasValidator->validarReglas(
            $clases,
            $alumnoId,
            $this->duracionClase,
            self::HORAS_TOTALES_CURSO,
            self::MINIMO_DIAS,
            self::MAXIMO_HORAS_DIA_ALUMNO
        );
    }

    /**
     * Obtiene estadísticas de generación para preview
     */
    public function obtenerPreview(string $fechaInicioSemana, array $alumnosIds): array
    {
        $contexto = $this->calendarWeekContextBuilder->construirParaPreview(
            $this->configuracion,
            $this->duracionClase,
            $alumnosIds,
            $fechaInicioSemana
        );

        $this->disponibilidadAlumnos = $contexto['disponibilidadAlumnos'];
        $this->slotsDisponibles = $contexto['slotsDisponibles'];

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
        return $this->calendarCoverageNoticeBuilder->calcularAvisosHorasNoCubiertas(
            $demandaPorSlot,
            $this->slotsDisponibles,
            $this->duracionClase
        );
    }

}
