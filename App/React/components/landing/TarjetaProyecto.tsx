import React from 'react';
import {Tarjeta, TarjetaOverlay, Etiqueta, ImagenGlory} from '../ui';

/*
 * TarjetaProyecto: Tarjeta individual del grid de portafolio.
 * Muestra imagen, nombre y categoria con overlay al hover.
 * Refactorizado para usar sistema UI base.
 */

export interface Proyecto {
    id: string;
    nombre: string;
    categoria: string;
    imagen: string;
    imagenRef?: string;
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
        <Tarjeta interactiva ratio="16-10" className="tarjetaProyecto" onClick={manejarClick}>
            <ImagenGlory src={proyecto.imagenRef || proyecto.imagen} alt={proyecto.nombre} className="tarjetaImagen" variante="cover" />
            <TarjetaOverlay>
                <h3 className="tarjetaNombre">{proyecto.nombre}</h3>
                <Etiqueta variante="categoria" tamano="xs">
                    {proyecto.categoria}
                </Etiqueta>
            </TarjetaOverlay>
        </Tarjeta>
    );
};

export default TarjetaProyecto;
