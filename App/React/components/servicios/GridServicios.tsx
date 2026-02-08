/**
 * Componente: GridServicios
 * Grid de 3 columnas para mostrar las tarjetas de servicios.
 */
import React from 'react';
import {Servicio} from '../../types/servicios';
import {ServiceCard} from '../ui/ServiceCard';
import './GridServicios.css';

interface GridServiciosProps {
    servicios: Servicio[];
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
                <ServiceCard key={servicio.id} servicio={servicio} variant="detailed" />
            ))}
        </div>
    );
};
