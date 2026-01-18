import React from 'react';
import {Tarjeta, Etiqueta} from '../ui';
import {Servicio} from './GridServicios';

/*
 * TarjetaServicio: Tarjeta de servicio para grid y carrusel.
 * Usa Tarjeta base pero mantiene clases CSS originales para
 * compatibilidad con estilos de landing.css.
 */

export interface TarjetaServicioProps {
    servicio: Servicio;
}

export const TarjetaServicio: React.FC<TarjetaServicioProps> = ({servicio}) => {
    return (
        <Tarjeta interactiva className="tarjetaServicio">
            <div className="servicioImagenContenedor">
                <img src={servicio.imagen} alt={servicio.nombre} className="servicioImagen" loading="lazy" />
            </div>
            <div className="servicioInfo">
                <h3 className="servicioNombre">{servicio.nombre}</h3>
                <p className="servicioDescripcion">{servicio.descripcionCorta}</p>
                <div className="servicioPrecio">
                    <Etiqueta variante="precio" tamano="xs">
                        Desde
                    </Etiqueta>
                    <span className="precioValor">${servicio.precioDesde.toLocaleString()}</span>
                </div>
            </div>
        </Tarjeta>
    );
};

export default TarjetaServicio;
