/**
 * CAP Hooks - Barrel Export
 *
 * Punto de exportación centralizado para todos los hooks del módulo CAP.
 */

export {useConfiguracion} from './useConfiguracion';
export type {DatosCentro, ConfiguracionHorarios, InfoSuscripcion} from './useConfiguracion';

export {useAlumnos, calcularProgreso, estadoProgreso} from './useAlumnos';
export type {Alumno, FiltrosAlumnos} from './useAlumnos';

export {useDisponibilidad, DIAS_SEMANA, HORAS_DISPONIBLES} from './useDisponibilidad';
export type {DiaSemana, SlotDisponibilidad, DisponibilidadAlumno} from './useDisponibilidad';

export {useCalendario} from './useCalendario';

/* useHistorial eliminado (8.14): era codigo muerto, useCalendario tiene su propio historial interno */

export {useReportes} from './useReportes';
