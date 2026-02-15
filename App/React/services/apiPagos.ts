/*
 * Servicio: apiPagos — Kamples (Fase 6.5)
 * Gestión de pagos, suscripciones y dashboard de creador.
 * Mock data para desarrollo. Stripe Connect pendiente (6.1, 6.3).
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

/* Mock de estadísticas */
const mockEstadisticas: EstadisticasCreador = {
    ingresosTotal: 1247.50,
    ingresosMes: 342.80,
    ingresosAnterior: 289.20,
    descargasTotal: 8432,
    descargasMes: 1205,
    reproduccionesTotal: 45200,
    reproduccionesMes: 6830,
    seguidoresTotal: 523,
    seguidoresNuevosMes: 47,
    samplesPublicados: 84,
};

/* Mock de samples más descargados */
const mockTopSamples: SampleStats[] = [
    { id: 1, titulo: 'Synth Dream 140', slug: 'synth-dream-140', descargas: 1420, reproducciones: 5800, likes: 234, ingresos: 142.00 },
    { id: 2, titulo: 'Dark 808 Heavy', slug: 'dark-808-heavy', descargas: 980, reproducciones: 4200, likes: 189, ingresos: 98.00 },
    { id: 3, titulo: 'Lo-Fi Piano Chill', slug: 'lofi-piano-chill', descargas: 876, reproducciones: 3900, likes: 165, ingresos: 87.60 },
    { id: 4, titulo: 'Trap Hi-Hat Roll', slug: 'trap-hihat-roll', descargas: 723, reproducciones: 3100, likes: 142, ingresos: 72.30 },
    { id: 5, titulo: 'Ambient Pad Wide', slug: 'ambient-pad-wide', descargas: 654, reproducciones: 2800, likes: 98, ingresos: 65.40 },
];

/* Mock de transacciones recientes */
const mockTransacciones: TransaccionCreador[] = [
    { id: 1, fecha: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), tipo: 'descarga', sample: 'Synth Dream 140', comprador: 'beatmaker99', monto: 1.00, comision: 0.30, neto: 0.70 },
    { id: 2, fecha: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), tipo: 'venta', sample: 'Dark 808 Heavy', comprador: 'lofi_girl', monto: 4.99, comision: 1.50, neto: 3.49 },
    { id: 3, fecha: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), tipo: 'descarga', sample: 'Lo-Fi Piano Chill', comprador: 'drillmaster', monto: 1.00, comision: 0.30, neto: 0.70 },
    { id: 4, fecha: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), tipo: 'suscripcion', sample: 'Trap Hi-Hat Roll', comprador: 'synthwave_kid', monto: 0.50, comision: 0.15, neto: 0.35 },
    { id: 5, fecha: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(), tipo: 'descarga', sample: 'Ambient Pad Wide', comprador: 'producer_x', monto: 1.00, comision: 0.30, neto: 0.70 },
];

/* Mock de ingresos por día (últimos 30 días) */
const generarMockIngresosDiarios = (): IngresosPorPeriodo[] => {
    const datos: IngresosPorPeriodo[] = [];
    for (let i = 29; i >= 0; i--) {
        const fecha = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
        datos.push({
            fecha: fecha.toISOString().split('T')[0],
            monto: Math.round(Math.random() * 25 * 100) / 100,
        });
    }
    return datos;
};

/* Obtener estadísticas del creador */
export const obtenerEstadisticasCreador = async (): Promise<RespuestaApi<EstadisticasCreador>> => {
    try {
        const resp = await apiGet<EstadisticasCreador>('/dashboard/stats');
        if (resp.ok && resp.data) return resp;
        throw new Error('Sin datos');
    } catch {
        log.debug('Usando estadísticas mock');
        return { ok: true, data: mockEstadisticas, error: null, status: 200 };
    }
};

/* Obtener top samples del creador */
export const obtenerTopSamples = async (): Promise<RespuestaApi<SampleStats[]>> => {
    try {
        const resp = await apiGet<SampleStats[]>('/dashboard/top-samples');
        if (resp.ok && resp.data && resp.data.length > 0) return resp;
        throw new Error('Sin datos');
    } catch {
        log.debug('Usando top samples mock');
        return { ok: true, data: mockTopSamples, error: null, status: 200 };
    }
};

/* Obtener transacciones del creador */
export const obtenerTransacciones = async (
    pagina = 1
): Promise<RespuestaApi<TransaccionCreador[]>> => {
    try {
        const resp = await apiGet<TransaccionCreador[]>('/dashboard/transacciones', { page: pagina });
        if (resp.ok && resp.data && resp.data.length > 0) return resp;
        throw new Error('Sin datos');
    } catch {
        log.debug('Usando transacciones mock');
        return { ok: true, data: mockTransacciones, error: null, status: 200 };
    }
};

/* Obtener ingresos por período (para gráfica) */
export const obtenerIngresosPorPeriodo = async (
    periodo: 'semana' | 'mes' | 'anio' = 'mes'
): Promise<RespuestaApi<IngresosPorPeriodo[]>> => {
    try {
        const resp = await apiGet<IngresosPorPeriodo[]>('/dashboard/ingresos', { periodo });
        if (resp.ok && resp.data && resp.data.length > 0) return resp;
        throw new Error('Sin datos');
    } catch {
        log.debug('Usando ingresos mock');
        return { ok: true, data: generarMockIngresosDiarios(), error: null, status: 200 };
    }
};

/* Solicitar payout (Stripe Connect) */
export const solicitarPayout = async (): Promise<RespuestaApi<{ monto: number; estado: string }>> => {
    try {
        return await apiPost<{ monto: number; estado: string }>('/dashboard/payout');
    } catch {
        log.debug('Payout mock solicitado');
        return {
            ok: true,
            data: { monto: mockEstadisticas.ingresosMes, estado: 'procesando' },
            error: null,
            status: 200,
        };
    }
};
