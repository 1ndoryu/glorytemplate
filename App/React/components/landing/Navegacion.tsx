import React from 'react';
import {Boton} from '../ui';

/*
 * Navegacion: Barra de navegacion minimalista fija en la parte superior.
 * Los enlaces pueden ser internos (scroll) o externos.
 * Refactorizado para usar Boton del sistema UI.
 */

interface EnlaceNav {
    id: string;
    texto: string;
    href?: string;
    esExterno?: boolean;
}

interface NavegacionProps {
    enlaces?: EnlaceNav[];
    mostrarPanel?: boolean;
    onNavegar?: (id: string) => void;
}

const enlacesPorDefecto: EnlaceNav[] = [
    {id: 'inicio', texto: 'Inicio'},
    {id: 'servicios', texto: 'Servicios'},
    {id: 'proyectos', texto: 'Proyectos'},
    {id: 'apps', texto: 'Apps'},
    {id: 'nosotros', texto: 'Nosotros'}
];

export const Navegacion: React.FC<NavegacionProps> = ({enlaces = enlacesPorDefecto, mostrarPanel = false, onNavegar}) => {
    const manejarClick = (enlace: EnlaceNav) => {
        if (enlace.esExterno && enlace.href) {
            window.open(enlace.href, '_blank');
            return;
        }

        if (onNavegar) {
            onNavegar(enlace.id);
        } else {
            /* Scroll suave por defecto hacia el elemento con ese id */
            const elemento = document.getElementById(`seccion${enlace.id.charAt(0).toUpperCase() + enlace.id.slice(1)}`);
            if (elemento) {
                elemento.scrollIntoView({behavior: 'smooth'});
            }
        }
    };

    return (
        <nav id="navegacionPrincipal" className="navegacionPrincipal">
            <span className="navegacionLogo">nakomi</span>

            <ul className="navegacionEnlaces">
                {enlaces.map(enlace => (
                    <li key={enlace.id}>
                        <span className="navegacionEnlace" onClick={() => manejarClick(enlace)} role="button" tabIndex={0} onKeyDown={e => e.key === 'Enter' && manejarClick(enlace)}>
                            {enlace.texto}
                        </span>
                    </li>
                ))}

                {mostrarPanel && (
                    <li>
                        <a href="/panel" className="navegacionEnlace navegacionEnlaceActivo">
                            Panel
                        </a>
                    </li>
                )}
            </ul>

            <Boton href="/login" variante="solid" tamano="sm" className="navegacionBotonLogin">
                Login
            </Boton>
        </nav>
    );
};

export default Navegacion;
