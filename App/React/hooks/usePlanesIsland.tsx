/*
 * Hook: usePlanesIsland — Kamples
 * Lógica de planes: toggle periodo, checkout Stripe, portal facturación.
 * Datos estáticos PLANES exportados para renderizado.
 * QL49: En APK Android, Stripe Checkout no funciona en WebView.
 *       Se muestra mensaje alternativo redirigiendo a la web.
 */

import { useState, useEffect } from 'react';
import { Zap, Crown, Sparkles } from 'lucide-react';
import { useAuthStore } from '@app/stores/authStore';
import { usePlanesModalStore } from '@app/stores/planesModalStore';
import { useAuthModalStore } from '@app/stores/authModalStore';
import { crearSesionCheckout, abrirPortalFacturacion } from '@app/services/apiPagos';
import { resolverRutaAsset } from '@app/utils/resolverRutaAsset';
import { esAndroid, esEscritorio, abrirEnlaceExterno } from '@app/utils/plataforma';
import { getT } from '@app/utils/i18n';
import type { PeriodoPlan } from '@app/services/apiPagos';

export type PlanId = 'free' | 'pro' | 'premium';

export interface PlanInfo {
    id: PlanId;
    nombre: string;
    precio: number;
    periodo: string;
    descripcion: string;
    icono: JSX.Element;
    destacado: boolean;
    caracteristicas: { texto: string; incluido: boolean }[];
}

// sentinel-disable-next-line objeto-mutable-exportado — configuracion estatica UI, no se muta en runtime
export const PLANES: PlanInfo[] = [
    {
        id: 'free',
        nombre: 'planes.plan.free',
        precio: 0,
        periodo: '',
        descripcion: 'planes.descripcion.free',
        icono: <Sparkles size={24} />,
        destacado: false,
        caracteristicas: [
            { texto: 'planes.feature.descargas5', incluido: true },
            { texto: 'planes.feature.wavOriginal', incluido: true },
            { texto: 'planes.feature.sincronizacion100', incluido: true },
            { texto: 'planes.feature.transferencia1gb', incluido: true },
            { texto: 'planes.feature.explorarDescubrir', incluido: true },
            { texto: 'planes.feature.perfilPublico', incluido: true },
            { texto: 'planes.feature.prueba30dias', incluido: true },
            { texto: 'planes.feature.monetizarSamples', incluido: false },
            { texto: 'planes.feature.analyticsAvanzados', incluido: false },
            { texto: 'planes.feature.revenueShare', incluido: false },
        ],
    },
    {
        id: 'pro',
        nombre: 'Pro',
        precio: 5,
        periodo: '/mes',
        descripcion: 'planes.descripcion.pro',
        icono: <Zap size={24} />,
        destacado: true,
        caracteristicas: [
            { texto: 'planes.feature.descargas50', incluido: true },
            { texto: 'planes.feature.wavOriginal', incluido: true },
            { texto: 'planes.feature.sincronizacion20k', incluido: true },
            { texto: 'planes.feature.transferencia10gb', incluido: true },
            { texto: 'planes.feature.perfilVerificado', incluido: true },
            { texto: 'planes.feature.monetizarSamples', incluido: true },
            { texto: 'planes.feature.analyticsAvanzados', incluido: true },
            { texto: 'planes.feature.revenue7030', incluido: true },
            { texto: 'planes.feature.soportePrioritario', incluido: false },
            { texto: 'planes.feature.revenue8020', incluido: false },
        ],
    },
    {
        id: 'premium',
        nombre: 'Premium',
        precio: 19.99,
        periodo: '/mes',
        descripcion: 'planes.descripcion.premium',
        icono: <Crown size={24} />,
        destacado: false,
        caracteristicas: [
            { texto: 'planes.feature.descargasIlimitadas', incluido: true },
            { texto: 'planes.feature.wavOriginal', incluido: true },
            { texto: 'planes.feature.sincronizacion20k', incluido: true },
            { texto: 'planes.feature.transferencia50gb', incluido: true },
            { texto: 'planes.feature.perfilVerificado', incluido: true },
            { texto: 'planes.feature.monetizarSamples', incluido: true },
            { texto: 'planes.feature.analyticsAvanzados', incluido: true },
            { texto: 'planes.feature.revenue8020', incluido: true },
            { texto: 'planes.feature.soporte247', incluido: true },
            { texto: 'planes.feature.accesoAnticipado', incluido: true },
        ],
    },
];

interface PrecioAnual {
    mensual: number;
    anual: number;
    ahorro: number;
}

const calcularAnual = (mensual: number): PrecioAnual => ({
    mensual,
    anual: Math.round(mensual * 10 * 100) / 100,
    ahorro: Math.round(mensual * 2 * 100) / 100,
});

