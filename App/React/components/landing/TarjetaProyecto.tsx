import React from 'react';

/*
 * TarjetaProyecto: Tarjeta individual del grid de portafolio.
 * Muestra imagen, nombre y categoria con overlay al hover.
 */

export interface Proyecto {
    id: string;
    nombre: string;
    categoria: string;
    imagen: string;
    descripcion?: string;
}

interface TarjetaProyectoProps {
    proyecto: Proyecto;
    onClick?: (proyecto: Proyecto) => void;
}

export const TarjetaProyecto: React.FC<TarjetaProyectoProps> = ({proyecto, onClick}) => {
    const manejarClick = () => {
        if (onClick) {
            onClick(proyecto);
        }
    };

    return (
        <article className="tarjetaProyecto" onClick={manejarClick} role="button" tabIndex={0} onKeyDown={e => e.key === 'Enter' && manejarClick()} aria-label={`Ver proyecto ${proyecto.nombre}`}>
            <img src={proyecto.imagen} alt={proyecto.nombre} className="tarjetaImagen" loading="lazy" />
            <div className="tarjetaOverlay">
                <h3 className="tarjetaNombre">{proyecto.nombre}</h3>
                <span className="tarjetaCategoria">{proyecto.categoria}</span>
            </div>
        </article>
    );
};

export default TarjetaProyecto;
