/*
 * Exportaciones de hooks personalizados
 */

export {useDashboard} from './useDashboard';
export {useLocalStorage, CLAVES_LOCALSTORAGE} from './useLocalStorage';
export {useDebounceValue, useDebounceCallback} from './useDebounce';
export {useDeshacer} from './useDeshacer';
export {useOrdenarHabitos, MODOS_ORDEN} from './useOrdenarHabitos';
export type {ModoOrdenHabitos} from './useOrdenarHabitos';
export {useDashboardApi} from './useDashboardApi';
export type {DashboardData, EstadoApi, SyncStatus} from './useDashboardApi';
export {useSincronizacion, estaUsuarioLogueado, obtenerUserId} from './useSincronizacion';
