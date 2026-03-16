/*
 * Servicio: navegacionFcm — Kamples
 * QL45: Bridge entre notificaciones FCM nativas (Android) y la navegacion SPA.
 *
 * Flujo:
 * 1. KamplesFirebaseService.kt escribe pending_navigation.json en filesDir.
 * 2. Este servicio verifica el archivo cuando la app vuelve a primer plano.
 * 3. Lee el enlace, lo elimina, y navega via navigationStore.
 *
 * Solo se activa en Android (Tauri). En web, las notificaciones redirigen via URL directa.
 */

import { crearLogger } from './logger';

const log = crearLogger('navegacionFcm');

const ARCHIVO_NAVEGACION = 'pending_navigation.json';
/* Navegaciones mas antiguas a 5 minutos se descartan */
const MAX_ANTIGUEDAD_MS = 5 * 60 * 1000;

const esTauri = (): boolean =>
    typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

const esAndroid = (): boolean =>
    esTauri() && /android/i.test(navigator.userAgent);

/**
 * Verificar si hay una navegacion pendiente de una notificacion FCM.
 * Retorna el enlace a navegar o null si no hay nada pendiente.
 */
export async function leerNavegacionPendiente(): Promise<string | null> {
    if (!esAndroid()) return null;

    try {
        const { readTextFile, remove, exists, BaseDirectory } = await import('@tauri-apps/plugin-fs');

        const existeArchivo = await exists(ARCHIVO_NAVEGACION, { baseDir: BaseDirectory.AppData });
        if (!existeArchivo) return null;

        const contenido = await readTextFile(ARCHIVO_NAVEGACION, { baseDir: BaseDirectory.AppData });

        /* Eliminar inmediatamente para evitar re-procesamiento */
        try {
            await remove(ARCHIVO_NAVEGACION, { baseDir: BaseDirectory.AppData });
        } catch {
            /* No critico si falla la eliminacion */
        }

        const datos = JSON.parse(contenido) as { enlace?: string; timestamp?: number };
        if (!datos.enlace) return null;

        /* Descartar navegaciones antiguas (> 5 min) */
        if (datos.timestamp && Date.now() - datos.timestamp > MAX_ANTIGUEDAD_MS) {
            log.debug('Navegacion pendiente descartada por antiguedad');
            return null;
        }

        return datos.enlace;
    } catch {
        return null;
    }
}

/**
 * Procesar navegacion pendiente de FCM y navegar con el navigationStore.
 * Se llama desde useNotificacionesNativas cuando la app vuelve a primer plano.
 */
export async function procesarNavegacionFcm(): Promise<void> {
    const enlace = await leerNavegacionPendiente();
    if (!enlace) return;

    try {
        /* Importar navigationStore para navegar fuera de un componente React */
        const { useNavigationStore } = await import('@/core/router/navigationStore');
        const { navegar, modoSPA } = useNavigationStore.getState();

        if (modoSPA) {
            navegar(enlace);
            log.info('Navegacion FCM procesada:', enlace);
        } else {
            /* Fallback si SPA no esta inicializado: redirigir via location */
            window.location.href = enlace;
        }
    } catch (err) {
        log.error('Error procesando navegacion FCM:', err);
    }
}
