/**
 * Componente: SeccionPlanesServicio
 * Muestra las tarjetas de precios (pricing cards) de un servicio.
 * Recibe el slug del servicio y renderiza los 3 tiers.
 * Conecta con Stripe Checkout cuando el plan tiene stripePriceId.
 */
import React, {useState} from 'react';
import {obtenerPlanesServicio, type PlanServicio} from '../../data/planes/index';
import {Button} from '../ui/Button';
import {navegar} from '../../navegacionSPA';
import './SeccionPlanesServicio.css';

interface SeccionPlanesServicioProps {
    slug: string;
}

/*
 * Inicia el checkout de Stripe llamando al endpoint REST.
 * Si el plan no tiene stripePriceId, redirige al link de contacto.
 */
async function iniciarCheckout(plan: PlanServicio): Promise<void> {
    if (!plan.stripePriceId) {
        navegar(plan.ctaLink);
        return;
    }

    const ctx = typeof window !== 'undefined' ? window.GLORY_CONTEXT : undefined;
    if (!ctx?.isLoggedIn) {
        navegar(plan.ctaLink);
        return;
    }

    try {
        const response = await fetch('/wp-json/glory/v1/stripe/checkout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-WP-Nonce': ctx.nonce || '',
            },
            credentials: 'same-origin',
            body: JSON.stringify({
                planId: plan.id,
                modo: plan.stripeModo || 'payment',
            }),
        });

        const data = await response.json();

        if (data.url) {
            window.location.href = data.url;
        } else {
            console.error('[Stripe] Error:', data.error);
            navegar(plan.ctaLink);
        }
    } catch (error) {
        console.error('[Stripe] Error de red:', error);
        navegar(plan.ctaLink);
    }
}

const TarjetaPlan: React.FC<{plan: PlanServicio}> = ({plan}) => {
    const [cargando, setCargando] = useState(false);
    const claseDestacado = plan.destacado ? 'tarjetaPlanDestacado' : '';
    const clasePersonalizado = plan.esPersonalizado ? 'tarjetaPlanPersonalizado' : '';

    const handleClick = async () => {
        if (cargando) return;
        setCargando(true);
        try {
            await iniciarCheckout(plan);
        } finally {
            setCargando(false);
        }
    };

    return (
        <div className={`tarjetaPlan ${claseDestacado} ${clasePersonalizado}`}>
            {plan.destacado && <div className="tarjetaPlanBadge">Recomendado</div>}

            <div className="tarjetaPlanCabecera">
                <h3 className="tarjetaPlanNombre">{plan.nombre}</h3>
                <div className="tarjetaPlanPrecio">
                    <span className="tarjetaPlanPrecioCifra">{plan.precio}</span>
                    {plan.periodo && <span className="tarjetaPlanPrecioPeriodo">{plan.periodo}</span>}
                </div>
                <p className="tarjetaPlanDescripcion">{plan.descripcion}</p>
            </div>

            <ul className="tarjetaPlanCaracteristicas">
                {plan.caracteristicas.map((car, idx) => (
                    <li key={idx} className={`tarjetaPlanItem ${car.incluido ? 'tarjetaPlanItemIncluido' : 'tarjetaPlanItemNoIncluido'}`}>
                        <span className="tarjetaPlanItemIcono">
                            {car.incluido ? (
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                            ) : (
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            )}
                        </span>
                        <span className="tarjetaPlanItemTexto">{car.texto}</span>
                    </li>
                ))}
            </ul>

            <div className="tarjetaPlanAccion">
                <Button
                    variante={plan.destacado ? 'primario' : 'outline'}
                    tamano="mediano"
                    onClick={handleClick}
                    disabled={cargando}
                >
                    {cargando ? 'Procesando...' : plan.ctaTexto}
                </Button>
            </div>
        </div>
    );
};

export const SeccionPlanesServicio: React.FC<SeccionPlanesServicioProps> = ({slug}) => {
    const datos = obtenerPlanesServicio(slug);

    if (!datos) return null;

    return (
        <section id="planesServicio" className="planesSeccion">
            <div className="planesContenedor">
                <div className="planesCabecera">
                    <h2 className="planesTitulo">Elige tu plan</h2>
                    <p className="planesSubtitulo">
                        Selecciona el plan que mejor se adapte a tus necesidades. Todos incluyen soporte y garantia de satisfaccion.
                    </p>
                </div>
                <div className="planesGrid">
                    {datos.planes.map(plan => (
                        <TarjetaPlan key={plan.id} plan={plan} />
                    ))}
                </div>
            </div>
        </section>
    );
};
