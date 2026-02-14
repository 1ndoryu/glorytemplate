/*
 * AboutIsland - Pagina Sobre Nosotros de Cosmo Revenue
 * Replica la estructura exacta de about.php de App1.
 * Clases: about-container, method-section, method-icon, about-timeline,
 * method-step, step-content, step-title, step-text-wrapper, step-name,
 * step-desc, step-marker, bio-section, bio-content, bio-image, bio-text
 */

import React from 'react';
import '@app/styles/init.css';
import '@app/styles/about.css';

import { CosmoHeader } from '@app/components/layout/CosmoHeader';
import { PaginaHero } from '@app/components/layout/PaginaHero';
import { LineaTiempo } from '@app/components/ui/LineaTiempo';
import { FormularioContacto } from '@app/components/forms/FormularioContacto';
import { useGloryMedia } from '@/hooks';
import type { PasoTimeline } from '@app/components/ui/LineaTiempo';

/* Pasos del metodo COSMO, exactos del original about.php */
const pasosMetodologia: PasoTimeline[] = [
    {
        letra: 'C',
        titulo: 'Collect',
        subtitulo: 'Recopilación y Saneamiento',
        descripcion: 'Unificamos tus fuentes de datos (PMS, RMS, OTAs, web). Limpiamos y normalizamos la información para tener una base sólida y fiable.',
        claseMarcador: 'step-marker-c',
    },
    {
        letra: 'O',
        titulo: 'Orchestrate',
        subtitulo: 'Orquestación de Procesos',
        descripcion: 'Definimos los KPIs críticos, las cadencias de revisión y asignamos responsables. Creamos un S&OP de ingresos claro.',
        claseMarcador: 'step-marker-o',
    },
    {
        letra: 'S',
        titulo: 'Signal',
        subtitulo: 'Lectura del Mercado',
        descripcion: 'Monitorizamos señales de demanda: eventos, pick-up por segmento, elasticidad de precios y estacionalidad en tiempo real.',
        claseMarcador: 'step-marker-s',
    },
    {
        letra: 'M',
        titulo: 'Monetize',
        subtitulo: 'Ejecución de Ventas',
        descripcion: 'Aplicamos las reglas de precios, optimizamos el mix de canales y lanzamos campañas con retorno de inversión (ROI) medible.',
        claseMarcador: 'step-marker-m',
    },
    {
        letra: 'O',
        titulo: 'Optimize',
        subtitulo: 'Mejora continua',
        descripcion: 'Analizamos el post-mortem de cada acción. Aprendizaje continuo para iterar con rapidez y mejorar la rentabilidad futura.',
        claseMarcador: 'step-marker-s',
    },
];

export function AboutIsland(): React.JSX.Element {
    const imagenEquipo = useGloryMedia('equipo::equipo.jpg');

    return (
        <div className="about-container">
            <CosmoHeader />

            <PaginaHero
                textoScript="Sobre"
                textoPrincipal="NOSOTROS"
                subtitulo="Cosmo Revenue nace con un propósito claro: que los hoteles tomen decisiones de ingresos con claridad, confianza y control absoluto."
            />

            {/* Método COSMO */}
            <section className="method-section">
                <span className="method-icon">&#x2B22;</span>
                <h2 className="section-title">El Método COSMO</h2>
                <p className="section-subtitle">
                    Cada hotel es un sistema vivo. Alineamos datos, procesos y ejecución en 5 fases orbitales para que todo gire a favor de tu rentabilidad.
                </p>

                <LineaTiempo pasos={pasosMetodologia} />
            </section>

            {/* Bio / Equipo (oculto como en el original) */}
            <section className="bio-section" style={{ display: 'none' }}>
                <div className="bio-content">
                    <div className="bio-image">
                        {imagenEquipo.url && (
                            <img
                                src={imagenEquipo.url}
                                alt={imagenEquipo.alt || 'Laura - Cosmo Revenue'}
                                loading="lazy"
                            />
                        )}
                    </div>
                    <div className="bio-text">
                        <h2 className="bio-title">Hola, soy Laura</h2>
                        <div className="bio-desc">
                            <p>Lidero Cosmo Revenue como una consultoría boutique, alejándome de las grandes estructuras impersonales. Soy una profesional joven, independiente y cercana.</p>
                            <p>Mi experiencia se centra en la Comunidad Valenciana, trabajando con hoteles, apartamentos, villas y hostels para optimizar su rendimiento en mercados clave como ES, FR, DE y UK.</p>
                            <p>Creo firmemente que el Revenue Management no tiene por qué ser complejo ni opaco. Mi misión es traducir los datos en estrategias ejecutables que te den paz mental y resultados bancarios.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Contacto */}
            <FormularioContacto formId="about-contacto" titulo="Contacto" />
        </div>
    );
}

export default AboutIsland;
