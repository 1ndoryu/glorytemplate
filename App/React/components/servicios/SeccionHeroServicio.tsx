/**
 * Componente: SeccionHeroServicio
 * Descripcion: Hero tradicional para la pagina individual de servicio.
 * Muestra titulo y descripcion sin elementos visuales complejos.
 */
import React from 'react';
import './SeccionHeroServicio.css';

interface SeccionHeroServicioProps {
    titulo?: string;
    descripcion?: string;
}

export const SeccionHeroServicio = ({titulo = 'Nombre del Servicio', descripcion = 'Descripcion detallada del servicio y como aportamos valor a traves de nuestra experiencia y metodologia.'}: SeccionHeroServicioProps): JSX.Element => {
    return (
        <section className="heroServicio">
            <div className="heroServicioContenedor">
                <div>
                    <h1 className="heroServicioTitulo">{titulo}</h1>
                </div>
                <div className="heroServicioDescripcionWrapper">
                    <p className="heroServicioDescripcion">{descripcion}</p>
                </div>
            </div>
        </section>
    );
};
