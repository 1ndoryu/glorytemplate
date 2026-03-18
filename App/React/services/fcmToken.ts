/*
 * Servicio: fcmToken — Kamples
 * Lee el token FCM guardado por el servicio nativo Android (KamplesFirebaseService)
 * y lo registra en el backend para habilitar push con app cerrada.
 *
 * Bridge: Kotlin escribe en files/fcm_token.txt → JS lo lee con Tauri FS plugin.
 * Solo activo en Android (Tauri). En web/desktop no hace nada.
 *
 * QL34: FCM integration Android.
 */

import { crearLogger } from './logger';
import { apiPost } from './apiCliente';
import { esAndroid, esCapacitor } from '@app/utils/plataforma';

const log = crearLogger('fcmToken');
const CLAVE_REGISTRADO = 'fcm_token_registrado';
const CLAVE_NAVEGACION_PENDIENTE = 'kamples_fcm_nav_pendiente';
let listenersCapacitorRegistrados = false;

/**
 * Leer token FCM del archivo escrito por el servicio nativo.
 * Retorna null si no es Android, el plugin no está disponible o el archivo no existe.
 */
async function leerTokenFcm(): Promise<string | null> {
    if (!esAndroid()) return null;

    if (esCapacitor()) {
        return null;
    }

    try {
        const token = await window.__KAMPLES_ANDROID_BRIDGE__?.leerTokenFcm?.();
        return token && token.trim() ? token.trim() : null;
    } catch (err) {
        log.debug('Error leyendo token FCM:', err);
        return null;
    }
}

async function registrarTokenEnBackend(token: string): Promise<void> {
    try {
        const resp = await apiPost('/fcm/registrar', {
            token,
            plataforma: 'android',
        });

        if (resp.ok) {
            sessionStorage.setItem(CLAVE_REGISTRADO, '1');
            log.info('Token FCM registrado en backend');
            return;
        }

        log.warn('Error registrando token FCM:', resp.error);
    } catch (err) {
        log.warn('Excepcion registrando token FCM:', err);
    }
}

/* [183A-37] Crear canales de notificación Android via Capacitor API.
 * Sin canales, Android descarta silenciosamente las push que llegan con un channel_id
 * que no existe en el dispositivo. El backend envía channel_id "notificaciones" o "mensajes". */
async function crearCanalesCapacitor(PushNotifications: {
    createChannel: (channel: {
        id: string;
        name: string;
        description: string;
        importance: number;
        visibility: number;
        vibration: boolean;
        sound: string;
    }) => Promise<void>;
}): Promise<void> {
    try {
        await PushNotifications.createChannel({
            id: 'notificaciones',
            name: 'Notificaciones',
            description: 'Likes, follows, comentarios y actividad',
            importance: 3,
            visibility: 0,
            vibration: true,
            sound: 'default',
        });
        await PushNotifications.createChannel({
            id: 'mensajes',
            name: 'Mensajes',
            description: 'Mensajes directos de otros usuarios',
            importance: 4,
            visibility: 0,
            vibration: true,
            sound: 'default',
        });
        log.info('Canales de notificación Android creados');
    } catch (err) {
        log.warn('Error creando canales de notificación Android:', err);
    }
}

async function inicializarPushCapacitor(): Promise<void> {
    const { PushNotifications } = await import('@capacitor/push-notifications');

    /* Crear canales Android antes de registrar listeners (Android 8+ los requiere) */
    await crearCanalesCapacitor(PushNotifications as unknown as Parameters<typeof crearCanalesCapacitor>[0]);

    if (!listenersCapacitorRegistrados) {
        listenersCapacitorRegistrados = true;

        await PushNotifications.addListener('registration', (tokenEvento) => {
            const token = tokenEvento as { value?: string } | null | undefined;
            const valor = typeof token?.value === 'string' ? token.value.trim() : '';
            if (!valor) return;
            log.info('Token FCM obtenido, registrando en backend...');
            void registrarTokenEnBackend(valor);
        });

        await PushNotifications.addListener('registrationError', (error) => {
            log.warn('Error registrando PushNotifications en Capacitor', error);
        });

        /* [183A-37] Listener para notificaciones recibidas con la app en foreground.
         * Sin esto, Capacitor intercepta la push y no la muestra en la bandeja. */
        await (PushNotifications as unknown as {
            addListener: (event: string, cb: (n: unknown) => void) => Promise<unknown>;
        }).addListener('pushNotificationReceived', (notificacion: unknown) => {
            log.info('Push recibida en foreground:', notificacion);
        });

        await PushNotifications.addListener('pushNotificationActionPerformed', (eventoDesconocido) => {
            const evento = eventoDesconocido as {
                notification?: {
                    data?: Record<string, unknown>;
                };
            };
            const data = evento.notification?.data as Record<string, unknown> | undefined;
            const enlace = typeof data?.enlace === 'string'
                ? data.enlace
                : typeof data?.ruta === 'string'
                    ? data.ruta
                    : null;

            if (!enlace) return;

            try {
                sessionStorage.setItem(CLAVE_NAVEGACION_PENDIENTE, JSON.stringify({
                    enlace,
                    timestamp: Date.now(),
                }));
            } catch (error) {
                log.debug('No se pudo persistir la navegacion pendiente de FCM', error);
            }
        });
    }

    const permiso = await PushNotifications.requestPermissions();
    if (permiso.receive !== 'granted') {
        log.warn('Permiso de notificaciones no concedido en Capacitor');
        return;
    }

    await PushNotifications.register();
    log.info('PushNotifications.register() completado');
}

/**
 * Registrar token FCM en el backend si es Android y hay token disponible.
 * Idempotente: solo se ejecuta una vez por sesion de app.
 */
export async function registrarTokenFcmSiDisponible(): Promise<void> {
    if (!esAndroid()) return;

    /* Solo registrar una vez por sesion de app */
    if (sessionStorage.getItem(CLAVE_REGISTRADO)) return;

    if (esCapacitor()) {
        await inicializarPushCapacitor();
        return;
    }

    const token = await leerTokenFcm();
    if (!token) {
        log.debug('No hay token FCM disponible');
        return;
    }

    await registrarTokenEnBackend(token);
}

export function leerNavegacionFcmCapacitor(): string | null {
    try {
        const raw = sessionStorage.getItem(CLAVE_NAVEGACION_PENDIENTE);
        if (!raw) return null;

        sessionStorage.removeItem(CLAVE_NAVEGACION_PENDIENTE);
        const data = JSON.parse(raw) as { enlace?: string };
        return typeof data.enlace === 'string' && data.enlace.trim() ? data.enlace : null;
    } catch {
        return null;
    }
}
