/**
 * Componente: SeccionClientes
 * Muestra una cuadricula de logos de clientes y una descripcion breve.
 * Sigue el estilo visual de la referencia (minimalista, logos en escala de grises).
 */
import React from 'react';
import {SeccionHeader} from '../ui/SeccionHeader';
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
                {/* Header reutilizable */}
                <SeccionHeader titulo="Ultimos clientes" />

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
                    <p className="clientesDescripcion">Cada proyecto es una oportunidad para crear algo único. Trabajamos de cerca con nuestros clientes para entender sus necesidades y transformarlas en soluciones digitales que destacan.</p>
                </footer>
            </div>
        </section>
    );
};
