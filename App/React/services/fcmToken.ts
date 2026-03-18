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

async function inicializarPushCapacitor(): Promise<void> {
    const { PushNotifications } = await import('@capacitor/push-notifications');

    if (!listenersCapacitorRegistrados) {
        listenersCapacitorRegistrados = true;

        await PushNotifications.addListener('registration', (tokenEvento) => {
            const token = tokenEvento as { value?: string } | null | undefined;
            const valor = typeof token?.value === 'string' ? token.value.trim() : '';
            if (!valor) return;
            void registrarTokenEnBackend(valor);
        });

        await PushNotifications.addListener('registrationError', (error) => {
            log.warn('Error registrando PushNotifications en Capacitor', error);
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
