/*
 * ContactoIsland - Pagina de contacto de Cosmo Revenue
 * Replica la estructura exacta de contact.php de App1.
 * Clases: contact-container, contact-info-section, contact-info-grid,
 * contact-info-card, info-icon, info-title, info-text
 */

import React from 'react';
import '@app/styles/init.css';
import '@app/styles/contact.css';

import { CosmoHeader } from '@app/components/layout/CosmoHeader';
import { PaginaHero } from '@app/components/layout/PaginaHero';
import { TarjetaInfo } from '@app/components/ui/TarjetaInfo';
import { FormularioContacto } from '@app/components/forms/FormularioContacto';
import { Marquee } from '@app/components/ui/Marquee';

export function ContactoIsland(): React.JSX.Element {
    return (
        <div className="contact-container" style={{ margin: 'unset', width: '100%', maxWidth: 'unset' }}>
            <CosmoHeader />

            <PaginaHero
                textoScript="Hablemos"
                textoPrincipal="CONTACTO"
                subtitulo="Estamos aquí para ayudarte a maximizar la rentabilidad de tu alojamiento. Cuéntanos tu proyecto y encontraremos la solución perfecta para ti."
            />

            {/* Info cards */}
            <section className="contact-info-section">
                <div className="contact-info-grid">
                    <TarjetaInfo
                        icono={
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                            </svg>
                        }
                        titulo="Email"
                        texto="hola@cosmorevenue.com"
                    />
                    <TarjetaInfo
                        icono={
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                            </svg>
                        }
                        titulo="Teléfono"
                        texto="+34 600 000 000"
                    />
                    <TarjetaInfo
                        icono={
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" />
                            </svg>
                        }
                        titulo="Ubicación"
                        texto="Comunidad Valenciana, España"
                    />
                </div>
            </section>

            {/* Formulario */}
            <div style={{ padding: '20px', backgroundColor: '#f9f9f9' }}>
                <FormularioContacto formId="contact-page" titulo="Enviar mensaje" />
            </div>

            {/* Marquee */}
            <Marquee texto="CONECTA CON NOSOTROS Y DESPEGA TU RENTABILIDAD" variante="light" className="contact-marquee" />
        </div>
    );
}

export default ContactoIsland;
