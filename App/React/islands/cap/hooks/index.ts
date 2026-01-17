/**
 * CAP Hooks - Barrel Export
 *
 * Punto de exportación centralizado para todos los hooks del módulo CAP.
 */

export {useConfiguracion} from './useConfiguracion';
export type {DatosCentro, ConfiguracionHorarios, EstadoSuscripcion} from './useConfiguracion';

export {useAlumnos, calcularProgreso, estadoProgreso} from './useAlumnos';
export type {Alumno, FiltrosAlumnos} from './useAlumnos';
