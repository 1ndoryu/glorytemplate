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
import { esAndroid } from '@app/utils/plataforma';

const log = crearLogger('fcmToken');

/**
 * Leer token FCM del archivo escrito por el servicio nativo.
 * Retorna null si no es Android, el plugin no está disponible o el archivo no existe.
 */
async function leerTokenFcm(): Promise<string | null> {
    if (!esAndroid()) return null;

    try {
        const token = await window.__KAMPLES_ANDROID_BRIDGE__?.leerTokenFcm?.();
        return token && token.trim() ? token.trim() : null;
    } catch (err) {
        log.debug('Error leyendo token FCM:', err);
        return null;
    }
}

/* Clave en sessionStorage para evitar registrar multiples veces por sesion */
const CLAVE_REGISTRADO = 'fcm_token_registrado';

/**
 * Registrar token FCM en el backend si es Android y hay token disponible.
 * Idempotente: solo se ejecuta una vez por sesion de app.
 */
export async function registrarTokenFcmSiDisponible(): Promise<void> {
    if (!esAndroid()) return;

    /* Solo registrar una vez por sesion de app */
    if (sessionStorage.getItem(CLAVE_REGISTRADO)) return;

    const token = await leerTokenFcm();
    if (!token) {
        log.debug('No hay token FCM disponible');
        return;
    }

    try {
        const resp = await apiPost('/fcm/registrar', {
            token,
            plataforma: 'android',
        });

        if (resp.ok) {
            sessionStorage.setItem(CLAVE_REGISTRADO, '1');
            log.info('Token FCM registrado en backend');
        } else {
            log.warn('Error registrando token FCM:', resp.error);
        }
    } catch (err) {
        log.warn('Excepcion registrando token FCM:', err);
    }
}
