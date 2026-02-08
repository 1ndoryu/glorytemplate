/**
 * Componente: SeccionClientes
 * Muestra una cuadrícula de logos de clientes.
 * Imágenes centralizadas en hooks/useImagenes.ts (DRY).
 */
import React from 'react';
import {SeccionHeader} from '../ui/SeccionHeader';
import {LOGOS_CLIENTES} from '../../hooks/useImagenes';
import './SeccionClientes.css';

export const SeccionClientes: React.FC = () => {
    if (LOGOS_CLIENTES.length === 0) return null;

    return (
        <section className="seccionClientes" id="seccionClientes">
            <div className="clientesContenedor">
                <SeccionHeader titulo="Ultimos clientes" />

                <div className="clientesGrid">
                    {LOGOS_CLIENTES.map((src, index) => (
                        <div key={`logo-${index}`} className="clienteLogoCard">
                            <img src={src} alt={`Cliente ${index + 1}`} className="clienteLogoImg" loading="lazy" />
                        </div>
                    ))}
                </div>

                <footer className="clientesFooter">
                    <p className="clientesDescripcion">Cada proyecto es una oportunidad para crear algo único. Trabajamos de cerca con nuestros clientes para entender sus necesidades y transformarlas en soluciones digitales que destacan.</p>
                </footer>
            </div>
        </section>
    );
};
