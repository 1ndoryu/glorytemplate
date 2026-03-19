/*
 * Servicio: apiCodigosGratis â€” Kamples (183A-106)
 * Gestiona codigos de descarga gratuita generados por admin.
 * Flujo: admin genera codigo â†’ comparte URL â†’ usuario reclama â†’ descarga sin limite.
 * [183A-110] Agrega: invalidarCodigo(), tipos extendidos para expirado+compensacion.
 */

import { apiGet, apiPost } from './apiCliente';
import { crearLogger } from './logger';
import type { RespuestaApi } from './apiCliente';

const log = crearLogger('apiCodigosGratis');

export interface InfoCodigo {
    tipo: 'sample' | 'coleccion';
    targetId: number;
}

/* [183A-110] Respuesta extendida de reclamar â€” puede retornar expired si el cÃ³digo venciÃ³ */
export interface RespuestaReclamar {
    tipo?: 'sample' | 'coleccion';
    targetId?: number;
    /* true si el codigo estaba expirado */
    expired?: boolean;
    /* true si se dieron 50 crÃ©ditos de compensaciÃ³n en este reclamo */
    compensado?: boolean;
    /* nombre del item para mostrar en el modal de compensaciÃ³n */
    nombreItem?: string;
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

/* Publico: verifica que el codigo existe y a que apunta sin marcarlo como usado.
 * [183A-110] Si el codigo estÃ¡ expirado retorna { ok: false, expired: true, nombreItem }. */
export const verificarCodigo = async (
    codigo: string
): Promise<RespuestaApi<InfoCodigo & { expired?: boolean; nombreItem?: string }>> => {
    try {
        return await apiGet<InfoCodigo & { expired?: boolean; nombreItem?: string }>(
            `/codigos-gratis/verificar?codigo=${encodeURIComponent(codigo)}`
        );
    } catch (err) {
        log.error('Error verificando codigo gratis', err);
        return { ok: false, data: null, error: 'Error de red', status: 500 };
    }
};

/* Auth: registra que el usuario autenticado reclama este codigo. Idempotente.
 * [183A-110] Si el codigo estÃ¡ expirado retorna { ok: false, expired: true, compensado, nombreItem }. */
export const reclamarCodigo = async (
    codigo: string
): Promise<RespuestaApi<RespuestaReclamar>> => {
    try {
        return await apiPost<RespuestaReclamar>('/codigos-gratis/reclamar', { codigo });
    } catch (err) {
        log.error('Error reclamando codigo gratis', err);
        return { ok: false, data: null, error: 'Error de red', status: 500 };
    }
};

/* [183A-110] Admin: invalida todos los codigos activos de un item.
 * Usuarios que ya reclamaron no podrÃ¡n volver a usar el beneficio (backend lo verifica). */
export const invalidarCodigo = async (
    tipo: 'sample' | 'coleccion',
    targetId: number
): Promise<RespuestaApi<{ invalidados: number }>> => {
    try {
        return await apiPost<{ invalidados: number }>('/codigos-gratis/invalidar', { tipo, targetId });
    } catch (err) {
        log.error('Error invalidando codigo gratis', err);
        return { ok: false, data: null, error: 'Error de red', status: 500 };
    }
};

