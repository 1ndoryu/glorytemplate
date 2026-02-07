/**
 * Componente: TarjetaServicio
 * Tarjeta individual de servicio con proporción 1:1.
 * Diseño inspirado en las tarjetas del carrusel showcase.
 */
import React from 'react';
import {Badge} from '../ui/Badge';
import './TarjetaServicio.css';

export interface ServicioData {
    id: string;
    titulo: string;
    descripcion: string;
    imagen: string;
    categorias: string[];
    link: string;
}

interface TarjetaServicioProps {
    servicio: ServicioData;
}

export const TarjetaServicio: React.FC<TarjetaServicioProps> = ({servicio}) => {
    return (
        <a href={servicio.link} className="tarjetaServicio">
            <div className="tarjetaImagenWrapper">
                <img src={servicio.imagen} alt={servicio.titulo} className="tarjetaImagen" loading="lazy" />
                <div className="tarjetaOverlay" />
            </div>
            <div className="tarjetaContenido">
                <h3 className="tarjetaTitulo">{servicio.titulo}</h3>
                <p className="tarjetaDescripcion">{servicio.descripcion}</p>
                <div className="tarjetaTags">
                    {servicio.categorias.map((cat, idx) => (
                        <Badge key={idx} label={cat} />
                    ))}
                </div>
            </div>
        </a>
    );
};
