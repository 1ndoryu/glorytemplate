import type { ToastTipo } from '@app/stores/toastStore';
import type { Notificacion } from '@app/services/apiNotificaciones';
import type {
    DefinicionTipoNotificacion,
    MapaTiposNotificacion,
    NotificacionUI,
    PrioridadNotificacion,
} from '@app/types/notificaciones';

const DEFINICIONES_NOTIFICACION: MapaTiposNotificacion = {
    like: {
        categoria: 'social',
        prioridad: 'baja',
        permiteToast: false,
    },
    encanta: {
        categoria: 'social',
        prioridad: 'media',
        permiteToast: false,
    },
    follow: {
        categoria: 'social',
        prioridad: 'baja',
        permiteToast: false,
    },
    comentario: {
        categoria: 'social',
        prioridad: 'media',
        permiteToast: false,
    },
    descarga: {
        categoria: 'monetizacion',
        prioridad: 'alta',
        permiteToast: true,
    },
    mensaje: {
        categoria: 'mensajes',
        prioridad: 'media',
        permiteToast: true,
    },
    pago: {
        categoria: 'monetizacion',
        prioridad: 'alta',
        permiteToast: true,
    },
    sistema: {
        categoria: 'sistema',
        prioridad: 'media',
        permiteToast: false,
    },
    moderacion: {
        categoria: 'sistema',
        prioridad: 'critica',
        permiteToast: true,
    },
    duplicado_detectado: {
        categoria: 'sistema',
        prioridad: 'alta',
        permiteToast: true,
    },
    venta: {
        categoria: 'monetizacion',
        prioridad: 'alta',
        permiteToast: true,
    },
};

const MENSAJE_POR_DEFECTO = 'Tienes una nueva notificación';

export const obtenerDefinicionNotificacion = (
    tipo: Notificacion['tipo']
): DefinicionTipoNotificacion => {
    return DEFINICIONES_NOTIFICACION[tipo];
};

export const mapearNotificacionApiANotificacionUI = (
    notificacion: Notificacion
): NotificacionUI => {
    const definicion = obtenerDefinicionNotificacion(notificacion.tipo);
    const textoPrincipal = notificacion.mensaje?.trim() || notificacion.titulo?.trim() || MENSAJE_POR_DEFECTO;
    const textoSecundario = notificacion.titulo?.trim() && notificacion.titulo.trim() !== textoPrincipal
        ? notificacion.titulo.trim()
        : '';

    return {
        ...notificacion,
        categoria: definicion.categoria,
        prioridad: definicion.prioridad,
        permiteToast: definicion.permiteToast,
        toastMensaje: textoSecundario
            ? `${textoSecundario}: ${textoPrincipal}`
            : textoPrincipal,
    };
};

export const obtenerTipoToastParaPrioridad = (
    prioridad: PrioridadNotificacion
): ToastTipo => {
    if (prioridad === 'critica') return 'error';
    if (prioridad === 'alta') return 'exito';
    return 'info';
};