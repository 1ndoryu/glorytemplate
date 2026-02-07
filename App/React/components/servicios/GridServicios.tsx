/**
 * Componente: GridServicios
 * Grid de 3 columnas para mostrar las tarjetas de servicios.
 */
import React from 'react';
import {TarjetaServicio, ServicioData} from './TarjetaServicio';
import './GridServicios.css';

interface GridServiciosProps {
    servicios: ServicioData[];
}

export const GridServicios: React.FC<GridServiciosProps> = ({servicios}) => {
    if (servicios.length === 0) {
        return (
            <div className="gridVacio">
                <p className="gridVacioTexto">No se encontraron servicios</p>
            </div>
        );
    }

    return (
        <div className="gridServicios">
            {servicios.map(servicio => (
                <TarjetaServicio key={servicio.id} servicio={servicio} />
            ))}
        </div>
    );
};
