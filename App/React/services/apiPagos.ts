/*
 * Servicio: apiPagos — Kamples (Fase 7.3)
 * Gestión de pagos, suscripciones, Stripe Connect y dashboard de creador.
 * Conectado a API real.
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
        return { ok: false, data: estadisticasVacias, error: 'Error de red', status: 500 };
    }
};

/* Obtener top samples del creador */
export const obtenerTopSamples = async (): Promise<RespuestaApi<SampleStats[]>> => {
    try {
        return await apiGet<SampleStats[]>('/dashboard/top-samples');
    } catch (err) {
        log.error('Error obteniendo top samples', err);
        return { ok: false, data: [], error: 'Error de red', status: 500 };
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
        return { ok: false, data: [], error: 'Error de red', status: 500 };
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
        return { ok: false, data: [], error: 'Error de red', status: 500 };
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

/* STRIPE CONNECT */

export type EstadoConnect = 'no_configurado' | 'pendiente' | 'activo' | 'restringido' | 'error';

export interface DatosConnect {
    estado: EstadoConnect;
    connectId: string | null;
    cargosActivos: boolean;
    payoutsActivos: boolean;
    detalle: string | null;
    requerimientosPendientes?: number;
}

export interface BalanceConnect {
    disponible: number;
    pendiente: number;
    moneda: string;
}

/*
 * Inicia onboarding de Stripe Connect para el creador.
 * Redirige a Stripe para completar la configuración de pagos.
 */
export const iniciarOnboardingConnect = async (): Promise<{
    ok: boolean;
    url?: string;
    error?: string;
}> => {
    try {
        const resp = await apiPost<{ ok: boolean; url: string }>('/connect/onboarding');
        if (resp.ok && resp.data?.url) {
            return { ok: true, url: resp.data.url };
        }
        return { ok: false, error: resp.error ?? 'Error al iniciar configuración de pagos' };
    } catch (err) {
        log.error('Error iniciando onboarding Connect', err);
        return { ok: false, error: 'Error de conexión' };
    }
};

/*
 * Consulta el estado de la cuenta Connect del creador.
 */
export const obtenerEstadoConnect = async (): Promise<RespuestaApi<DatosConnect>> => {
    try {
        return await apiGet<DatosConnect>('/connect/estado');
    } catch (err) {
        log.error('Error obteniendo estado Connect', err);
        return {
            ok: false,
            data: {
                estado: 'no_configurado',
                connectId: null,
                cargosActivos: false,
                payoutsActivos: false,
                detalle: null,
            },
            error: 'Error de red',
            status: 500,
        };
    }
};

/*
 * Abre el dashboard de Stripe Express del creador.
 */
export const abrirDashboardStripe = async (): Promise<{
    ok: boolean;
    url?: string;
    error?: string;
}> => {
    try {
        const resp = await apiPost<{ ok: boolean; url: string }>('/connect/dashboard');
        if (resp.ok && resp.data?.url) {
            return { ok: true, url: resp.data.url };
        }
        return { ok: false, error: resp.error ?? 'Error al abrir dashboard de Stripe' };
    } catch (err) {
        log.error('Error abriendo dashboard Stripe', err);
        return { ok: false, error: 'Error de conexión' };
    }
};

/*
 * Obtiene el balance disponible y pendiente del creador.
 */
export const obtenerBalanceConnect = async (): Promise<RespuestaApi<BalanceConnect>> => {
    try {
        return await apiGet<BalanceConnect>('/connect/balance');
    } catch (err) {
        log.error('Error obteniendo balance Connect', err);
        return {
            ok: false,
            data: { disponible: 0, pendiente: 0, moneda: 'usd' },
            error: 'Error de red',
            status: 500,
        };
    }
};

/* CHECKOUT STRIPE */

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

/*
 * QQ11: Crea sesión de Stripe Checkout para compra individual de sample.
 * Redirige a Stripe para completar el pago one-time.
 */
export const crearCheckoutSample = async (
    sampleId: number
): Promise<{ ok: boolean; url?: string; error?: string }> => {
    try {
        const resp = await apiPost<{ ok: boolean; url: string }>('/pagos/checkout-sample', { sampleId });
        if (resp.ok && resp.data?.url) {
            return { ok: true, url: resp.data.url };
        }
        return { ok: false, error: resp.error ?? 'Error al crear sesión de compra' };
    } catch (err) {
        log.error('Error creando checkout sample', err);
        return { ok: false, error: 'Error de conexión' };
    }
};
