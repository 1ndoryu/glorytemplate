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
export {useSuscripcion} from './useSuscripcion';
export {useCifrado} from './useCifrado';
export type {EstadoCifrado} from './useCifrado';
export {useStripe} from './useStripe';
export {useAdministracion} from './useAdministracion';
export type {UseAdministracionReturn} from './useAdministracion';
export {useConfiguracionLayout, ANCHO_MINIMO_COLUMNA, ANCHO_MAXIMO_COLUMNA, CONFIG_LAYOUT_DEFECTO, PRESETS_ANCHOS, ORDEN_PANELES_DEFECTO, TODOS_LOS_PANELES} from './useConfiguracionLayout';
export type {ModoColumnas, PanelId, ConfiguracionLayout, AnchoColumnas, VisibilidadPaneles, OrdenPanel} from './useConfiguracionLayout';
export {useArrastrePaneles} from './useArrastrePaneles';
export {useAlertas} from './useAlertas';
export type {TipoAlerta, AlertaToast, AlertaConfirmacion, UseAlertasReturn} from './useAlertas';
export {useAlmacenamiento} from './useAlmacenamiento';
export {useAdjuntos} from './useAdjuntos';
export {useMensajes, useMensajesNoLeidos, registrarEventoSistema, obtenerTipoVisual, obtenerIconoAccion} from './useMensajes';
export type {MensajeTimeline, TipoMensaje, AccionSistema} from './useMensajes';
