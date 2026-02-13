/*
 * AboutIsland - Pagina Sobre Nosotros de Cosmo Revenue
 * Secciones: Hero, Info, Metodología timeline, Bio, Contacto
 */

import React from 'react';
import '@app/styles/variables.css';
import '@app/styles/global.css';
import '@app/styles/about.css';

import { CosmoHeader } from '@app/components/layout/CosmoHeader';
import { PaginaHero } from '@app/components/layout/PaginaHero';
import { Marquee } from '@app/components/ui/Marquee';
import { LineaTiempo } from '@app/components/ui/LineaTiempo';
import { FormularioContacto } from '@app/components/forms/FormularioContacto';
import { useGloryMedia } from '@/hooks';

const textosMarquee = [
    'Revenue Management',
    'Consultoría Boutique',
    'Marketing Hotelero',
    'RevOps',
];

const pasosMetodologia = [
    {
        titulo: 'Diagnóstico',
        descripcion: 'Analizamos tu operación actual: PMS, OTAs, canales directos, pricing y competencia para identificar oportunidades.',
    },
    {
        titulo: 'Estrategia',
        descripcion: 'Diseñamos un plan de acción personalizado con objetivos claros, KPIs medibles y timeline de implementación.',
    },
    {
        titulo: 'Implementación',
        descripcion: 'Ejecutamos las acciones definidas: configuración de herramientas, optimización de canales y pricing dinámico.',
    },
    {
        titulo: 'Monitorización',
        descripcion: 'Seguimiento continuo de resultados con dashboards en tiempo real y reportes ejecutivos periódicos.',
    },
    {
        titulo: 'Optimización',
        descripcion: 'Ajustes constantes basados en datos para maximizar el rendimiento y adaptarnos a cambios del mercado.',
    },
];

export function AboutIsland(): React.JSX.Element {
    const imagenEquipo = useGloryMedia('equipo::equipo.jpg');

    return (
        <div className="contenedorAbout" id="aboutCosmo">
            <CosmoHeader />
            <PaginaHero
                titulo="Sobre"
                tituloScript="Nosotros"
                subtitulo="Una consultoría boutique de revenue y RevOps para hotelería."
            />

            <Marquee textos={textosMarquee} variante="dark" />

            {/* Info */}
            <section className="seccionInfo" id="infoAbout">
                <h2 className="tituloAbout">Transformamos hoteles en negocios rentables</h2>
                <p className="subtituloAbout">
                    Cosmo Revenue nace de la pasión por la hotelería y la convicción de que cada
                    alojamiento puede alcanzar su máximo potencial con la estrategia adecuada.
                    Combinamos tecnología, datos y experiencia sectorial para ofrecer resultados
                    medibles y sostenibles.
                </p>
            </section>

            {/* Metodología Timeline */}
            <section className="seccionMetodologia" id="metodologiaAbout">
                <h2 className="tituloMetodologia">Nuestra Metodología</h2>
                <LineaTiempo pasos={pasosMetodologia} />
            </section>

            {/* Bio / Equipo */}
            <section className="seccionBio" id="bioAbout">
                <div className="contenidoBio">
                    <div className="imagenBio">
                        {imagenEquipo.url && (
                            <img
                                src={imagenEquipo.url}
                                alt={imagenEquipo.alt || 'Equipo Cosmo Revenue'}
                                loading="lazy"
                            />
                        )}
                    </div>
                    <div className="textoBio">
                        <h3>Un equipo con experiencia</h3>
                        <p>
                            Nuestro equipo está formado por profesionales del sector hotelero con
                            más de 10 años de experiencia en revenue management, marketing digital
                            y consultoría estratégica.
                        </p>
                        <p>
                            Hemos trabajado con hoteles independientes, cadenas y villas de lujo,
                            adaptando nuestra metodología a las necesidades específicas de cada cliente.
                        </p>
                        <a href="/contacto/" className="botonBio">Conócenos</a>
                    </div>
                </div>
            </section>

            {/* Contacto */}
            <section className="seccionContacto" id="contactoAbout">
                <h2 className="tituloContacto">¿Hablamos?</h2>
                <FormularioContacto formId="about-contacto" />
            </section>
        </div>
    );
}

export default AboutIsland;
