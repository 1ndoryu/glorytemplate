/*
 * Servicio: apiDescargas — Kamples (Fase 2.10)
 * Gestiona descargas de samples con control de límites por plan.
 * Conectado a API real, sin datos mock.
 */

import { apiGet, apiPost } from './apiCliente';
import { crearLogger } from './logger';
import type { RespuestaApi } from './apiCliente';

const log = crearLogger('apiDescargas');

export interface LimitesDescarga {
    plan: 'free' | 'pro' | 'premium';
    descargasHoy: number;
    limitesDiarios: number;
    ilimitado: boolean;
    calidadDisponible: 'mp3' | 'wav';
    resetEn: string;
}

export interface ResultadoDescarga {
    url: string;
    nombre: string;
    formato: string;
    tamano: number;
}

/* Obtener límites actuales del usuario */
export const obtenerLimites = async (): Promise<RespuestaApi<LimitesDescarga>> => {
    try {
        return await apiGet<LimitesDescarga>('/descargas/limites');
    } catch (err) {
        log.error('Error obteniendo límites de descarga', err);
        return { ok: false, data: null, error: 'Error de red', status: 500 };
    }
};

/* Descargar un sample (incrementa contador) */
export const descargarSample = async (
    sampleId: number
): Promise<RespuestaApi<ResultadoDescarga>> => {
    try {
        return await apiPost<ResultadoDescarga>(`/descargas/${sampleId}`);
    } catch (err) {
        log.error('Error descargando sample', err);
        return { ok: false, data: null, error: 'Error de red', status: 500 };
    }
};

/* Verificar si puede descargar (sin gastar crédito) */
export const puedeDescargar = async (): Promise<boolean> => {
    const resp = await obtenerLimites();
    if (!resp.ok || !resp.data) return false;
    return resp.data.ilimitado || resp.data.descargasHoy < resp.data.limitesDiarios;
};
