/*
 * Servicio: apiCodigosGratis — Kamples (183A-106)
 * Gestiona codigos de descarga gratuita generados por admin.
 * Flujo: admin genera codigo → comparte URL → usuario reclama → descarga sin limite.
 */

import { apiGet, apiPost } from './apiCliente';
import { crearLogger } from './logger';
import type { RespuestaApi } from './apiCliente';

const log = crearLogger('apiCodigosGratis');

export interface InfoCodigo {
    tipo: 'sample' | 'coleccion';
    targetId: number;
}

/* Admin: genera un nuevo codigo de descarga gratis para un sample o coleccion */
export const generarCodigo = async (
    tipo: 'sample' | 'coleccion',
    targetId: number
): Promise<RespuestaApi<{ codigo: string }>> => {
    try {
        return await apiPost<{ codigo: string }>('/codigos-gratis/generar', { tipo, targetId });
    } catch (err) {
        log.error('Error generando codigo gratis', err);
        return { ok: false, data: null, error: 'Error de red', status: 500 };
    }
};

/* Publico: verifica que el codigo existe y a que apunta sin marcarlo como usado */
export const verificarCodigo = async (
    codigo: string
): Promise<RespuestaApi<InfoCodigo>> => {
    try {
        return await apiGet<InfoCodigo>(`/codigos-gratis/verificar?codigo=${encodeURIComponent(codigo)}`);
    } catch (err) {
        log.error('Error verificando codigo gratis', err);
        return { ok: false, data: null, error: 'Error de red', status: 500 };
    }
};

/* Auth: registra que el usuario autenticado reclama este codigo. Idempotente. */
export const reclamarCodigo = async (
    codigo: string
): Promise<RespuestaApi<InfoCodigo>> => {
    try {
        return await apiPost<InfoCodigo>('/codigos-gratis/reclamar', { codigo });
    } catch (err) {
        log.error('Error reclamando codigo gratis', err);
        return { ok: false, data: null, error: 'Error de red', status: 500 };
    }
};
