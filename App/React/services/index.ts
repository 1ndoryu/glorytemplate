/*
 * Barrel export — Services
 * Importar desde '@app/services' para acceso centralizado.
 */

export { crearLogger, configurarLogger, NivelLog } from './logger';
export type { Logger } from './logger';

export { apiPeticion, apiGet, apiPost, apiPut, apiDelete } from './apiCliente';
export type { RespuestaApi } from './apiCliente';

export { listarSamples, obtenerSample, obtenerFeed, subirSample } from './apiSamples';
export type { FiltrosSamples, PaginacionSamples, RespuestaListaSamples } from './apiSamples';

export { obtenerUsuarioActual, obtenerPerfil, actualizarPerfil, login, registrar } from './apiAuth';

export { seguirUsuario, dejarDeSeguir, darLike, quitarLike, crearPublicacion, obtenerFeedInicio } from './apiSocial';

export { obtenerConversaciones, obtenerMensajes, enviarMensaje, marcarConversacionLeida, iniciarConversacion } from './apiMensajes';

export { obtenerEstadisticasCreador, obtenerTopSamples, obtenerTransacciones, obtenerIngresosPorPeriodo, solicitarPayout } from './apiPagos';
export type { EstadisticasCreador, SampleStats, TransaccionCreador, IngresosPorPeriodo } from './apiPagos';

export { obtenerNotificaciones, marcarLeida, marcarTodasLeidas } from './apiNotificaciones';
export type { Notificacion, TipoNotificacion } from './apiNotificaciones';

export { obtenerLimites, descargarSample, puedeDescargar } from './apiDescargas';
export type { LimitesDescarga, ResultadoDescarga } from './apiDescargas';

export { listarColecciones, crearColeccion, actualizarColeccion, eliminarColeccion } from './apiColecciones';

export { wsService } from './wsService';
export type { MensajeWS, EstadoConexion, HandlerMensaje } from './wsService';
