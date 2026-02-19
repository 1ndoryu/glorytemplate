<?php

/**
 * Seeder para datos de demostración del módulo CAP
 * Crea datos de ejemplo realistas para testing y demos comerciales
 * 
 * @package Glory\App\Database
 */

namespace Glory\App\Database;

use App\Config\Schema\_generated\CapAlumnosCols;
use App\Config\Schema\_generated\CapAlumnosEnums;
use App\Config\Schema\_generated\CapAsistenciaCols;
use App\Config\Schema\_generated\CapClasesCols;
use App\Config\Schema\_generated\CapDisponibilidadCols;
use App\Config\Schema\_generated\CapDisponibilidadEnums;
use App\Config\Schema\CapAsignaturasConstants;

class CapSeeder
{
    private int $centroId;

    /* 
     * Nombres realistas para alumnos de autoescuela
     * Mezcla de géneros y apellidos comunes en España
     */
    private array $nombresEjemplo = [
        ['nombre' => 'María García López', 'email' => 'maria.garcia@ejemplo.com', 'telefono' => '612345001', 'dni' => '12345678A'],
        ['nombre' => 'Carlos Fernández Ruiz', 'email' => 'carlos.fernandez@ejemplo.com', 'telefono' => '612345002', 'dni' => '23456789B'],
        ['nombre' => 'Ana Martínez Sánchez', 'email' => 'ana.martinez@ejemplo.com', 'telefono' => '612345003', 'dni' => '34567890C'],
        ['nombre' => 'Pedro Rodríguez Gómez', 'email' => 'pedro.rodriguez@ejemplo.com', 'telefono' => '612345004', 'dni' => '45678901D'],
        ['nombre' => 'Laura Hernández Díaz', 'email' => 'laura.hernandez@ejemplo.com', 'telefono' => '612345005', 'dni' => '56789012E'],
        ['nombre' => 'Miguel López Moreno', 'email' => 'miguel.lopez@ejemplo.com', 'telefono' => '612345006', 'dni' => '67890123F'],
        ['nombre' => 'Carmen Sánchez Muñoz', 'email' => 'carmen.sanchez@ejemplo.com', 'telefono' => '612345007', 'dni' => '78901234G'],
        ['nombre' => 'David Pérez Álvarez', 'email' => 'david.perez@ejemplo.com', 'telefono' => '612345008', 'dni' => '89012345H'],
        ['nombre' => 'Sandra Gómez Romero', 'email' => 'sandra.gomez@ejemplo.com', 'telefono' => '612345009', 'dni' => '90123456I'],
        ['nombre' => 'Javier Torres Navarro', 'email' => 'javier.torres@ejemplo.com', 'telefono' => '612345010', 'dni' => '01234567J'],
        ['nombre' => 'Isabel Ruiz Jiménez', 'email' => 'isabel.ruiz@ejemplo.com', 'telefono' => '612345011', 'dni' => '11234567K'],
        ['nombre' => 'Antonio Díaz Serrano', 'email' => 'antonio.diaz@ejemplo.com', 'telefono' => '612345012', 'dni' => '21234567L'],
    ];

    /*
     * Asignaturas CAP derivadas de CapAsignaturasConstants.
     * Fuente única de verdad para codigos canonicos.
     */

    public function __construct(int $centroId)
    {
        $this->centroId = $centroId;
    }

    /**
     * Verifica si el modo demo está permitido
     * Solo accesible en desarrollo o con constante explícita
     */
    public static function estaPermitido(): bool
    {
        /* Permitir si WP_DEBUG está activo */
        if (defined('WP_DEBUG') && WP_DEBUG) {
            return true;
        }

        /* Permitir con constante explícita */
        if (defined('CAP_ALLOW_DEMO_MODE') && CAP_ALLOW_DEMO_MODE) {
            return true;
        }

        return false;
    }

    /**
     * Verifica si hay datos demo activos para el centro actual
     */
    public function hayDatosDemo(): bool
    {
        global $wpdb;
        $tablaAlumnos = $wpdb->prefix . CapAlumnosCols::TABLA;

        $count = $wpdb->get_var($wpdb->prepare(
            "SELECT COUNT(*) FROM {$tablaAlumnos} WHERE centro_id = %d AND email LIKE %s",
            $this->centroId,
            '%@ejemplo.com'
        ));

        return (int) $count > 0;
    }

