/*
 * Isla: PlanesIsland — Página de planes con Stripe Checkout real.
 * Comparativa de planes, checkout, portal de facturación, estados post-checkout.
 */

import { useState, useEffect } from 'react';
import {
    Check,
    X,
    Zap,
    Crown,
    Sparkles,
    ArrowRight,
    CreditCard,
    Loader2,
    Settings,
    PartyPopper,
} from 'lucide-react';
import { BotonBase } from '@app/components/ui/BotonBase';
import { Badge } from '@app/components/ui/Badge';
import { useAuthStore } from '@app/stores/authStore';
import { useNavigationStore } from '@/core/router';
import { crearSesionCheckout, abrirPortalFacturacion } from '@app/services/apiPagos';
import type { PeriodoPlan } from '@app/services/apiPagos';
import '../../styles/componentes/planes.css';

type PlanId = 'free' | 'pro' | 'premium';

interface PlanInfo {
    id: PlanId;
    nombre: string;
    precio: number;
    periodo: string;
    descripcion: string;
    icono: JSX.Element;
    destacado: boolean;
    caracteristicas: { texto: string; incluido: boolean }[];
}

const PLANES: PlanInfo[] = [
    {
        id: 'free',
        nombre: 'Free',
        precio: 0,
        periodo: '',
        descripcion: 'Perfecto para empezar a explorar',
        icono: <Sparkles size={24} />,
        destacado: false,
        caracteristicas: [
            { texto: '5 descargas por día', incluido: true },
            { texto: 'Calidad WAV original', incluido: true },
            { texto: 'Subidas ilimitadas', incluido: true },
            { texto: '1 GB transferencia/mes', incluido: true },
            { texto: 'Explorar y descubrir', incluido: true },
            { texto: 'Perfil público', incluido: true },
            { texto: 'Prueba gratuita 30 días', incluido: true },
            { texto: 'Monetizar samples', incluido: false },
            { texto: 'Analytics avanzados', incluido: false },
            { texto: 'Revenue share', incluido: false },
        ],
    },
    {
        id: 'pro',
        nombre: 'Pro',
        precio: 9.99,
        periodo: '/mes',
        descripcion: 'Para productores serios',
        icono: <Zap size={24} />,
        destacado: true,
        caracteristicas: [
            { texto: '50 descargas por día', incluido: true },
            { texto: 'Calidad WAV original', incluido: true },
            { texto: 'Subidas ilimitadas', incluido: true },
            { texto: '10 GB transferencia/mes', incluido: true },
            { texto: 'Perfil verificado', incluido: true },
            { texto: 'Monetizar samples', incluido: true },
            { texto: 'Analytics avanzados', incluido: true },
            { texto: 'Revenue share 70/30', incluido: true },
            { texto: 'Soporte prioritario', incluido: false },
            { texto: 'Revenue share 80/20', incluido: false },
        ],
    },
    {
        id: 'premium',
        nombre: 'Premium',
        precio: 19.99,
        periodo: '/mes',
        descripcion: 'Sin límites, máximo control',
        icono: <Crown size={24} />,
        destacado: false,
        caracteristicas: [
            { texto: 'Descargas ilimitadas', incluido: true },
            { texto: 'Calidad WAV original', incluido: true },
            { texto: 'Subidas ilimitadas', incluido: true },
            { texto: '50 GB transferencia/mes', incluido: true },
            { texto: 'Perfil verificado', incluido: true },
            { texto: 'Monetizar samples', incluido: true },
            { texto: 'Analytics avanzados', incluido: true },
            { texto: 'Revenue share 80/20', incluido: true },
            { texto: 'Soporte dedicado 24/7', incluido: true },
            { texto: 'Acceso anticipado', incluido: true },
        ],
    },
];

/* Facturación anual con descuento */
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

