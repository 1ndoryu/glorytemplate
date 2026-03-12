/*
 * Servicio: apiNotificaciones — Kamples (Fase 7.5)
 * Gestión de notificaciones del usuario.
 * Conectado a API real, sin datos mock.
 */

import { apiGet, apiPost, type RespuestaApi } from './apiCliente';
import { crearLogger } from './logger';

const log = crearLogger('apiNotificaciones');

export type TipoNotificacion =
    | 'like'
    | 'encanta'
    | 'follow'
    | 'comentario'
    | 'descarga'
    | 'mensaje'
    | 'pago'
    | 'sistema'
    | 'moderacion'
    | 'duplicado_detectado'
    | 'venta';

export interface Notificacion {
    id: number;
    tipo: TipoNotificacion;
    titulo: string;
    mensaje: string;
    datos: Record<string, unknown>;
    leida: boolean;
    enlace: string | null;
    creadaAt: string;
    actor?: {
        username: string;
        nombreVisible: string;
        avatarUrl: string | null;
    };
}

/* Obtener notificaciones paginadas */
export const obtenerNotificaciones = async (
    pagina = 1
): Promise<RespuestaApi<Notificacion[]>> => {
    try {
        return await apiGet<Notificacion[]>('/notificaciones', { page: pagina });
    } catch (err) {
        log.error('Error obteniendo notificaciones', err);
        return { ok: false, data: [], error: 'Error de red', status: 500 };
    }
};

/* Marcar una notificación como leída */
export const marcarLeida = async (
    id: number
): Promise<RespuestaApi<void>> => {
    try {
        return await apiPost<void>(`/notificaciones/${id}/leer`);
    } catch (err) {
        log.error('Error marcando notificación leída', err);
        return { ok: false, data: undefined, error: 'Error de red', status: 500 };
    }
};

/* Marcar todas como leídas */
export const marcarTodasLeidas = async (): Promise<RespuestaApi<void>> => {
    try {
        return await apiPost<void>('/notificaciones/leer-todas');
    } catch (err) {
        log.error('Error marcando todas leídas', err);
        return { ok: false, data: undefined, error: 'Error de red', status: 500 };
    }
};

/* Obtener conteo de no leídas */
export const obtenerConteoNoLeidas = async (): Promise<number> => {
    try {
        const resp = await apiGet<{ total: number }>('/notificaciones/conteo');
        return resp.ok && resp.data ? resp.data.total : 0;
    } catch {
        return 0;
    }
};