export const usePlanesIsland = () => {
    const t = getT();
    const [periodoAnual, setPeriodoAnual] = useState(false);
    const [cargando, setCargando] = useState<PlanId | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [checkoutExito, setCheckoutExito] = useState(false);

    const usuario = useAuthStore(s => s.usuario);
    const autenticado = useAuthStore(s => s.autenticado);
    const abierto = usePlanesModalStore(s => s.abierto);
    const cerrarPlanes = usePlanesModalStore(s => s.cerrar);
    const abrirAuth = useAuthModalStore(s => s.abrir);

    const planActual: PlanId = (usuario as { plan?: PlanId } | null)?.plan ?? 'free';
    const imagenPlanes = resolverRutaAsset('/wp-content/themes/glorytemplate/App/Assets/images/1.jpg');
    const planVisible = PLANES.find(plan => plan.id === 'pro');
    const esActualVisible = Boolean(autenticado && planVisible && planVisible.id === planActual);

    /* Detectar retorno de Stripe Checkout */
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get('checkout') === 'exito') {
            setCheckoutExito(true);
            window.history.replaceState({}, '', window.location.pathname);
        }
    }, []);

    const obtenerPrecio = (plan: PlanInfo): string => {
        if (plan.precio === 0) return t('planes.gratis');
        if (periodoAnual) {
            const anual = calcularAnual(plan.precio);
            return `$${(anual.anual / 12).toFixed(2)}`;
        }
        return `$${plan.precio}`;
    };

    const obtenerEtiquetaBoton = (planId: PlanId): string => {
        if (!autenticado) return t('planes.boton.empezar');
        if (planId === planActual) return t('planes.boton.planActual');
        if (planId === 'free') return t('planes.boton.cambiarPlan');
        const orden: PlanId[] = ['free', 'pro', 'premium'];
        return orden.indexOf(planId) > orden.indexOf(planActual)
            ? t('planes.boton.mejorarPlan')
            : t('planes.boton.cambiarPlan');
    };

    const manejarSeleccion = async (planId: PlanId) => {
        if (!autenticado) { abrirAuth('registro'); return; }
        if (planId === planActual || planId === 'free') return;

        /* QL49: En APK Android, Stripe Checkout no funciona en WebView.
         * Abrir la web de Kamples en el navegador externo del dispositivo. */
        if (esAndroid()) {
            abrirEnlaceExterno('https://kamples.com/planes/');
            return;
        }

        /* [183A-87] En desktop Tauri, window.location.href mata la SPA React.
         * Se abre Stripe en el navegador del sistema via plugin-shell.
         * La sesión Tauri (auth.json) se preserva intacta. */
        if (esEscritorio()) {
            setError(null);
            setCargando(planId);
            try {
                const periodo: PeriodoPlan = periodoAnual ? 'anual' : 'mensual';
                const resultado = await crearSesionCheckout(planId as 'pro' | 'premium', periodo);
                if (resultado.ok && resultado.url) {
                    await abrirEnlaceExterno(resultado.url);
                    cerrarPlanes();
                } else {
                    setError(resultado.error ?? t('planes.error.crearSesionPago'));
                }
            } catch {
                setError(t('planes.error.conexionIntentaDeNuevo'));
            } finally {
                setCargando(null);
            }
            return;
        }

        setError(null);
        setCargando(planId);
        try {
            const periodo: PeriodoPlan = periodoAnual ? 'anual' : 'mensual';
            const resultado = await crearSesionCheckout(planId as 'pro' | 'premium', periodo);
            if (resultado.ok && resultado.url) {
                window.location.href = resultado.url;
            } else {
                setError(resultado.error ?? t('planes.error.crearSesionPago'));
            }
        } catch {
            setError(t('planes.error.conexionIntentaDeNuevo'));
        } finally {
            setCargando(null);
        }
    };

    const manejarPortal = async () => {
        setCargando('free');
        try {
            const resultado = await abrirPortalFacturacion();
            if (resultado.ok && resultado.url) {
                /* [183A-87] Desktop: abrir portal en navegador externo, no navegar WebView */
                if (esEscritorio()) {
                    await abrirEnlaceExterno(resultado.url);
                    cerrarPlanes();
                } else {
                    window.location.href = resultado.url;
                }
            } else {
                setError(resultado.error ?? t('planes.error.abrirPortal'));
            }
        } catch {
            setError(t('planes.error.conexion'));
        } finally {
            setCargando(null);
        }
    };

    const cerrarModalPlanes = () => cerrarPlanes();
    const esApk = esAndroid();

    return {
        periodoAnual, setPeriodoAnual, cargando, error, setError, checkoutExito,
        autenticado, planActual, abierto, imagenPlanes, planVisible, esActualVisible,
        obtenerPrecio, obtenerEtiquetaBoton, manejarSeleccion, manejarPortal,
        cerrarModalPlanes, calcularAnual, esApk,
    };
};
