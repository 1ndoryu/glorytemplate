/*
 * Barrel export de todos los tipos de Kamples.
 * Importar desde '@app/types' para acceso centralizado.
 */

export type {
    Sample,
    SampleResumen,
    MetadataSample,
    EstadoSample,
    TipoSample,
    TipoReaccion,
    NotaMusical,
    EscalaMusical,
} from './sample';

export type {
    Usuario,
    UsuarioResumen,
    UsuarioAutenticado,
    TipoPlan,
    RolUsuario,
} from './usuario';

export type {
    Publicacion,
    Comentario,
    TipoPublicacion,
} from './publicacion';

export type {
    Conversacion,
    Mensaje,
    TipoMensaje,
    MediaMetadata,
    MediaMetadataImagen,
    MediaMetadataAudio,
    MediaMetadataSample,
} from './mensaje';

export type {
    Notificacion,
    TipoNotificacion,
} from './notificacion';

export type {
    Plan,
    Suscripcion,
    Transaccion,
    NombrePlan,
    EstadoSuscripcion,
    TipoTransaccion,
    EstadoTransaccion,
} from './plan';

export type {
    Coleccion,
    ColeccionResumen,
} from './coleccion';

/* Schema generado — interfaces DB crudas y constantes de columna */
export type {
    IAlgoritmoEstado,
    IColecciones,
    IColeccionSamples,
    IComentarios,
    IConversaciones,
    IDescargas,
    IFollows,
    ILikes,
    IMensajes,
    INotificaciones,
    IPublicaciones,
    IReportesDuplicados,
    IReportes,
    IReproducciones,
    ISamples,
    ISuscripciones,
    ITransacciones,
    IUsuariosExt,
} from './_generated/schema';

export {
    SamplesCols,
    UsuariosExtCols,
    ColeccionesCols,
    ColeccionSamplesCols,
    ComentariosCols,
    ConversacionesCols,
    DescargasCols,
    FollowsCols,
    LikesCols,
    MensajesCols,
    NotificacionesCols,
    PublicacionesCols,
    ReportesDuplicadosCols,
    ReportesCols,
    ReproduccionesCols,
    SuscripcionesCols,
    TransaccionesCols,
    AlgoritmoEstadoCols,
} from './_generated/schema';
