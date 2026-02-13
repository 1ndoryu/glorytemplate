/*
 * ServicioDetalleIsland - Pagina de detalle de un plan de servicio
 * Recibe planSlug como prop de PHP y muestra info + features + formulario
 */

import React from 'react';
import '@app/styles/variables.css';
import '@app/styles/global.css';
import '@app/styles/servicioDetalle.css';

import { CosmoHeader } from '@app/components/layout/CosmoHeader';
import { PaginaHero } from '@app/components/layout/PaginaHero';
import { FormularioContacto } from '@app/components/forms/FormularioContacto';
import { obtenerPlan } from '@app/components/cosmo/DatosPlanesServicio';
import { useIslandProps } from '@/hooks';

interface ServicioDetalleProps {
    planSlug?: string;
}

export function ServicioDetalleIsland(rawProps: Record<string, unknown>): React.JSX.Element {
    const props = useIslandProps<ServicioDetalleProps>(rawProps);
    const slug = props.planSlug ?? 'comet';
    const plan = obtenerPlan(slug);

    if (!plan) {
        return (
            <div className="contenedorServicioDetalle">
                <CosmoHeader />
                <PaginaHero titulo="Servicio no encontrado" />
                <p style={{ textAlign: 'center', padding: '2rem' }}>
                    El plan &quot;{slug}&quot; no existe.
                </p>
            </div>
        );
    }

    /* Mapa de categorías a etiquetas legibles */
    const etiquetaCategoria: Record<string, string> = {
        marketing: 'Marketing Digital',
        consultoria: 'Consultoría Estratégica',
        revenue: 'Revenue Management',
    };

    return (
        <div className="contenedorServicioDetalle" id={`servicio-${slug}`}>
            <CosmoHeader />
            <PaginaHero titulo={plan.nombre} tituloScript={plan.subtitulo} />

            <div className="contenidoServicioDetalle">
                <div className="contenedorInfoServicio">
                    <div className="infoServicio">
                        <span className="etiquetaCategoria">
                            {etiquetaCategoria[plan.categoria] ?? plan.categoria}
                        </span>

                        <h2 className="tituloServicioDetalle">{plan.nombre}</h2>
                        <p className="taglineServicio">{plan.subtitulo}</p>

                        <div className="descripcionServicio">
                            <p>{plan.descripcion}</p>
                        </div>

                        {/* Features */}
                        <div className="seccionFeatures">
                            <h3 className="tituloFeatures">Qué incluye</h3>
                            <ul className="listaFeaturesServicio">
                                {plan.features.map((feature, i) => (
                                    <li key={i}>
                                        <span className="iconoFeature">✦</span>
                                        <span>{feature}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Ideal para */}
                        {plan.idealPara && (
                            <div className="idealPara">
                                <h4>Ideal para</h4>
                                <p>{plan.idealPara}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Formulario de contacto */}
                <div className="wrapperContactoServicio">
                    <div className="seccionContactoServicio">
                        <FormularioContacto
                            formId={`servicio-${slug}`}
                            servicioPreseleccionado={`${plan.nombre} - ${plan.subtitulo}`}
                            mostrarBadgeServicio={true}
                            titulo="¿Te interesa este plan?"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ServicioDetalleIsland;
