/**
 * Componente: SeccionClientes
 * Muestra una cuadricula de logos de clientes y una descripcion breve.
 * Sigue el estilo visual de la referencia (minimalista, logos en escala de grises).
 */
import React from 'react';
import './SeccionClientes.css';

// Importacion dinamica de imagenes (logos) usando Vite
const modulosLogos = import.meta.glob('../../../../Glory/assets/images/logos/*.svg', {
    eager: true,
    query: '?url',
    import: 'default'
});

const LOGOS_CLIENTES = Object.values(modulosLogos) as string[];

export const SeccionClientes: React.FC = () => {
    // Si no hay logos, no mostrar la seccion o mostrar fallback
    if (LOGOS_CLIENTES.length === 0) return null;

    return (
        <section className="seccionClientes" id="seccionClientes">
            <div className="clientesContenedor">
                {/* Header: Titulo y Boton de "Our Work" */}
                <header className="clientesHeader">
                    <span className="clientesTitulo">Clients this year</span>

                    <a href="/work" className="clientesBotonBox" aria-label="Ver nuestro trabajo">
                        <div className="clientesBotonIcono">
                            {/* Icono simple de ojo o similar */}
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M1 12C1 12 5 4 12 4C19 4 23 12 23 12C23 12 19 20 12 20C5 20 1 12 1 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                        <div className="clientesBotonTexto">
                            <span className="clientesBotonTitulo">Our work</span>
                            <span className="clientesBotonSubtitulo">See all of our work</span>
                        </div>
                    </a>
                </header>

                {/* Grid de Logos */}
                <div className="clientesGrid">
                    {LOGOS_CLIENTES.map((src, index) => (
                        <div key={`logo-${index}`} className="clienteLogoCard">
                            <img src={src} alt={`Cliente ${index + 1}`} className="clienteLogoImg" loading="lazy" />
                        </div>
                    ))}
                </div>

                {/* Footer: Texto descriptivo */}
                <footer className="clientesFooter">
                    <p className="clientesDescripcion">With over a decade of experience in the industry, we take pride in our journey so far. Over the years, we have successfully completed over 300 projects, each one leaving a mark in the landscape.</p>
                </footer>
            </div>
        </section>
    );
};
