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
import { esAndroid, esCapacitor } from '@app/utils/plataforma';
import { leerNavegacionFcmCapacitor } from './fcmToken';

const log = crearLogger('navegacionFcm');
/* Navegaciones mas antiguas a 5 minutos se descartan */
const MAX_ANTIGUEDAD_MS = 5 * 60 * 1000;

/**
 * Verificar si hay una navegacion pendiente de una notificacion FCM.
 * Retorna el enlace a navegar o null si no hay nada pendiente.
 */
export async function leerNavegacionPendiente(): Promise<string | null> {
    if (!esAndroid()) return null;

    if (esCapacitor()) {
        return leerNavegacionFcmCapacitor();
    }

    try {
        const contenido = await window.__KAMPLES_ANDROID_BRIDGE__?.leerNavegacionFcmPendiente?.();
        if (!contenido) return null;

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
