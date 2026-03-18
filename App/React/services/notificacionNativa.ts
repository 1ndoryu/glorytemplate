/*
 * Servicio: notificacionNativa — Kamples
 * Abstracción sobre tauri-plugin-notification para mostrar notificaciones
 * nativas del sistema operativo (Android notification tray, Windows notifications).
 *
 * Solo se activa en entorno Tauri (desktop/mobile).
 * En web, no hace nada (las notificaciones web se manejan via sw-push.js).
 *
 * Canales Android:
 * - "notificaciones": Likes, follows, comentarios, etc.
 * - "mensajes": Mensajes directos de otros usuarios.
 */

import { crearLogger } from './logger';
import { esAndroid, esTauri } from '@app/utils/plataforma';

const log = crearLogger('notificacionNativa');

/* IDs de canales Android (POST_NOTIFICATIONS requiere canales en API 26+) */
const CANAL_NOTIFICACIONES = 'notificaciones';
const CANAL_MENSAJES = 'mensajes';

/* Contadores para IDs únicos de notificación */
let contadorId = 0;

/**
 * Importa el módulo de notificaciones de Tauri de forma lazy.
 * Retorna null si no estamos en Tauri o si el plugin no está disponible.
 */
async function obtenerPlugin() {
    if (!esTauri()) return null;
    try {
        return await import('@tauri-apps/plugin-notification');
    } catch {
        log.debug('Plugin de notificaciones Tauri no disponible');
        return null;
    }
}

/**
 * Inicializar canales de notificación para Android.
 * En desktop esto no es necesario, pero no causa error.
 * Se llama una vez al inicio de la app.
 */
export async function inicializarCanalesNotificacion(): Promise<boolean> {
    const plugin = await obtenerPlugin();
    if (!plugin) return false;

    try {
        /* Solicitar permiso (Android 13+ requiere permiso explícito) */
        const permisoOk = await plugin.isPermissionGranted();
        if (!permisoOk) {
            const resultado = await plugin.requestPermission();
            if (resultado !== 'granted') {
                log.info('Permiso de notificaciones denegado por el usuario');
                return false;
            }
        }

        /* Crear canales solo en Android (API 26+ / minSdk 26) */
        if (esAndroid() && plugin.createChannel) {
            await plugin.createChannel({
                id: CANAL_NOTIFICACIONES,
                name: 'Notificaciones',
                description: 'Likes, follows, comentarios y actividad',
                importance: 3, /* HIGH — muestra en la barra de estado */
                visibility: 0, /* PUBLIC */
                vibration: true,
                sound: 'default',
            });

            await plugin.createChannel({
                id: CANAL_MENSAJES,
                name: 'Mensajes',
                description: 'Mensajes directos de otros usuarios',
                importance: 4, /* MAX — heads-up display */
                visibility: 0, /* PUBLIC */
                vibration: true,
                sound: 'default',
            });

            log.info('Canales Android de notificación creados');
        }

        return true;
    } catch (err) {
        log.error('Error inicializando canales de notificación', err);
        return false;
    }
}

/**
 * Datos del evento WS tipo 'notificacion'.
 * QL45: Enriquecido con avatarUrl del actor y enlace para click-to-navigate.
 */
interface DatosNotificacionWS {
    tipo?: string;
    titulo?: string;
    mensaje?: string;
    actor?: { username: string; avatarUrl?: string | null } | null;
    enlace?: string | null;
}

/**
 * Datos del evento WS tipo 'mensaje_nuevo'.
 */
interface DatosMensajeWS {
    conversacionId?: number;
    mensaje?: {
        contenido?: string;
        tipo?: string;
        remitenteId?: number;
    };
}

/**
 * Mostrar notificación nativa para un evento de tipo "notificacion".
 * Extrae titulo y cuerpo del payload WS.
 */
export async function mostrarNotificacionNativa(datos: DatosNotificacionWS): Promise<void> {
    const plugin = await obtenerPlugin();
    if (!plugin) return;

    const titulo = datos.titulo || formatearTipoNotificacion(datos.tipo);
    const cuerpo = datos.mensaje || '';
    const actorTexto = datos.actor?.username ? `${datos.actor.username}: ` : '';

    try {
        contadorId += 1;
        await plugin.sendNotification({
            id: contadorId,
            title: titulo,
            body: `${actorTexto}${cuerpo}`,
            channelId: esAndroid() ? CANAL_NOTIFICACIONES : undefined,
        });
    } catch (err) {
        log.error('Error mostrando notificación nativa', err);
    }
}

/**
 * Mostrar notificación nativa para un mensaje directo nuevo.
 */
export async function mostrarNotificacionMensaje(datos: DatosMensajeWS): Promise<void> {
    const plugin = await obtenerPlugin();
    if (!plugin) return;

    const contenido = datos.mensaje?.contenido || '';
    const esMedio = datos.mensaje?.tipo === 'audio' || datos.mensaje?.tipo === 'imagen';
    const cuerpo = esMedio ? `[${datos.mensaje?.tipo ?? 'archivo'}]` : contenido;

    try {
        contadorId += 1;
        await plugin.sendNotification({
            id: contadorId,
            title: 'Nuevo mensaje',
            body: cuerpo,
            channelId: esAndroid() ? CANAL_MENSAJES : undefined,
        });
    } catch (err) {
        log.error('Error mostrando notificación de mensaje', err);
    }
}

/**
 * Convierte un tipo de notificación en un título legible.
 */
function formatearTipoNotificacion(tipo?: string): string {
    const mapa: Record<string, string> = {
        like: 'Nuevo like',
        encanta: 'Le encanta tu sample',
        follow: 'Nuevo seguidor',
        comentario: 'Nuevo comentario',
        mencion: 'Te mencionaron',
        descarga: 'Descargaron tu sample',
        repost: 'Repost de tu sample',
        sistema: 'Kamples',
        pago: 'Pago recibido',
    };
    return mapa[tipo ?? ''] ?? 'Kamples';
}
