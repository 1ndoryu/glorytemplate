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

const log = crearLogger('fcmToken');

const esTauri = (): boolean =>
    typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

const esAndroid = (): boolean =>
    esTauri() && /android/i.test(navigator.userAgent);

/**
 * Leer token FCM del archivo escrito por el servicio nativo.
 * Retorna null si no es Android, el plugin no está disponible o el archivo no existe.
 */
async function leerTokenFcm(): Promise<string | null> {
    if (!esAndroid()) return null;

    try {
        const { readTextFile, exists, BaseDirectory } = await import('@tauri-apps/plugin-fs');
        const archivo = 'fcm_token.txt';

        /* Verificar si el archivo existe en appData */
        const existeAppData = await exists(archivo, { baseDir: BaseDirectory.AppData });
        if (existeAppData) {
            const token = await readTextFile(archivo, { baseDir: BaseDirectory.AppData });
            return token.trim() || null;
        }

        /* Fallback: intentar en AppLocalData */
        const existeLocal = await exists(archivo, { baseDir: BaseDirectory.AppLocalData });
        if (existeLocal) {
            const token = await readTextFile(archivo, { baseDir: BaseDirectory.AppLocalData });
            return token.trim() || null;
        }

        log.debug('Archivo fcm_token.txt no encontrado');
        return null;
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
