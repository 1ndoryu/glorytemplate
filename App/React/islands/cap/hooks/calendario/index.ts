/**
 * Barrel de hooks del calendario.
 * Cada sub-hook gestiona un dominio específico del calendario.
 * useCalendario (en ../useCalendario.ts) los compone en una API unificada.
 */
export {useCalendarioNavegacion} from './useCalendarioNavegacion';
export {useCalendarioClases} from './useCalendarioClases';
export {useCalendarioGeneracion} from './useCalendarioGeneracion';
export {useCalendarioEdicion} from './useCalendarioEdicion';
export {useCalendarioMovimiento} from './useCalendarioMovimiento';
export {useCalendarioEliminacion} from './useCalendarioEliminacion';
export type {EstadoCalendario, AccionesCalendario, EstadoBase, CambiosClase} from './tipos';
