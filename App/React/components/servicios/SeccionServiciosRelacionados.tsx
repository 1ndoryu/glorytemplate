/**
 * Componente: SeccionServiciosRelacionados
 * Descripcion: Muestra 3 servicios relacionados para continuar navegacion.
 */
import React from 'react';
import {SeccionHeader} from '../ui/SeccionHeader';
import {ServiceCard} from '../ui/ServiceCard';
import {SERVICIOS_RELACIONADOS} from '../../data/servicios';
import './SeccionServiciosRelacionados.css';

export const SeccionServiciosRelacionados: React.FC = () => {
    return (
        <section className="seccionServiciosRelacionados">
            <div className="relacionadosContenedor">
                {/* Título ligero sobre fondo claro */}
                <SeccionHeader titulo="More Services" />

                <div className="relacionadosLista">
                    {SERVICIOS_RELACIONADOS.map(servicio => (
                        <ServiceCard key={servicio.id} servicio={servicio} variant="simple" />
                    ))}
                </div>
            </div>
        </section>
    );
};
