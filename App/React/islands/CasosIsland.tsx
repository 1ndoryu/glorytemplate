/*
 * CasosIsland - Pagina de casos de éxito de Cosmo Revenue
 * Replica la estructura exacta de casos.php de App1.
 * Clases: casos-container, cases-section, cases-wrapper, cases-grid,
 * quote-section, casos-cta, cta-title, cta-text, btn-cta
 */

import React from 'react';
import '@app/styles/init.css';
import '@app/styles/casos.css';
import '@app/styles/landing.css';

import { CosmoHeader } from '@app/components/layout/CosmoHeader';
import { PaginaHero } from '@app/components/layout/PaginaHero';
import { Marquee } from '@app/components/ui/Marquee';
import { BloqueCita } from '@app/components/ui/BloqueCita';
import { TarjetaCaso } from '@app/components/cosmo/TarjetaCaso';
import { useCasos } from '@app/hooks/useCasos';

export function CasosIsland(): React.JSX.Element {
    const { casos, cargando } = useCasos();

    return (
        <div className="casos-container">
            <CosmoHeader />

            <PaginaHero
                textoScript="Casos"
                textoPrincipal="DE EXITO"
                subtitulo="Descubre algunos ejemplos reales del impacto de nuestras estrategias de Revenue Management en diferentes tipologías de hoteles."
            />

            {/* Grid de casos */}
            <section className="cases-section">
                <div className="cases-wrapper">
                    {cargando ? (
                        <p style={{ textAlign: 'center', padding: '2rem' }}>Cargando casos...</p>
                    ) : (
                        <div className="cases-grid">
                            {casos.map((caso) => (
                                <TarjetaCaso key={caso.id} caso={caso} />
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* Cita testimonial */}
            <BloqueCita
                texto="&quot;Estos ejemplos reflejan cómo una gestión estratégica de precios, distribución y posicionamiento puede transformar los resultados de cualquier hotel.&quot;"
                autor="Adaptándonos siempre a su mercado y objetivos específicos."
            />

            {/* CTA */}
            <section className="casos-cta">
                <h2 className="cta-title">¿Listo para escribir tu caso de éxito?</h2>
                <p className="cta-text">Analicemos el potencial oculto de tu alojamiento. Empieza con una auditoría o una consulta estratégica hoy mismo.</p>
                <a href="/contacto/" className="btn-cta">Contactar</a>
            </section>
        </div>
    );
}

export default CasosIsland;
