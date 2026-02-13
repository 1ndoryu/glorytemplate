/*
 * LandingIsland - Pagina principal de Cosmo Revenue
 * Secciones: Hero, Servicios (flip cards), Casos, Metodología, About, Contacto
 */

import React from 'react';
import '@app/styles/variables.css';
import '@app/styles/global.css';
import '@app/styles/landing.css';

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

/* Datos del gráfico orbital */
const planetasMetodologia = [
    { letra: 'S', nombre: 'Estrategia', descripcion: 'Definimos objetivos y KPIs claros para tu hotel.' },
    { letra: 'M', nombre: 'Marketing', descripcion: 'Impulso digital en todos los canales relevantes.' },
    { letra: 'C', nombre: 'Canales', descripcion: 'Optimización de distribución y channel mix.' },
    { letra: 'O', nombre: 'Operaciones', descripcion: 'Procesos eficientes y automatización.' },
    { letra: 'R', nombre: 'Revenue', descripcion: 'Pricing dinámico y maximización de ingresos.' },
];

/* Datos de las tarjetas de servicio (flip cards) */
const tarjetasServicios = [
    {
        titulo: 'Marketing',
        descripcion: 'Estrategias de marketing digital especializadas en el sector hotelero para maximizar tu visibilidad y reservas directas.',
        imagen: '',
    },
    {
        titulo: 'Consultoría',
        descripcion: 'Auditoría completa de tu operación hotelera con plan de acción personalizado basado en datos y mejores prácticas del sector.',
        imagen: '',
    },
    {
        titulo: 'Revenue',
        descripcion: 'Gestión profesional de revenue management con pricing dinámico y optimización continua de canales de distribución.',
        imagen: '',
    },
];

/* Textos del marquee */
const textosMarquee = [
    'Revenue Management',
    'Marketing Hotelero',
    'Consultoría Estratégica',
    'Pricing Dinámico',
    'Channel Management',
];

export function LandingIsland(): React.JSX.Element {
    const { casos } = useCasos();
    const imagenMarketing = useGloryMedia('tema::marketing.jpg');
    const imagenConsultoria = useGloryMedia('tema::consultoria.jpg');
    const imagenRevenue = useGloryMedia('tema::revenue.jpg');

    /* Asignar URLs de imágenes cargadas a las tarjetas */
    const imagenes = [imagenMarketing.url, imagenConsultoria.url, imagenRevenue.url];
    const tarjetasConImagenes = tarjetasServicios.map((t, i) => ({
        ...t,
        imagen: imagenes[i] ?? '',
    }));

    /* Máximo 3 casos para la landing */
    const casosLimitados: CasoExito[] = casos.slice(0, 3);

    return (
        <div className="contenedorLanding" id="landingCosmo">
            <CosmoHeader />

            {/* Hero */}
            <section className="seccionHero" id="heroLanding">
                <div className="heroContenido">
                    <h1 className="heroTitulo">
                        <span className="textoDestacado">REVENUE</span>
                        <br />
                        Management
                    </h1>
                    <a href="/contacto/" className="botonAuditoria">
                        Auditoría gratuita
                        <span className="iconoAuditoria">
                            <svg viewBox="0 0 26.19 26.19" fill="currentColor">
                                <path d="m13.09,0l1.37,8.33c.29,1.74,1.65,3.11,3.39,3.39l8.33,1.37-8.33,1.37c-1.74.29-3.11,1.65-3.39,3.39l-1.37,8.33-1.37-8.33c-.29-1.74-1.65-3.11-3.39-3.39L0,13.09l8.33-1.37c1.74-.29,3.11-1.65,3.39-3.39L13.09,0Z" />
                            </svg>
                        </span>
                    </a>
                </div>
            </section>

            {/* Marquee */}
            <Marquee textos={textosMarquee} variante="dark" />

            {/* Servicios - Flip Cards */}
            <section className="seccionServicios" id="serviciosLanding">
                <EncabezadoSeccion
                    titulo="Nuestros Servicios"
                    subtitulo="Soluciones integrales para maximizar la rentabilidad de tu alojamiento."
                />
                <div className="gridTarjetas">
                    {tarjetasConImagenes.map((tarjeta, i) => (
                        <TarjetaFlip
                            key={i}
                            imagenFrente={tarjeta.imagen}
                            tituloFrente={tarjeta.titulo}
                            textoReverso={tarjeta.descripcion}
                        />
                    ))}
                </div>
            </section>

            {/* Casos de éxito */}
            <section className="seccionCasos" id="casosLanding">
                <EncabezadoSeccion
                    titulo="Casos de Éxito"
                    subtitulo="Resultados reales de hoteles que han confiado en nuestra metodología."
                />
                <div className="contenedorCasos">
                    <div className="gridCasos">
                        {casosLimitados.map((caso) => (
                            <TarjetaCaso key={caso.id} caso={caso} />
                        ))}
                    </div>
                </div>
            </section>

            {/* Marquee claro */}
            <Marquee textos={textosMarquee} variante="light" />

            {/* Metodología Orbital */}
            <section className="seccionMetodologia" id="metodologiaLanding">
                <EncabezadoSeccion
                    titulo="Metodología COSMO"
                    subtitulo="Un sistema probado que integra todas las áreas clave de la gestión hotelera."
                />
                <div className="contenedorMetodologia">
                    <GraficoOrbital planetas={planetasMetodologia} />
                </div>
            </section>

            {/* About */}
            <section className="seccionAbout" id="aboutLanding">
                <h2 className="tituloSeccion">Sobre Nosotros</h2>
                <div className="contenidoAbout">
                    <p className="textoAbout">
                        Somos una consultoría boutique especializada en revenue management y marketing hotelero.
                        Nuestro enfoque personalizado se basa en datos, tecnología y un profundo conocimiento
                        del sector para transformar la rentabilidad de cada propiedad que acompañamos.
                    </p>
                    <a href="/about/" className="botonAbout">Conócenos</a>
                </div>
            </section>

            {/* Contacto */}
            <section className="seccionContacto" id="contactoLanding">
                <EncabezadoSeccion
                    titulo="¿Hablamos?"
                    subtitulo="Solicita tu auditoría gratuita y descubre el potencial de tu hotel."
                />
                <FormularioContacto formId="landing-contacto" />
            </section>
        </div>
    );
}

export default LandingIsland;
