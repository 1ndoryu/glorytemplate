/*
 * ServicioDetalleIsland - Pagina de detalle de un plan de servicio
 * Replica la estructura exacta de service-detail.php de App1.
 * Clases: service-detail-container, service-detail-content, service-info-container,
 * service-info, service-category-tag, service-detail-title, etc.
 */

import React from 'react';
import '@app/styles/init.css';
import '@app/styles/service-detail.css';

import { CosmoHeader } from '@app/components/layout/CosmoHeader';
import { PaginaHero } from '@app/components/layout/PaginaHero';
import { FormularioContacto } from '@app/components/forms/FormularioContacto';
import { obtenerPlan } from '@app/components/cosmo/DatosPlanesServicio';
import { useIslandProps } from '@/hooks';

interface ServicioDetalleProps {
    planSlug?: string;
    [key: string]: unknown;
}

export function ServicioDetalleIsland(rawProps: Record<string, unknown>): React.JSX.Element {
    const props = useIslandProps<ServicioDetalleProps>(rawProps);
    const slug = props.planSlug ?? 'comet';
    const plan = obtenerPlan(slug);

    if (!plan) {
        return (
            <div className="service-detail-container">
                <CosmoHeader />
                <PaginaHero textoScript="Plan" textoPrincipal="NO ENCONTRADO" subtitulo={`El plan "${slug}" no existe.`} />
            </div>
        );
    }

    /* Mapa de categorias a etiquetas igual que el original */
    const etiquetaCategoria: Record<string, string> = {
        marketing: 'Marketing y Estrategia',
        consultoria: 'Consultoría y Mapeo',
        revenue: 'Revenue Management',
    };

    return (
        <div className="service-detail-container">
            <CosmoHeader />

            <PaginaHero
                textoScript="Plan"
                textoPrincipal={plan.nombre.toUpperCase()}
                subtitulo={plan.descripcion}
            />

            <section className="service-detail-content">
                {/* Info del servicio */}
                <div className="service-info-container">
                    <div className="service-info">
                        <div className="service-category-tag">
                            <span>{etiquetaCategoria[plan.categoria] ?? plan.categoria}</span>
                        </div>

                        <h2 className="service-detail-title">{plan.nombre}</h2>
                        <p className="service-detail-tagline">{plan.subtitulo}</p>

                        <div className="service-detail-description">
                            <p>{plan.descripcion}</p>
                        </div>

                        <div className="service-features-section">
                            <h3 className="features-title">Qué incluye</h3>
                            <ul className="service-features-list">
                                {plan.features.map((feature, i) => (
                                    <li key={i}>
                                        <span className="feature-icon">
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
                                                <path d="M8 12L11 15L16 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                        </span>
                                        <span>{feature}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {plan.idealPara && (
                            <div className="service-ideal-for">
                                <h4>Ideal para:</h4>
                                <p>{plan.idealPara}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Formulario con servicio preseleccionado */}
                <div className="service-contact-wrapper">
                    <FormularioContacto
                        formId={`servicio-${slug}`}
                        servicioPreseleccionado={`${plan.nombre} - ${etiquetaCategoria[plan.categoria] ?? plan.categoria}`}
                        mostrarBadgeServicio={true}
                        titulo={`Solicitar información sobre ${plan.nombre}`}
                        mostrarHabitaciones={false}
                    />
                </div>
            </section>
        </div>
    );
}

export default ServicioDetalleIsland;