    /**
     * Obtiene estadísticas del modo demo
     */
    public function obtenerEstado(): array
    {
        global $wpdb;

        $tablaAlumnos = $wpdb->prefix . CapAlumnosCols::TABLA;
        $tablaClases = $wpdb->prefix . CapClasesCols::TABLA;

        $alumnosDemo = $wpdb->get_var($wpdb->prepare(
            "SELECT COUNT(*) FROM {$tablaAlumnos} WHERE centro_id = %d AND email LIKE %s",
            $this->centroId,
            '%@ejemplo.com'
        ));

        /* 
         * Contar clases de la semana actual del centro
         * Las clases demo se crean junto con los alumnos demo
         */
        $clasesDemo = 0;
        if ((int)$alumnosDemo > 0) {
            /* Obtener inicio de la semana actual */
            $hoy = new \DateTime();
            $diaSemana = (int) $hoy->format('N');
            $lunes = clone $hoy;
            $lunes->modify('-' . ($diaSemana - 1) . ' days');
            $viernes = clone $lunes;
            $viernes->modify('+4 days');

            $clasesDemo = $wpdb->get_var($wpdb->prepare(
                "SELECT COUNT(*) FROM {$tablaClases} 
                 WHERE centro_id = %d 
                 AND fecha BETWEEN %s AND %s",
                $this->centroId,
                $lunes->format('Y-m-d'),
                $viernes->format('Y-m-d')
            ));
        }

        return [
            'activo' => $this->hayDatosDemo(),
            'permitido' => self::estaPermitido(),
            'estadisticas' => [
                'alumnos' => (int) $alumnosDemo,
                'clases' => (int) $clasesDemo,
            ]
        ];
    }

