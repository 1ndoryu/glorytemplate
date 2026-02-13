/*
 * CasosIsland - Pagina de casos de éxito de Cosmo Revenue
 * Secciones: Hero, Grid de casos, Cita testimonial, CTA
 */

import React from 'react';
import '@app/styles/variables.css';
import '@app/styles/global.css';
import '@app/styles/casos.css';
import '@app/styles/landing.css';

import { CosmoHeader } from '@app/components/layout/CosmoHeader';
import { PaginaHero } from '@app/components/layout/PaginaHero';
import { Marquee } from '@app/components/ui/Marquee';
import { BloqueCita } from '@app/components/ui/BloqueCita';
import { TarjetaCaso } from '@app/components/cosmo/TarjetaCaso';
import { useCasos } from '@app/hooks/useCasos';

const textosMarquee = [
    'Resultados Reales',
    'Revenue Management',
    'Hoteles Transformados',
    'Rentabilidad Comprobada',
];

export function CasosIsland(): React.JSX.Element {
    const { casos, cargando } = useCasos();

    return (
        <div className="contenedorCasosPage" id="casosCosmo">
            <CosmoHeader />
            <PaginaHero
                titulo="Casos de"
                tituloScript="Éxito"
                subtitulo="Resultados reales de hoteles que han confiado en nuestra metodología."
            />

            <Marquee textos={textosMarquee} variante="dark" />

            {/* Grid de casos */}
            <section className="seccionCasos" id="gridCasos">
                {cargando ? (
                    <p style={{ textAlign: 'center', padding: '2rem' }}>Cargando casos...</p>
                ) : (
                    <div className="gridCasos">
                        {casos.map((caso) => (
                            <TarjetaCaso key={caso.id} caso={caso} />
                        ))}
                    </div>
                )}
            </section>

            {/* Cita testimonial */}
            <BloqueCita
                texto="La estrategia de revenue management no es un lujo, es una necesidad. Cada hotel tiene un potencial de ingresos que solo se desbloquea con los datos correctos y las decisiones adecuadas."
                autor="— Equipo Cosmo Revenue"
            />

            {/* CTA */}
            <section className="ctaCasos" id="ctaCasos">
                <h2 className="tituloCta">¿Tu hotel es el próximo?</h2>
                <p className="textoCta">
                    Descubre cómo podemos transformar la rentabilidad de tu alojamiento
                    con nuestra metodología probada.
                </p>
                <a href="/contacto/" className="botonCta">
                    Solicitar auditoría gratuita
                </a>
            </section>
        </div>
    );
}

export default CasosIsland;
