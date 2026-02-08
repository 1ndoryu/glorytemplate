/**
 * Componente: SolucionPlaceholderIsland
 * Página placeholder "En construcción" para sub-páginas de soluciones.
 * Se reutiliza para /soluciones/hosting, /soluciones/vps, /soluciones/agentes-ia.
 */
import React from 'react';
import '../styles/variables.css';
import './SolucionPlaceholderIsland.css';
import {LayoutPagina} from '../components/layout/LayoutPagina';
import {SeccionContacto} from '../components/home/SeccionContacto';

interface SolucionPlaceholderIslandProps {
    titulo?: string;
    descripcion?: string;
}

export const SolucionPlaceholderIsland = ({
    titulo = 'Próximamente',
    descripcion = 'Estamos trabajando en esta solución. Pronto tendrás toda la información que necesitas.'
}: SolucionPlaceholderIslandProps): JSX.Element => {
    return (
        <LayoutPagina className="placeholderMain" id="paginaPlaceholder">
            <section className="placeholderHero">
                <div className="placeholderContenido">
                    <span className="placeholderEtiqueta">En construcción</span>
                    <h1 className="placeholderTitulo">{titulo}</h1>
                    <p className="placeholderDescripcion">{descripcion}</p>
                    <div className="placeholderBotones">
                        <a href="/soluciones" className="placeholderBoton">
                            ← Volver a Soluciones
                        </a>
                        <a href="#contacto" className="placeholderBotonContacto">
                            Contactar para más info
                        </a>
                    </div>
                </div>
            </section>
            <SeccionContacto />
        </LayoutPagina>
    );
};

export default SolucionPlaceholderIsland;
