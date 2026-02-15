/*
 * Servicio: apiDescargas — Kamples (Fase 2.10)
 * Gestiona descargas de samples con control de límites por plan.
 * Incluye mock local para desarrollo.
 */

import { apiGet, apiPost } from './apiCliente';
import { crearLogger } from './logger';
import type { RespuestaApi } from './apiCliente';

const log = crearLogger('apiDescargas');

export interface LimitesDescarga {
    plan: 'free' | 'pro' | 'premium';
    descargasHoy: number;
    limitesDiarios: number;
    /* ilimitado para premium */
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

/* Mock de límites para desarrollo — simula plan Free */
const MOCK_LIMITES: LimitesDescarga = {
    plan: 'free',
    descargasHoy: 2,
    limitesDiarios: 5,
    ilimitado: false,
    calidadDisponible: 'mp3',
    resetEn: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
};

let mockDescargasHoy = 2;

/* Obtener límites actuales del usuario */
export const obtenerLimites = async (): Promise<RespuestaApi<LimitesDescarga>> => {
    try {
        return await apiGet<LimitesDescarga>('/kamples/v1/descargas/limites');
    } catch {
        log.debug('Usando límites mock');
        return {
            ok: true,
            data: { ...MOCK_LIMITES, descargasHoy: mockDescargasHoy },
            error: null,
            status: 200,
        };
    }
};

/* Descargar un sample (incrementa contador) */
export const descargarSample = async (
    sampleId: number
): Promise<RespuestaApi<ResultadoDescarga>> => {
    try {
        return await apiPost<ResultadoDescarga>(`/kamples/v1/descargas/${sampleId}`);
    } catch {
        /* Mock: simular descarga y conteo */
        mockDescargasHoy += 1;
        log.debug('Descarga mock', { sampleId, descargasHoy: mockDescargasHoy });

        return {
            ok: mockDescargasHoy <= MOCK_LIMITES.limitesDiarios,
            data: {
                url: `/storage/optimized/sample_${sampleId}.mp3`,
                nombre: `sample_${sampleId}.mp3`,
                formato: 'mp3',
                tamano: 2048000,
            },
            error: mockDescargasHoy > MOCK_LIMITES.limitesDiarios ? 'Límite diario alcanzado' : null,
            status: mockDescargasHoy <= MOCK_LIMITES.limitesDiarios ? 200 : 429,
        };
    }
};

/* Verificar si puede descargar (sin gastar crédito) */
export const puedeDescargar = async (): Promise<boolean> => {
    const resp = await obtenerLimites();
    if (!resp.ok || !resp.data) return false;
    return resp.data.ilimitado || resp.data.descargasHoy < resp.data.limitesDiarios;
};
