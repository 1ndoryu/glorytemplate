/*
 * Servicio: apiDescargas — Kamples (Fase 2.10)
 * Gestiona descargas de samples con control de límites por plan.
 * Conectado a API real, sin datos mock.
 */

import { apiGet, apiPost } from './apiCliente';
import { crearLogger } from './logger';
import type { RespuestaApi } from './apiCliente';

const log = crearLogger('apiDescargas');

/*
 * C146: Campos alineados con backend DescargasController::limites()
 * Backend envía: plan, limite, usadas, calidad, ilimitado, transferenciaGb, etc.
 */
export interface LimitesDescarga {
    plan: 'free' | 'pro' | 'premium';
    usadas: number;
    limite: number;
    /** Límite base del plan sin créditos bonus */
    limiteBase?: number;
    /** Créditos extra ganados por publicar samples */
    creditosBonus?: number;
    ilimitado: boolean;
    calidad: 'mp3' | 'wav';
    transferenciaGb: number;
    transferenciaUsadaGb: number;
    transferenciaIlimitada: boolean;
}

export interface ResultadoDescarga {
    url: string;
    nombre: string;
    formato: string;
    tamano: number;
    /** true si el sample ya estaba coleccionado (propietario o descarga previa) — no consume crédito */
    yaExistia?: boolean;
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
/* Frontend llama POST /samples/{id}/descargar que coincide con la ruta backend */
export const descargarSample = async (
    sampleId: number
): Promise<RespuestaApi<ResultadoDescarga>> => {
    try {
        return await apiPost<ResultadoDescarga>(`/samples/${sampleId}/descargar`);
    } catch (err) {
        log.error('Error descargando sample', err);
        return { ok: false, data: null, error: 'Error de red', status: 500 };
    }
};

/* Verificar si puede descargar (sin gastar crédito) */
export const puedeDescargar = async (): Promise<boolean> => {
    const resp = await obtenerLimites();
    if (!resp.ok || !resp.data) return false;
    return resp.data.ilimitado || resp.data.usadas < resp.data.limite;
};