    /**
     * Pobla todas las tablas con datos de demostración
     */
    public function seedAll(): array
    {
        if (!self::estaPermitido()) {
            return [
                'exito' => false,
                'error' => 'Modo demo no permitido en este entorno'
            ];
        }

        /* Si ya hay datos demo, limpiar primero */
        if ($this->hayDatosDemo()) {
            $this->cleanAll();
        }

        try {
            global $wpdb;
            /* Transacción: todas las inserciones demo deben ser atómicas */
            $wpdb->query('START TRANSACTION');

            $alumnosCreados = $this->crearAlumnos();
            $this->crearDisponibilidades($alumnosCreados);
            $clasesCreadas = $this->crearClasesEjemplo();
            $this->asignarAsistencias($alumnosCreados, $clasesCreadas);

            $wpdb->query('COMMIT');
            $this->registrarAccion('seed', count($alumnosCreados));

            return [
                'exito' => true,
                'mensaje' => 'Datos de demostración creados correctamente',
                'estadisticas' => [
                    'alumnos' => count($alumnosCreados),
                    'clases' => count($clasesCreadas),
                ]
            ];
        } catch (\Throwable $e) {
            $wpdb->query('ROLLBACK');
            error_log('[CapSeeder::seedAll] Rollback — ' . $e->getMessage());
            return [
                'exito' => false,
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Limpia todos los datos de demostración
     */
    public function cleanAll(): array
    {
        if (!self::estaPermitido()) {
            return [
                'exito' => false,
                'error' => 'Modo demo no permitido en este entorno'
            ];
        }

        global $wpdb;

        try {
            /* Obtener IDs de alumnos demo */
            $tablaAlumnos = $wpdb->prefix . CapAlumnosCols::TABLA;
            $alumnosIds = $wpdb->get_col($wpdb->prepare(
                "SELECT id FROM {$tablaAlumnos} WHERE centro_id = %d AND email LIKE %s",
                $this->centroId,
                '%@ejemplo.com'
            ));

            if (empty($alumnosIds)) {
                return [
                    'exito' => true,
                    'mensaje' => 'No hay datos demo para limpiar',
                    'eliminados' => ['alumnos' => 0, 'clases' => 0]
                ];
            }

            /* Transacción: todas las eliminaciones demo deben ser atómicas */
            $wpdb->query('START TRANSACTION');

            $idsPlaceholder = implode(',', array_map('intval', $alumnosIds));

            /* Eliminar asistencias de alumnos demo — usar $wpdb->prepare con placeholders */
            $tablaAsistencia = $wpdb->prefix . CapAsistenciaCols::TABLA;
            $placeholders = implode(',', array_fill(0, count($alumnosIds), '%d'));
            $wpdb->query($wpdb->prepare(
                "DELETE FROM {$tablaAsistencia} WHERE alumno_id IN ({$placeholders})",
                ...$alumnosIds
            ));

            /* Eliminar clases de la semana actual (las creadas por el seeder) */
            $tablaClases = $wpdb->prefix . CapClasesCols::TABLA;
            $hoy = new \DateTime();
            $diaSemana = (int) $hoy->format('N');
            $lunes = clone $hoy;
            $lunes->modify('-' . ($diaSemana - 1) . ' days');
            $viernes = clone $lunes;
            $viernes->modify('+4 days');

            /* 
             * Eliminar solo clases NO bloqueadas de la semana demo
             * Las clases con bloqueada = 1 deben preservarse
             */
            $clasesEliminadas = $wpdb->query($wpdb->prepare(
                "DELETE FROM {$tablaClases} 
                 WHERE centro_id = %d 
                 AND fecha BETWEEN %s AND %s
                 AND bloqueada = 0",
                $this->centroId,
                $lunes->format('Y-m-d'),
                $viernes->format('Y-m-d')
            ));

            /* Eliminar disponibilidad de alumnos demo — usar $wpdb->prepare */
            $tablaDisponibilidad = $wpdb->prefix . CapDisponibilidadCols::TABLA;
            $wpdb->query($wpdb->prepare(
                "DELETE FROM {$tablaDisponibilidad} WHERE alumno_id IN ({$placeholders})",
                ...$alumnosIds
            ));

            /* Eliminar alumnos demo — usar $wpdb->prepare */
            $wpdb->query($wpdb->prepare(
                "DELETE FROM {$tablaAlumnos} WHERE id IN ({$placeholders})",
                ...$alumnosIds
            ));

            $wpdb->query('COMMIT');
            $this->registrarAccion('clean', count($alumnosIds));

            return [
                'exito' => true,
                'mensaje' => 'Datos de demostración eliminados',
                'eliminados' => [
                    'alumnos' => count($alumnosIds),
                    'clases' => (int) $clasesEliminadas,
                ]
            ];
        } catch (\Throwable $e) {
            $wpdb->query('ROLLBACK');
            error_log('[CapSeeder::cleanAll] Rollback — ' . $e->getMessage());
            return [
                'exito' => false,
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Crea alumnos de ejemplo con diferentes estados de progreso
     */
    private function crearAlumnos(): array
    {
        global $wpdb;
        $tabla = $wpdb->prefix . CapAlumnosCols::TABLA;
        $alumnosCreados = [];

        /* Distribución de progreso: nuevos, en curso, casi listos, completados */
        $distribucionHoras = [0, 0, 8, 12, 15, 20, 25, 28, 30, 32, 34, 35];

        foreach ($this->nombresEjemplo as $index => $datos) {
            $horasCompletadas = $distribucionHoras[$index] ?? 0;
            $estado = CapAlumnosEnums::ESTADO_ACTIVO;
            if ($horasCompletadas >= 35) {
                $estado = CapAlumnosEnums::ESTADO_COMPLETADO;
            }

            $insertado = $wpdb->insert($tabla, [
                CapAlumnosCols::CENTRO_ID => $this->centroId,
                CapAlumnosCols::NOMBRE => $datos['nombre'],
                CapAlumnosCols::EMAIL => $datos['email'],
                CapAlumnosCols::TELEFONO => $datos['telefono'],
                CapAlumnosCols::DNI => $datos['dni'],
                CapAlumnosCols::HORAS_COMPLETADAS => $horasCompletadas,
                CapAlumnosCols::ESTADO => $estado,
                CapAlumnosCols::CREATED_AT => current_time('mysql'),
                CapAlumnosCols::UPDATED_AT => current_time('mysql'),
            ]);

            if ($insertado === false) {
                error_log("[CAP Seeder] ERROR: Fallo al insertar alumno '{$datos['nombre']}'. DB error: {$wpdb->last_error}");
                continue;
            }

            $alumnosCreados[] = [
                'id' => $wpdb->insert_id,
                'nombre' => $datos['nombre'],
                'horas' => $horasCompletadas,
            ];
        }

        return $alumnosCreados;
    }

    /**
     * Crea disponibilidades variadas para los alumnos
     * Algunos mañana, algunos tarde, algunos mixtos
     */
    private function crearDisponibilidades(array $alumnos): void
    {
        global $wpdb;
        $tabla = $wpdb->prefix . CapDisponibilidadCols::TABLA;
        $dias = [
            CapDisponibilidadEnums::DIA_LUNES,
            CapDisponibilidadEnums::DIA_MARTES,
            CapDisponibilidadEnums::DIA_MIERCOLES,
            CapDisponibilidadEnums::DIA_JUEVES,
            CapDisponibilidadEnums::DIA_VIERNES,
        ];

        /* Patrones de disponibilidad */
        $patrones = [
            'manana' => ['09:00', '10:00', '11:00', '12:00', '13:00'],
            'tarde' => ['16:00', '17:00', '18:00', '19:00', '20:00'],
            'mixto' => ['09:00', '10:00', '16:00', '17:00', '18:00'],
            'completo' => ['09:00', '10:00', '11:00', '12:00', '13:00', '16:00', '17:00', '18:00', '19:00', '20:00'],
        ];

        $tiposPatron = array_keys($patrones);

        foreach ($alumnos as $index => $alumno) {
            /* Asignar patrón según índice para variedad */
            $tipoPatron = $tiposPatron[$index % count($tiposPatron)];
            $horas = $patrones[$tipoPatron];

            /* Algunos alumnos no disponibles todos los días */
            $diasDisponibles = $dias;
            if ($index % 3 === 0) {
                /* Quitar un día aleatorio */
                array_splice($diasDisponibles, $index % 5, 1);
            }

            foreach ($diasDisponibles as $dia) {
                foreach ($horas as $hora) {
                    $wpdb->insert($tabla, [
                        CapDisponibilidadCols::ALUMNO_ID => $alumno['id'],
                        CapDisponibilidadCols::DIA => $dia,
                        CapDisponibilidadCols::HORA => $hora,
                        CapDisponibilidadCols::DISPONIBLE => 1,
                        CapDisponibilidadCols::CREATED_AT => current_time('mysql'),
                        CapDisponibilidadCols::UPDATED_AT => current_time('mysql'),
                    ]);
                }
            }
        }
    }

    /**
     * Crea clases de ejemplo para la semana actual
     * Incluye clases bloqueadas y variedad de asignaturas
     */
    private function crearClasesEjemplo(): array
    {
        global $wpdb;
        $tabla = $wpdb->prefix . CapClasesCols::TABLA;
        $clasesCreadas = [];

        /* Obtener lunes de la semana actual */
        $hoy = new \DateTime();
        $diaSemana = (int) $hoy->format('N');
        $lunes = clone $hoy;
        $lunes->modify('-' . ($diaSemana - 1) . ' days');

        /* Horarios disponibles */
        $horariosManana = ['09:00', '10:00', '11:00', '12:00', '13:00'];
        $horariosTarde = ['16:00', '17:00', '18:00', '19:00', '20:00'];

        $asignaturasRotativas = CapAsignaturasConstants::TODOS;
        $indexAsignatura = 0;

        /* Crear clases para cada día de la semana */
        for ($i = 0; $i < 5; $i++) {
            $fecha = clone $lunes;
            $fecha->modify('+' . $i . ' days');
            $fechaStr = $fecha->format('Y-m-d');

            /* Clases de mañana */
            foreach ($horariosManana as $ki => $horaInicio) {
                /* Saltar algunos slots para no llenar todo */
                if (($i + $ki) % 3 === 0) continue;

                $asignatura = $asignaturasRotativas[$indexAsignatura % count($asignaturasRotativas)];
                $indexAsignatura++;

                /* Algunas clases bloqueadas (viernes o primeras) */
                $bloqueada = ($i === 4 && $ki === 0) || ($i === 0 && $ki === 2) ? 1 : 0;

                $horaFin = date('H:i', strtotime($horaInicio) + 3600);

                $wpdb->insert($tabla, [
                    CapClasesCols::CENTRO_ID => $this->centroId,
                    CapClasesCols::FECHA => $fechaStr,
                    CapClasesCols::HORA_INICIO => $horaInicio . ':00',
                    CapClasesCols::HORA_FIN => $horaFin . ':00',
                    CapClasesCols::ASIGNATURA => $asignatura,
                    CapClasesCols::DURACION_MINUTOS => 60,
                    CapClasesCols::BLOQUEADA => $bloqueada,
                    CapClasesCols::CREATED_AT => current_time('mysql'),
                ]);

                $clasesCreadas[] = [
                    'id' => $wpdb->insert_id,
                    'fecha' => $fechaStr,
                    'hora' => $horaInicio,
                    'asignatura' => $asignatura,
                ];
            }

            /* Clases de tarde (menos frecuentes) */
            foreach ($horariosTarde as $kj => $horaInicio) {
                /* Solo algunos slots de tarde */
                if (($i + $kj) % 2 !== 0) continue;

                $asignatura = $asignaturasRotativas[$indexAsignatura % count($asignaturasRotativas)];
                $indexAsignatura++;

                $horaFin = date('H:i', strtotime($horaInicio) + 3600);

                $wpdb->insert($tabla, [
                    CapClasesCols::CENTRO_ID => $this->centroId,
                    CapClasesCols::FECHA => $fechaStr,
                    CapClasesCols::HORA_INICIO => $horaInicio . ':00',
                    CapClasesCols::HORA_FIN => $horaFin . ':00',
                    CapClasesCols::ASIGNATURA => $asignatura,
                    CapClasesCols::DURACION_MINUTOS => 60,
                    CapClasesCols::BLOQUEADA => 0,
                    CapClasesCols::CREATED_AT => current_time('mysql'),
                ]);

                $clasesCreadas[] = [
                    'id' => $wpdb->insert_id,
                    'fecha' => $fechaStr,
                    'hora' => $horaInicio,
                    'asignatura' => $asignatura,
                ];
            }
        }

        return $clasesCreadas;
    }

    /**
     * Asigna alumnos a clases según su disponibilidad
     */
    /**
     * Asigna alumnos a clases de forma rotativa
     * Para demo, no verificamos disponibilidad estricta - simplemente distribuimos alumnos
     */
    private function asignarAsistencias(array $alumnos, array $clases): void
    {
        global $wpdb;
        $tablaAsistencia = $wpdb->prefix . CapAsistenciaCols::TABLA;

        /* Cantidad de alumnos por clase (entre 4 y 8 para realismo) */
        $alumnosTotal = count($alumnos);

        foreach ($clases as $indexClase => $clase) {
            /* Determinar cuántos alumnos asignar a esta clase */
            $cantidadAlumnos = 4 + ($indexClase % 5);

            /* Rotar el inicio de alumnos para variedad */
            $offset = ($indexClase * 3) % $alumnosTotal;

            for ($i = 0; $i < $cantidadAlumnos && $i < $alumnosTotal; $i++) {
                $indexAlumno = ($offset + $i) % $alumnosTotal;
                $alumno = $alumnos[$indexAlumno];

                /* Verificar si ya está asignado (evitar duplicados) */
                $yaAsignado = $wpdb->get_var($wpdb->prepare(
                    "SELECT COUNT(*) FROM {$tablaAsistencia} WHERE clase_id = %d AND alumno_id = %d",
                    $clase['id'],
                    $alumno['id']
                ));

                if (!$yaAsignado) {
                    $wpdb->insert($tablaAsistencia, [
                        CapAsistenciaCols::CLASE_ID => $clase['id'],
                        CapAsistenciaCols::ALUMNO_ID => $alumno['id'],
                        CapAsistenciaCols::ASISTIO => 1,
                        CapAsistenciaCols::CREATED_AT => current_time('mysql'),
                    ]);
                }
            }
        }
    }

    /**
     * Registra acciones de seeding para auditoría
     */
    private function registrarAccion(string $accion, int $cantidad): void
    {
        $log = sprintf(
            '[CAP Demo] %s: Acción "%s" ejecutada para centro %d. Registros: %d. Usuario: %d',
            current_time('mysql'),
            $accion,
            $this->centroId,
            $cantidad,
            get_current_user_id()
        );

        error_log($log);
    }
}
