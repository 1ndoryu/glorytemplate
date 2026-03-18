/*
 * API: apiProcesos — Endpoints para gestion de procesos de fondo.
 * GET /admin/procesos, POST /admin/procesos/{nombre}/start|stop
 */

import { apiGet, apiPost } from './apiCliente';

/* Estado de un proceso individual */
export interface EstadoProceso {
    nombre: string;
    estado: 'running' | 'stopped' | 'error';
    pid: number | null;
    iniciado_at: string | null;
    ultimo_log: string | null;
    log_tail: string;
    progreso: number | null;
    error: string | null;
    resultado?: Record<string, unknown>;
}

/* Tipos de plataforma soportados para cookies */
export type TipoCookies = 'youtube' | 'soundcloud';

/* Respuesta de listar todos — cookies ahora es mapa por plataforma */
interface RespuestaProcesos {
    ok: boolean;
    procesos: EstadoProceso[];
    cookies: Record<TipoCookies, InfoCookies>;
}

/* Info del archivo cookies.txt */
export interface InfoCookies {
    existe: boolean;
    tamano?: number;
    modificado?: string;
}

/* Respuesta de start/stop */
interface RespuestaAccion {
    ok: boolean;
    mensaje?: string;
    error?: string;
    pid?: number;
    resultado?: Record<string, unknown>;
}

/* Respuesta de actualizacion de cookies */
interface RespuestaCookies {
    ok: boolean;
    mensaje?: string;
    error?: string;
    backup?: string;
}

export async function listarProcesos() {
    return apiGet<RespuestaProcesos>('/admin/procesos');
}

export async function estadoProceso(nombre: string) {
    return apiGet<{ ok: boolean; proceso: EstadoProceso }>(`/admin/procesos/${nombre}`);
}

export async function iniciarProceso(nombre: string, limit?: number) {
    return apiPost<RespuestaAccion>(`/admin/procesos/${nombre}/start`, limit ? { limit } : {});
}

export async function detenerProceso(nombre: string) {
    return apiPost<RespuestaAccion>(`/admin/procesos/${nombre}/stop`, {});
}

export async function actualizarCookies(contenido: string, tipo: TipoCookies = 'youtube') {
    return apiPost<RespuestaCookies>('/admin/procesos/cookies', { contenido, tipo });
}

export async function infoCookies() {
    return apiGet<{ ok: boolean; cookies: Record<TipoCookies, InfoCookies> }>('/admin/procesos/cookies');
}

/* [183A-68] Benchmark del algoritmo de recomendacion */
export interface RespuestaBenchmark {
    ok: boolean;
    output: string;
    stderr?: string;
    exitCode?: number;
    error?: string;
}

export async function ejecutarBenchmark(userId = 1, perPage = 30) {
    return apiPost<RespuestaBenchmark>('/admin/procesos/benchmark', { userId, perPage });
}
