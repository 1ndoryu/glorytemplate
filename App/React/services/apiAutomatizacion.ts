/*
 * API: apiAutomatizacion — [223A-3] Endpoints para automatización de procesos.
 * Estado, historial de lotes, reactivación.
 */

import { apiGet, apiPost } from './apiCliente';

/* Estado de automatización por tipo */
export interface EstadoAutoTipo {
    activo: boolean;
    limite_por_lote: number;
    intervalo_segundos: number;
    fallos_consecutivos?: number;
    ultimo_lote: LoteResumen | null;
}

export interface EstadoAutomatizacion {
    extraccion: EstadoAutoTipo;
    scraping: EstadoAutoTipo;
}

/* Lote individual en el historial */
export interface LoteResumen {
    id: number;
    tipo: 'extraccion' | 'scraping';
    estado: 'ejecutando' | 'completado' | 'error' | 'detenido';
    iniciado_at: string;
    completado_at: string | null;
    exitosos: number;
    fallidos: number;
    recortes: number;
    samples_publicados: number;
    canciones_nuevas: number;
    sampleos_nuevos: number;
    error_mensaje: string | null;
    metadata: Record<string, unknown> | null;
}

export type TipoProceso = 'extraccion' | 'scraping';

export async function obtenerEstadoAutomatizacion() {
    return apiGet<{ ok: boolean; estado: EstadoAutomatizacion }>('/admin/automatizacion/estado');
}

export async function obtenerHistorialLotes(tipo?: TipoProceso, pagina = 1) {
    const params: Record<string, string | number> = { pagina };
    if (tipo) params.tipo = tipo;
    return apiGet<{ ok: boolean; items: LoteResumen[]; total: number; pagina: number }>(
        '/admin/automatizacion/historial',
        params
    );
}

export async function reactivarProceso(tipo: TipoProceso) {
    return apiPost<{ ok: boolean; mensaje?: string; error?: string }>(
        '/admin/automatizacion/reactivar',
        { tipo }
    );
}
