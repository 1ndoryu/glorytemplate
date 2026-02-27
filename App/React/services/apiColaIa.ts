/*
 * Service: apiColaIa — C356
 * Endpoints para gestionar la cola de procesamiento IA (admin).
 * Todas las peticiones requieren rol admin.
 */

import { apiGet, apiPost } from './apiCliente';
import type { RespuestaApi } from './apiCliente';

/* Tipos */

export interface ItemColaIa {
    id: number;
    tipo: 'sample' | 'comentario' | 'publicacion';
    entidad_id: number;
    operacion: string;
    estado: 'pendiente' | 'procesando' | 'completado' | 'error_reintento' | 'error_final';
    intentos: number;
    max_intentos: number;
    ultimo_error: string | null;
    proximo_intento: string | null;
    metadata: Record<string, unknown> | null;
    procesado_at: string | null;
    created_at: string;
}

export interface EstadisticasColaIa {
    total: number;
    pendientes: number;
    procesando: number;
    completados: number;
    error_reintento: number;
    error_final: number;
}

export interface ResultadoProcesamiento {
    procesados: number;
    exitosos: number;
    errores: number;
    rateLimited: boolean;
}

/* Endpoints */

export const listarColaIa = async (
    pagina = 1,
    limite = 20,
    estado?: string,
    tipo?: string
): Promise<RespuestaApi<ItemColaIa[]>> => {
    const params: Record<string, string | number | boolean | undefined> = { pagina, limite };
    if (estado) params.estado = estado;
    if (tipo) params.tipo = tipo;
    return apiGet<ItemColaIa[]>('/admin/cola-ia', params);
};

export const obtenerEstadisticasColaIa = async (): Promise<RespuestaApi<EstadisticasColaIa>> => {
    return apiGet<EstadisticasColaIa>('/admin/cola-ia/estadisticas');
};

export const reintentarItemColaIa = async (id: number): Promise<RespuestaApi<{ ok: boolean; message: string }>> => {
    return apiPost<{ ok: boolean; message: string }>('/admin/cola-ia/reintentar', { id });
};

export const reintentarTodosColaIa = async (): Promise<RespuestaApi<{ ok: boolean; total: number; message: string }>> => {
    return apiPost<{ ok: boolean; total: number; message: string }>('/admin/cola-ia/reintentar-todos', {});
};

export const procesarColaIaAhora = async (): Promise<RespuestaApi<{ ok: boolean; resultado: ResultadoProcesamiento }>> => {
    return apiPost<{ ok: boolean; resultado: ResultadoProcesamiento }>('/admin/cola-ia/procesar', {});
};
