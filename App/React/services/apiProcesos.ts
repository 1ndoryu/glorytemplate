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

/* Respuesta de listar todos */
interface RespuestaProcesos {
    ok: boolean;
    procesos: EstadoProceso[];
    cookies: InfoCookies;
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

export async function actualizarCookies(contenido: string) {
    return apiPost<RespuestaCookies>('/admin/procesos/cookies', { contenido });
}

export async function infoCookies() {
    return apiGet<{ ok: boolean; cookies: InfoCookies }>('/admin/procesos/cookies');
}
