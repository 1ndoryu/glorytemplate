/*
 * Servicio: apiPush — Kamples
 * Gestión de suscripciones Web Push (VAPID).
 * QK86: Notificaciones push self-hosted, sin Firebase.
 */

import { apiGet, apiPost, type RespuestaApi } from './apiCliente';
import { crearLogger } from './logger';

const log = crearLogger('apiPush');

interface VapidKeyResponse {
    vapidKey: string;
    habilitado: boolean;
}

/**
 * Obtener la clave pública VAPID del servidor.
 * El frontend la necesita para registrar el Service Worker push.
 * No requiere autenticación.
 */
export async function obtenerClaveVapid(): Promise<RespuestaApi<VapidKeyResponse>> {
    try {
        return await apiGet<VapidKeyResponse>('/push/vapid-key');
    } catch (err) {
        log.error('Error obteniendo clave VAPID', err);
        return { ok: false, data: null, error: 'Error de red', status: 500 };
    }
}

/**
 * Registrar suscripción push en el servidor.
 * Se llama después de que el Service Worker obtenga la PushSubscription.
 */
export async function registrarSuscripcionPush(
    subscription: PushSubscription,
    plataforma: 'web' | 'android' | 'desktop' = 'web'
): Promise<RespuestaApi<null>> {
    try {
        const keys = subscription.toJSON().keys ?? {};
        return await apiPost<null>('/push/subscribe', {
            endpoint: subscription.endpoint,
            keys: {
                p256dh: keys.p256dh ?? '',
                auth: keys.auth ?? '',
            },
            plataforma,
        });
    } catch (err) {
        log.error('Error registrando suscripción push', err);
        return { ok: false, data: null, error: 'Error de red', status: 500 };
    }
}

/**
 * Eliminar suscripción push del servidor.
 */
export async function eliminarSuscripcionPush(endpoint: string): Promise<RespuestaApi<null>> {
    try {
        return await apiPost<null>('/push/unsubscribe', { endpoint });
    } catch (err) {
        log.error('Error eliminando suscripción push', err);
        return { ok: false, data: null, error: 'Error de red', status: 500 };
    }
}
