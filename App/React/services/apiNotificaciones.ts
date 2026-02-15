/*
 * Servicio: apiNotificaciones — Kamples (Fase 7.5)
 * Gestión de notificaciones del usuario.
 * Mock data para desarrollo.
 */

import { apiGet, apiPost, type RespuestaApi } from './apiCliente';
import { crearLogger } from './logger';

const log = crearLogger('apiNotificaciones');

export type TipoNotificacion =
    | 'like'
    | 'follow'
    | 'comentario'
    | 'descarga'
    | 'mensaje'
    | 'pago'
    | 'sistema';

export interface Notificacion {
    id: number;
    tipo: TipoNotificacion;
    mensaje: string;
    datos: Record<string, unknown>;
    leida: boolean;
    creadaAt: string;
    /* Info del actor (quién generó la notificación) */
    actor?: {
        username: string;
        nombreVisible: string;
        avatarUrl: string | null;
    };
}

/* Mock de notificaciones */
const mockNotificaciones: Notificacion[] = [
    {
        id: 1,
        tipo: 'follow',
        mensaje: 'beatmaker99 empezó a seguirte',
        datos: { userId: 2 },
        leida: false,
        creadaAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
        actor: { username: 'beatmaker99', nombreVisible: 'BeatMaker 99', avatarUrl: null },
    },
    {
        id: 2,
        tipo: 'like',
        mensaje: 'lofi_girl le dio like a "Synth Dream 140"',
        datos: { sampleId: 1, sampleSlug: 'synth-dream-140' },
        leida: false,
        creadaAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        actor: { username: 'lofi_girl', nombreVisible: 'Lo-Fi Girl', avatarUrl: null },
    },
    {
        id: 3,
        tipo: 'comentario',
        mensaje: 'drillmaster comentó en "808 Thunder Drill"',
        datos: { sampleId: 3, sampleSlug: '808-thunder-drill' },
        leida: true,
        creadaAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        actor: { username: 'drillmaster', nombreVisible: 'DrillMaster', avatarUrl: null },
    },
    {
        id: 4,
        tipo: 'descarga',
        mensaje: 'Tu sample "Trap Hi-Hat Roll" fue descargado 10 veces hoy',
        datos: { sampleId: 5, descargas: 10 },
        leida: true,
        creadaAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    },
    {
        id: 5,
        tipo: 'sistema',
        mensaje: 'Bienvenido a Kamples. Explora y descubre samples increíbles.',
        datos: {},
        leida: true,
        creadaAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    },
];

/* Obtener notificaciones paginadas */
export const obtenerNotificaciones = async (
    pagina = 1
): Promise<RespuestaApi<Notificacion[]>> => {
    try {
        return await apiGet<Notificacion[]>(`/kamples/v1/notificaciones?page=${pagina}`);
    } catch {
        log.debug('Usando notificaciones mock');
        return { ok: true, data: mockNotificaciones, error: null, status: 200 };
    }
};

/* Marcar una notificación como leída */
export const marcarLeida = async (
    id: number
): Promise<RespuestaApi<void>> => {
    try {
        return await apiPost<void>(`/kamples/v1/notificaciones/${id}/leer`);
    } catch {
        const notif = mockNotificaciones.find((n) => n.id === id);
        if (notif) notif.leida = true;
        return { ok: true, data: undefined, error: null, status: 200 };
    }
};

/* Marcar todas como leídas */
export const marcarTodasLeidas = async (): Promise<RespuestaApi<void>> => {
    try {
        return await apiPost<void>('/kamples/v1/notificaciones/leer-todas');
    } catch {
        mockNotificaciones.forEach((n) => { n.leida = true; });
        return { ok: true, data: undefined, error: null, status: 200 };
    }
};

/* Obtener conteo de no leídas */
export const obtenerConteoNoLeidas = async (): Promise<number> => {
    try {
        const resp = await apiGet<{ count: number }>('/kamples/v1/notificaciones/count');
        return resp.ok && resp.data ? resp.data.count : 0;
    } catch {
        return mockNotificaciones.filter((n) => !n.leida).length;
    }
};
