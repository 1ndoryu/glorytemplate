import React from 'react';
import {Servicio} from './GridServicios';

export interface TarjetaServicioProps {
    servicio: Servicio;
}

export const TarjetaServicio: React.FC<TarjetaServicioProps> = ({servicio}) => {
    return (
        <article className="tarjetaServicio">
            <div className="servicioImagenContenedor">
                <img src={servicio.imagen} alt={servicio.nombre} className="servicioImagen" loading="lazy" />
            </div>
            <div className="servicioInfo">
                <h3 className="servicioNombre">{servicio.nombre}</h3>
                <p className="servicioDescripcion">{servicio.descripcionCorta}</p>
                <div className="servicioPrecio">
                    <span className="precioEtiqueta">Desde</span>
                    <span className="precioValor">${servicio.precioDesde.toLocaleString()}</span>
                </div>
            </div>
        </article>
    );
};

export default TarjetaServicio;
