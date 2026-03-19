/*
 * useDashboardCreador — Hook para DashboardCreadorIsland.
 * Gestiona carga de stats, top samples, transacciones, ingresos,
 * Stripe Connect (onboarding + balance) y tab activa.
 * AbortController para cleanup en unmount.
 */

import { useState, useCallback, useEffect } from 'react';
import {
    obtenerEstadisticasCreador,
    obtenerTopSamples,
    obtenerTransacciones,
    obtenerIngresosPorPeriodo,
    iniciarOnboardingConnect,
    obtenerEstadoConnect,
    abrirDashboardStripe,
    obtenerBalanceConnect,
    type EstadisticasCreador,
    type SampleStats,
    type TransaccionCreador,
    type IngresosPorPeriodo,
    type DatosConnect,
    type BalanceConnect,
} from '@app/services/apiPagos';
import { esEscritorio, abrirEnlaceExterno } from '@app/utils/plataforma';
import { useNavigationStore } from '@/core/router';

/* Calcular porcentaje de cambio entre dos periodos */
const calcularCambio = (actual: number, anterior: number): { valor: number; positivo: boolean } => {
    if (anterior === 0) return { valor: 0, positivo: true };
    const cambio = ((actual - anterior) / anterior) * 100;
    return { valor: Math.abs(Math.round(cambio)), positivo: cambio >= 0 };
};

export function useDashboardCreador() {
    const [tabActiva, setTabActiva] = useState('resumen');
    const [stats, setStats] = useState<EstadisticasCreador | null>(null);
    const [topSamples, setTopSamples] = useState<SampleStats[]>([]);
    const [transacciones, setTransacciones] = useState<TransaccionCreador[]>([]);
    const [ingresos, setIngresos] = useState<IngresosPorPeriodo[]>([]);
    const [cargando, setCargando] = useState(true);
    const navegar = useNavigationStore(s => s.navegar);

    /* Estado Connect */
    const [estadoConnect, setEstadoConnect] = useState<DatosConnect | null>(null);
    const [balanceConnect, setBalanceConnect] = useState<BalanceConnect | null>(null);
    const [conectando, setConectando] = useState(false);

    /* Cargar todos los datos con AbortController */
    useEffect(() => {
        const controller = new AbortController();

        const cargar = async () => {
            setCargando(true);
            try {
                const [resStats, resTop, resTrans, resIngresos, resConnect] = await Promise.all([
                    obtenerEstadisticasCreador(),
                    obtenerTopSamples(),
                    obtenerTransacciones(),
                    obtenerIngresosPorPeriodo('mes'),
                    obtenerEstadoConnect(),
                ]);

                if (controller.signal.aborted) return;

                if (resStats.ok && resStats.data) setStats(resStats.data);
                if (resTop.ok && resTop.data) setTopSamples(resTop.data);
                if (resTrans.ok && resTrans.data) setTransacciones(resTrans.data);
                if (resIngresos.ok && resIngresos.data) setIngresos(resIngresos.data);

                if (resConnect.ok && resConnect.data) {
                    setEstadoConnect(resConnect.data);
                    if (resConnect.data.estado === 'activo') {
                        const resBalance = await obtenerBalanceConnect();
                        if (!controller.signal.aborted && resBalance.ok && resBalance.data) {
                            setBalanceConnect(resBalance.data);
                        }
                    }
                }
            } catch {
                /* Fallo de carga — dashboard queda vacio */
            } finally {
                if (!controller.signal.aborted) setCargando(false);
            }
        };

        cargar();
        return () => { controller.abort(); };
    }, []);

    /* Iniciar onboarding Connect */
    const manejarOnboarding = useCallback(async () => {
        setConectando(true);
        try {
            const resultado = await iniciarOnboardingConnect();
            if (resultado.ok && resultado.url) {
                /* [183A-87] Desktop: abrir onboarding Stripe en navegador externo */
                if (esEscritorio()) {
                    await abrirEnlaceExterno(resultado.url);
                } else {
                    window.location.href = resultado.url;
                }
            }
        } catch {
            /* Fallo silencioso */
        } finally {
            setConectando(false);
        }
    }, []);

    /* Abrir dashboard Stripe */
    const manejarDashboardStripe = useCallback(async () => {
        try {
            const resultado = await abrirDashboardStripe();
            if (resultado.ok && resultado.url) {
                window.open(resultado.url, '_blank');
            }
        } catch {
            /* Fallo silencioso */
        }
    }, []);

    const cambioIngresos = stats
        ? calcularCambio(stats.ingresosMes, stats.ingresosAnterior)
        : undefined;

    return {
        tabActiva,
        setTabActiva,
        stats,
        topSamples,
        transacciones,
        ingresos,
        cargando,
        navegar,
        estadoConnect,
        balanceConnect,
        conectando,
        manejarOnboarding,
        manejarDashboardStripe,
        cambioIngresos,
    };
}
