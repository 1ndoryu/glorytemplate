/*
 * Servicio: apiPagos — Kamples (Fase 6.5)
 * Gestión de pagos, suscripciones y dashboard de creador.
 * Conectado a API real. Stripe Connect pendiente (6.1, 6.3).
 */

import { apiGet, apiPost, type RespuestaApi } from './apiCliente';
import { crearLogger } from './logger';

const log = crearLogger('apiPagos');

/* Tipos del dashboard de creador */
export interface EstadisticasCreador {
    ingresosTotal: number;
    ingresosMes: number;
    ingresosAnterior: number;
    descargasTotal: number;
    descargasMes: number;
    reproduccionesTotal: number;
    reproduccionesMes: number;
    seguidoresTotal: number;
    seguidoresNuevosMes: number;
    samplesPublicados: number;
}

export interface SampleStats {
    id: number;
    titulo: string;
    slug: string;
    descargas: number;
    reproducciones: number;
    likes: number;
    ingresos: number;
}

export interface TransaccionCreador {
    id: number;
    fecha: string;
    tipo: 'descarga' | 'venta' | 'suscripcion';
    sample: string;
    comprador: string;
    monto: number;
    comision: number;
    neto: number;
}

export interface IngresosPorPeriodo {
    fecha: string;
    monto: number;
}

/* Valores vacíos para estado inicial sin datos */
const estadisticasVacias: EstadisticasCreador = {
    ingresosTotal: 0,
    ingresosMes: 0,
    ingresosAnterior: 0,
    descargasTotal: 0,
    descargasMes: 0,
    reproduccionesTotal: 0,
    reproduccionesMes: 0,
    seguidoresTotal: 0,
    seguidoresNuevosMes: 0,
    samplesPublicados: 0,
};

/* Obtener estadísticas del creador */
export const obtenerEstadisticasCreador = async (): Promise<RespuestaApi<EstadisticasCreador>> => {
    try {
        return await apiGet<EstadisticasCreador>('/dashboard/stats');
    } catch (err) {
        log.error('Error obteniendo estadísticas', err);
        return { ok: true, data: estadisticasVacias, error: null, status: 200 };
    }
};

/* Obtener top samples del creador */
export const obtenerTopSamples = async (): Promise<RespuestaApi<SampleStats[]>> => {
    try {
        return await apiGet<SampleStats[]>('/dashboard/top-samples');
    } catch (err) {
        log.error('Error obteniendo top samples', err);
        return { ok: true, data: [], error: null, status: 200 };
    }
};

/* Obtener transacciones del creador */
export const obtenerTransacciones = async (
    pagina = 1
): Promise<RespuestaApi<TransaccionCreador[]>> => {
    try {
        return await apiGet<TransaccionCreador[]>('/dashboard/transacciones', { page: pagina });
    } catch (err) {
        log.error('Error obteniendo transacciones', err);
        return { ok: true, data: [], error: null, status: 200 };
    }
};

/* Obtener ingresos por período (para gráfica) */
export const obtenerIngresosPorPeriodo = async (
    periodo: 'semana' | 'mes' | 'anio' = 'mes'
): Promise<RespuestaApi<IngresosPorPeriodo[]>> => {
    try {
        return await apiGet<IngresosPorPeriodo[]>('/dashboard/ingresos', { periodo });
    } catch (err) {
        log.error('Error obteniendo ingresos', err);
        return { ok: true, data: [], error: null, status: 200 };
    }
};

/* Solicitar payout (Stripe Connect) */
export const solicitarPayout = async (): Promise<RespuestaApi<{ monto: number; estado: string }>> => {
    try {
        return await apiPost<{ monto: number; estado: string }>('/dashboard/payout');
    } catch (err) {
        log.error('Error solicitando payout', err);
        return { ok: false, data: null, error: 'Error de red', status: 500 };
    }
};

/* ===================== CHECKOUT STRIPE ===================== */

export type PeriodoPlan = 'mensual' | 'anual';

/*
 * Crea una sesión de Stripe Checkout y retorna la URL de redirección.
 * El backend crea la session y envía la URL al frontend para redirect.
 */
export const crearSesionCheckout = async (
    plan: 'pro' | 'premium',
    periodo: PeriodoPlan = 'mensual'
): Promise<{ ok: boolean; url?: string; error?: string }> => {
    try {
        const resp = await apiPost<{ ok: boolean; url: string }>('/pagos/checkout', { plan, periodo });
        if (resp.ok && resp.data?.url) {
            return { ok: true, url: resp.data.url };
        }
        return { ok: false, error: resp.error ?? 'Error al crear sesión de checkout' };
    } catch (err) {
        log.error('Error creando sesión checkout', err);
        return { ok: false, error: 'Error de conexión' };
    }
};

/*
 * Abre el Customer Portal de Stripe para gestionar suscripción.
 * Redirige al usuario al portal de Stripe.
 */
export const abrirPortalFacturacion = async (): Promise<{ ok: boolean; url?: string; error?: string }> => {
    try {
        const resp = await apiPost<{ ok: boolean; url: string }>('/pagos/portal');
        if (resp.ok && resp.data?.url) {
            return { ok: true, url: resp.data.url };
        }
        return { ok: false, error: resp.error ?? 'Error al abrir portal de facturación' };
    } catch (err) {
        log.error('Error abriendo portal de facturación', err);
        return { ok: false, error: 'Error de conexión' };
    }
};
