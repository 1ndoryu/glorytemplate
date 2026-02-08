/**
 * Componente: SeccionServicios
 * Muestra una lista de servicios ofrecidos con imágenes y enlaces.
 * Diseño minimalista con tipografía grande.
 */
import React from 'react';
import {SeccionHeader} from '../ui/SeccionHeader';
import {ServiceCard} from '../ui/ServiceCard';
import {SERVICIOS_PRINCIPALES} from '../../data/servicios';
import './SeccionServicios.css';

export const SeccionServicios: React.FC = () => {
    return (
        <section className="seccionServicios" id="servicios">
            <div className="serviciosContenedor">
                <SeccionHeader titulo="Services" />
                <div className="serviciosLista">
                    {SERVICIOS_PRINCIPALES.map(servicio => (
                        <ServiceCard key={servicio.id} servicio={servicio} variant="simple" />
                    ))}
                </div>
            </div>
        </section>
    );
};