export const PlanesIsland = (): JSX.Element => {
    const [periodoAnual, setPeriodoAnual] = useState(false);
    const [cargando, setCargando] = useState<PlanId | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [checkoutExito, setCheckoutExito] = useState(false);
    const { usuario, autenticado } = useAuthStore();
    const { navegar } = useNavigationStore();

    const planActual: PlanId = (usuario as { plan?: PlanId } | null)?.plan ?? 'free';

    /* Detectar retorno de Stripe Checkout */
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get('checkout') === 'exito') {
            setCheckoutExito(true);
            /* Limpiar la URL sin recargar */
            window.history.replaceState({}, '', window.location.pathname);
        }
    }, []);

    const obtenerPrecio = (plan: PlanInfo): string => {
        if (plan.precio === 0) return 'Gratis';
        if (periodoAnual) {
            const anual = calcularAnual(plan.precio);
            return `$${(anual.anual / 12).toFixed(2)}`;
        }
        return `$${plan.precio}`;
    };

    const obtenerEtiquetaBoton = (planId: PlanId): string => {
        if (!autenticado) return 'Empezar';
        if (planId === planActual) return 'Plan actual';
        if (planId === 'free') return 'Cambiar plan';
        const orden: PlanId[] = ['free', 'pro', 'premium'];
        return orden.indexOf(planId) > orden.indexOf(planActual) ? 'Mejorar plan' : 'Cambiar plan';
    };

    const manejarSeleccion = async (planId: PlanId) => {
        if (!autenticado) {
            navegar('/auth/registro/');
            return;
        }
        if (planId === planActual || planId === 'free') return;

        setError(null);
        setCargando(planId);

        try {
            const periodo: PeriodoPlan = periodoAnual ? 'anual' : 'mensual';
            const resultado = await crearSesionCheckout(planId as 'pro' | 'premium', periodo);

            if (resultado.ok && resultado.url) {
                /* Redirigir a Stripe Checkout */
                window.location.href = resultado.url;
            } else {
                setError(resultado.error ?? 'Error al crear sesión de pago');
            }
        } catch {
            setError('Error de conexión. Intenta de nuevo.');
        } finally {
            setCargando(null);
        }
    };

    const manejarPortal = async () => {
        setCargando('free');
        try {
            const resultado = await abrirPortalFacturacion();
            if (resultado.ok && resultado.url) {
                window.location.href = resultado.url;
            } else {
                setError(resultado.error ?? 'Error al abrir portal');
            }
        } catch {
            setError('Error de conexión');
        } finally {
            setCargando(null);
        }
    };

    return (
        <div className="planesIsland" id="planesIsland">
            {/* Banner post-checkout exitoso */}
            {checkoutExito && (
                <div className="planesAlertaExito">
                    <PartyPopper size={20} />
                    <span>¡Suscripción activada! Tu plan se actualizará en unos segundos.</span>
                </div>
            )}

            {/* Banner de error */}
            {error && (
                <div className="planesAlertaError">
                    <X size={16} />
                    <span>{error}</span>
                    <button onClick={() => setError(null)} className="planesAlertaCerrar">×</button>
                </div>
            )}

            {/* Header */}
            <header className="planesHeader">
                <h1>Elige tu plan</h1>
                <p>Desbloquea todo el potencial de Kamples</p>

                {/* Toggle mensual/anual */}
                <div className="planesToggle">
                    <button
                        className={`planesToggleBtn ${!periodoAnual ? 'planesToggleBtnActivo' : ''}`}
                        onClick={() => setPeriodoAnual(false)}
                    >
                        Mensual
                    </button>
                    <button
                        className={`planesToggleBtn ${periodoAnual ? 'planesToggleBtnActivo' : ''}`}
                        onClick={() => setPeriodoAnual(true)}
                    >
                        Anual
                        <Badge>-17%</Badge>
                    </button>
                </div>
            </header>

            {/* Grid de planes */}
            <div className="planesGrid">
                {PLANES.map((plan) => {
                    const esActual = autenticado && plan.id === planActual;

                    return (
                        <div
                            key={plan.id}
                            className={`planTarjeta ${plan.destacado ? 'planTarjetaDestacada' : ''} ${esActual ? 'planTarjetaActual' : ''}`}
                        >
                            {plan.destacado && (
                                <div className="planBadgePopular">
                                    <Badge>Más popular</Badge>
                                </div>
                            )}
                            {esActual && (
                                <div className="planBadgeActual">
                                    <Badge>Tu plan</Badge>
                                </div>
                            )}

                            <div className="planIcono">{plan.icono}</div>
                            <h2 className="planNombre">{plan.nombre}</h2>
                            <p className="planDescripcion">{plan.descripcion}</p>

                            <div className="planPrecio">
                                <span className="planPrecioCantidad">
                                    {obtenerPrecio(plan)}
                                </span>
                                {plan.precio > 0 && (
                                    <span className="planPrecioPeriodo">
                                        {periodoAnual ? '/mes (facturado anual)' : '/mes'}
                                    </span>
                                )}
                                {periodoAnual && plan.precio > 0 && (
                                    <span className="planAhorro">
                                        Ahorras ${calcularAnual(plan.precio).ahorro}/año
                                    </span>
                                )}
                            </div>

                            <BotonBase
                                variante={plan.destacado ? 'primario' : 'secundario'}
                                onClick={() => manejarSeleccion(plan.id)}
                                disabled={esActual || cargando !== null}
                                className="planBoton"
                            >
                                {cargando === plan.id ? (
                                    <>
                                        <Loader2 size={16} className="planBotonCargando" />
                                        Redirigiendo...
                                    </>
                                ) : esActual ? (
                                    <>
                                        <Check size={16} />
                                        {obtenerEtiquetaBoton(plan.id)}
                                    </>
                                ) : (
                                    <>
                                        {obtenerEtiquetaBoton(plan.id)}
                                        <ArrowRight size={16} />
                                    </>
                                )}
                            </BotonBase>

                            <ul className="planCaracteristicas">
                                {plan.caracteristicas.map((c, i) => (
                                    <li
                                        key={i}
                                        className={`planCaracteristica ${c.incluido ? 'planCaracteristicaIncluida' : 'planCaracteristicaExcluida'}`}
                                    >
                                        {c.incluido ? (
                                            <Check size={14} />
                                        ) : (
                                            <X size={14} />
                                        )}
                                        {c.texto}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    );
                })}
            </div>

            {/* Botón gestionar suscripción (solo para usuarios con plan de pago) */}
            {autenticado && planActual !== 'free' && (
                <div className="planesPortal">
                    <BotonBase
                        variante="secundario"
                        onClick={manejarPortal}
                        disabled={cargando !== null}
                    >
                        <Settings size={16} />
                        Gestionar suscripción
                    </BotonBase>
                </div>
            )}

            {/* FAQ / Info adicional */}
            <section className="planesFaq">
                <h2>Preguntas frecuentes</h2>
                <div className="planesFaqGrid">
                    <div className="planesFaqItem">
                        <h3>¿Puedo cambiar de plan en cualquier momento?</h3>
                        <p>
                            Sí, puedes mejorar o bajar tu plan cuando quieras. Los cambios se
                            aplican inmediatamente y se prorratea el cobro.
                        </p>
                    </div>
                    <div className="planesFaqItem">
                        <h3>¿Qué pasa con mis samples si bajo de plan?</h3>
                        <p>
                            Tus samples permanecen publicados. Solo se ajustan los límites de
                            descarga y subida según el nuevo plan.
                        </p>
                    </div>
                    <div className="planesFaqItem">
                        <h3>¿Cómo funciona el revenue share?</h3>
                        <p>
                            Los creadores Pro reciben 70% de cada venta, Premium 80%. Los pagos
                            se procesan semanalmente vía Stripe Connect.
                        </p>
                    </div>
                    <div className="planesFaqItem">
                        <h3>
                            <CreditCard size={16} /> ¿Es seguro el pago?
                        </h3>
                        <p>
                            Todos los pagos se procesan con Stripe, certificado PCI DSS nivel 1.
                            No almacenamos datos de tarjeta.
                        </p>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default PlanesIsland;
