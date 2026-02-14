/*
 * LandingIsland - Pagina principal de Cosmo Revenue
 * Replica la estructura exacta de landing.php de App1.
 * Usa clases CSS originales de landing.css, init.css, home.css
 */

import React from 'react';
import '@app/styles/init.css';
import '@app/styles/landing.css';
import '@app/styles/home.css';

import { CosmoHeader } from '@app/components/layout/CosmoHeader';
import { Marquee } from '@app/components/ui/Marquee';
import { TarjetaFlip } from '@app/components/ui/TarjetaFlip';
import { EncabezadoSeccion } from '@app/components/ui/EncabezadoSeccion';
import { FormularioContacto } from '@app/components/forms/FormularioContacto';
import { GraficoOrbital } from '@app/components/cosmo/GraficoOrbital';
import { TarjetaCaso } from '@app/components/cosmo/TarjetaCaso';
import { useCasos } from '@app/hooks/useCasos';
import { useGloryMedia } from '@/hooks';
import type { CasoExito } from '@app/types/cosmo';

/* Datos del grafico orbital (igual que el original) */
const planetasMetodologia = [
    { letra: 'S', nombre: 'Signal', descripcion: 'Lectura del Mercado - Monitorizamos señales de demanda, eventos y elasticidad de precios en tiempo real.' },
    { letra: 'M', nombre: 'Monetize', descripcion: 'Ejecución de Ventas - Aplicamos reglas de precios, optimizamos canales y lanzamos campañas con ROI medible.' },
    { letra: 'C', nombre: 'Collect', descripcion: 'Recopilación y Saneamiento - Unificamos tus fuentes de datos y normalizamos la información.' },
    { letra: 'O', nombre: 'Orchestrate', descripcion: 'Orquestación de Procesos - Definimos KPIs críticos, cadencias de revisión y asignamos responsables.' },
    { letra: 'O', nombre: 'Optimize', descripcion: 'Mejora continua - Analizamos el post-mortem de cada acción para iterar con rapidez.' },
];

/* Datos de las tarjetas flip (igual que el original) */
const tarjetasServicios = [
    {
        titulo: 'Marketing y \nestrategia',
        descripcion: 'Impulsa tu visibilidad y venta directa. Desde el lanzamiento hasta la consolidación de tu posicionamiento digital.',
        imagenKey: 'tema::marketing.jpg',
        variante: 'dark' as const,
    },
    {
        titulo: 'Revenue \nManagement',
        descripcion: 'Programas adaptados a la madurez de tu alojamiento. Desde auditoría técnica hasta gestión 360.',
        imagenKey: 'tema::revenueNew.png',
        variante: 'light' as const,
    },
    {
        titulo: 'Consultoria & \nMapeos',
        descripcion: 'Antes de correr, ordenamos el camino. Diagnóstico, limpieza de datos y hoja de ruta clara antes de temporada.',
        imagenKey: 'tema::consultoria.jpg',
        variante: 'dark' as const,
    },
];

