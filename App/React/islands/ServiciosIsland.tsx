/*
 * ServiciosIsland - Pagina de servicios de Cosmo Revenue
 * Secciones: Hero, Marketing (3 cards), Consulting + Orbit card, Revenue (2 cards)
 */

import React from 'react';
import '@app/styles/variables.css';
import '@app/styles/global.css';
import '@app/styles/servicios.css';

import { CosmoHeader } from '@app/components/layout/CosmoHeader';
import { PaginaHero } from '@app/components/layout/PaginaHero';
import { Marquee } from '@app/components/ui/Marquee';
import { EncabezadoSeccion } from '@app/components/ui/EncabezadoSeccion';
import { TarjetaFeature } from '@app/components/ui/TarjetaFeature';
import {
    planesMarketing,
    planesConsultoria,
    planesRevenue,
} from '@app/components/cosmo/DatosPlanesServicio';

const textosMarquee = [
    'Comet', 'Nebula', 'Quasar', 'Orbit', 'Galaxy', 'Universe',
];

export function ServiciosIsland(): React.JSX.Element {
    const orbit = planesConsultoria[0];

    return (
        <div className="contenedorServicios" id="serviciosCosmo">
            <CosmoHeader />
            <PaginaHero
                titulo="Nuestros"
                tituloScript="Servicios"
                subtitulo="Descubre las soluciones que impulsarán la rentabilidad de tu hotel."
            />

            <Marquee textos={textosMarquee} variante="dark" />

            {/* Marketing */}
            <section className="seccionMarketing" id="seccionMarketing">
                <EncabezadoSeccion
                    etiqueta="Marketing Digital"
                    titulo="Marketing"
                    subtitulo="Estrategias de marketing especializadas en el sector hotelero."
                />
                <div className="gridMarketing">
                    {planesMarketing.map((plan, i) => {
                        const posiciones = ['tarjetaIzquierda', 'tarjetaCentro', 'tarjetaDerecha'];
                        return (
                            <TarjetaFeature
                                key={plan.slug}
                                titulo={plan.nombre}
                                subtitulo={plan.subtitulo}
                                descripcion={plan.descripcion}
                                features={plan.features}
                                enlace={`/servicio-${plan.slug}/`}
                                textoEnlace="Ver detalle"
                                posicion={posiciones[i]}
                            />
                        );
                    })}
                </div>
            </section>

            {/* Consultoría */}
            <section className="seccionConsultoria" id="seccionConsultoria">
                <div className="contenidoConsultoria">
                    <div className="izquierdaConsultoria">
                        <EncabezadoSeccion
                            etiqueta="Consultoría"
                            titulo="Consultoría Estratégica"
                        />
                        <p className="textoSeccion">
                            Analizamos cada aspecto de tu operación hotelera para identificar oportunidades
                            de mejora y diseñar un plan de acción personalizado que maximice tus resultados.
                        </p>
                        <p className="textoSeccion">
                            Nuestro enfoque se basa en datos, experiencia sectorial y las mejores prácticas
                            internacionales de revenue management.
                        </p>
                    </div>
                    <div className="derechaConsultoria">
                        <div className="tarjetaOrbit">
                            <div className="encabezadoOrbit">
                                <h3>{orbit.nombre}</h3>
                            </div>
                            <p className="orbitDesc">{orbit.subtitulo}</p>
                            <p className="orbitSubdesc">{orbit.descripcion}</p>
                            <div className="orbitFeatures">
                                <ul>
                                    {orbit.features.map((f, i) => (
                                        <li key={i}>✦ {f}</li>
                                    ))}
                                </ul>
                            </div>
                            <a href={`/servicio-${orbit.slug}/`} className="botonOrbit">
                                Solicitar consultoría
                            </a>
                        </div>
                    </div>
                </div>
            </section>

            {/* Revenue */}
            <section className="seccionRevenue" id="seccionRevenue">
                <EncabezadoSeccion
                    etiqueta="Revenue Management"
                    titulo="Revenue"
                    subtitulo="Gestión profesional de pricing y distribución para maximizar tus ingresos."
                />
                <div className="gridRevenue">
                    <div className="gridRevenueInner">
                        {planesRevenue.map((plan, i) => {
                            const posiciones = ['tarjetaIzquierda', 'tarjetaDerechaInferior'];
                            return (
                                <TarjetaFeature
                                    key={plan.slug}
                                    titulo={plan.nombre}
                                    subtitulo={plan.subtitulo}
                                    descripcion={plan.descripcion}
                                    features={plan.features}
                                    enlace={`/servicio-${plan.slug}/`}
                                    textoEnlace="Ver detalle"
                                    posicion={posiciones[i]}
                                />
                            );
                        })}
                    </div>
                </div>
                <div className="pieSectionRevenue">
                    <div className="pieSectionContenido">
                        <p className="textoRevenuePie">
                            ¿No sabes qué plan se adapta mejor a tu hotel?
                            Nuestro equipo te ayuda a elegir la solución perfecta.
                        </p>
                        <a href="/contacto/" className="botonRevenue">
                            Solicitar asesoramiento
                        </a>
                    </div>
                </div>
            </section>
        </div>
    );
}

export default ServiciosIsland;
