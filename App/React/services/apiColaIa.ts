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
    completados_hoy: number;
    en_reintento: number;
    errores: number;
    encolados_hoy: number;
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
    tipo?: string,
    busqueda?: string,
    sortCol?: string,
    sortDir?: string
): Promise<RespuestaApi<ItemColaIa[]>> => {
    const params: Record<string, string | number | boolean | undefined> = { pagina, limite };
    if (estado) params.estado = estado;
    if (tipo) params.tipo = tipo;
    if (busqueda) params.busqueda = busqueda;
    if (sortCol) params.sort_col = sortCol;
    if (sortDir) params.sort_dir = sortDir;
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

export interface CuotaGroq {
    limitRequests: number;
    remainingRequests: number;
    limitTokens: number;
    remainingTokens: number;
    resetRequests: string;
    resetTokens: string;
}

export interface EstadoKeysGroq {
    keys: Array<{ nombre: string; configurada: boolean; preview: string | null }>;
    legacy_groq_api: { configurada: boolean; preview: string | null };
    indice_actual: number;
    total_configuradas: number;
    ultimo_audio_ts: string | null;
    contador_diario: number;
}

export const obtenerCuotaGroq = async (): Promise<RespuestaApi<{ ok: boolean; cuota: CuotaGroq }>> => {
    return apiGet<{ ok: boolean; cuota: CuotaGroq }>('/admin/cola-ia/cuota-groq');
};

export const obtenerEstadoKeys = async (): Promise<RespuestaApi<{ ok: boolean } & EstadoKeysGroq>> => {
    return apiGet<{ ok: boolean } & EstadoKeysGroq>('/admin/cola-ia/estado-keys');
};