export function LandingIsland(): React.JSX.Element {
    const { casos } = useCasos();
    const imagenMarketing = useGloryMedia('tema::marketing.jpg');
    const imagenRevenue = useGloryMedia('tema::revenueNew.png');
    const imagenConsultoria = useGloryMedia('tema::consultoria.jpg');

    const imagenes = [imagenMarketing.url, imagenRevenue.url, imagenConsultoria.url];
    const casosLimitados: CasoExito[] = casos.slice(0, 3);

    return (
        <div className="landing-container">
            <CosmoHeader />

            {/* Hero - estructura exacta de landing_hero() */}
            <section className="hero-section">
                <div className="hero-content">
                    <h1 className="titulo-responsive hero-title">
                        Ordenamos el universo de tus<br />
                        <span className="highlight-text">INGRESOS</span>
                    </h1>
                    <a href="/contacto/" className="btn-auditoria">
                        <svg className="auditoria-icon" viewBox="0 0 26.19 26.19" fill="currentColor">
                            <path d="m13.09,0l1.37,8.33c.29,1.74,1.65,3.11,3.39,3.39l8.33,1.37-8.33,1.37c-1.74.29-3.11,1.65-3.39,3.39l-1.37,8.33-1.37-8.33c-.29-1.74-1.65-3.11-3.39-3.39L0,13.09l8.33-1.37c1.74-.29,3.11-1.65,3.39-3.39L13.09,0Z" />
                        </svg>
                        Reservar auditoría
                    </a>
                </div>
                <Marquee texto="ESTRATEGIA, ANÁLISIS y RESULTADOS REALES" variante="dark" className="hero-marquee" />
            </section>

            {/* Servicios - Flip Cards */}
            <section className="services-section">
                <div className="section-header">
                    <h2 className="section-title">Logra el máximo <br /> potencial</h2>
                    <p className="section-subtitle">En Cosmo Revenue diseñamos estrategias integrales para potenciar la rentabilidad de tu alojamiento.</p>
                </div>

                <div className="cards-grid">
                    {tarjetasServicios.map((tarjeta, i) => (
                        <TarjetaFlip
                            key={i}
                            imagenFrente={imagenes[i] ?? ''}
                            tituloFrente={tarjeta.titulo}
                            textoReverso={tarjeta.descripcion}
                            variante={tarjeta.variante}
                        />
                    ))}
                </div>
            </section>

            {/* Casos de éxito */}
            <section className="cases-section">
                <div className="cases-container">
                    <div className="section-header">
                        <h2 className="section-title">Casos de éxito</h2>
                        <p className="section-subtitle">Descubre el impacto real de nuestras estrategias y cómo transformamos la rentabilidad de hoteles como el tuyo.</p>
                    </div>
                    <div className="cases-grid">
                        {casosLimitados.map((caso) => (
                            <TarjetaCaso key={caso.id} caso={caso} />
                        ))}
                    </div>
                </div>
                <Marquee texto="RENTABILIDAD COMPROBADA CON DATOS REALES" variante="light" className="cases-marquee" />
            </section>

            {/* Metodología */}
            <section className="methodology-section">
                <div className="methodology-container">
                    <div className="section-header dark-header">
                        <h2 className="section-title">Metodología Cosmo</h2>
                        <p className="section-subtitle">Cada hotel es un sistema. Con COSMO alineamos datos, procesos y ejecución para que todo gire a favor del resultado.</p>
                    </div>
                    <GraficoOrbital planetas={planetasMetodologia} />
                </div>
                <Marquee texto="TODO GIRA A FAVOR DE TU RENTABILIDAD" variante="dark" className="methodology-marquee" />
            </section>

            {/* About */}
            <section className="about-section">
                <div className="about-content">
                    <div className="orbit-center-about" style={{ backgroundColor: '#141414', borderRadius: '500px', padding: '30px' }}>
                        <img src="/wp-content/themes/glorytemplate/App/Assets/images/logocuadradoblanco.png" style={{ height: 'auto', width: 'auto', maxHeight: '80px' }} alt="Cosmo Logo" />
                    </div>
                    <h2 className="section-title">Sobre nosotros</h2>
                    <p className="about-text">
                        En Cosmo Revenue somos una consultoría boutique especializada en revenue management y RevOps para la industria hotelera. Nos dedicamos a brindar soluciones personalizadas, fundamentadas en datos reales y en un enfoque cercano y de confianza con nuestros clientes. Nuestro objetivo es empoderar a los hoteles para que tomen decisiones de ingresos con claridad y seguridad, generando resultados sostenibles y duraderos.
                    </p>
                    <a href="/about/" className="btn-about">Leer más</a>
                </div>
                <Marquee texto="ES EL MEJOR MOMENTO PARA DESPEGAR" variante="light" className="about-marquee" />
            </section>

            {/* Contacto */}
            <section className="contact-section">
                <div className="contact-container">
                    <div className="section-header">
                        <h2 className="section-title">Contacto</h2>
                    </div>
                    <FormularioContacto formId="contacto" titulo="" />
                </div>
            </section>
        </div>
    );
}

export default LandingIsland;
