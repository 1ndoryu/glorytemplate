/*
 * VistaServicios: Vista de servicios contratados por el cliente.
 * Muestra servicios en progreso y completados.
 */

import React from 'react';
import {TarjetaServicioContratado} from './servicios/TarjetaServicioContratado';
import {usePanel} from '../../../context/PanelContext';

export const VistaServicios: React.FC = () => {
    const {serviciosContratados} = usePanel();

    const serviciosEnProgreso = serviciosContratados.filter(s => s.estado === 'pendiente' || s.estado === 'en_progreso');
    const serviciosCompletados = serviciosContratados.filter(s => s.estado === 'completado');

    return (
        <div className="bloqueVista" id="vistaServicios">
            <header className="vistaHeader">
                <h2 className="vistaTitulo">Mis Servicios</h2>
                <p className="vistaSubtitulo">Servicios contratados y su estado actual.</p>
            </header>

            {serviciosEnProgreso.length > 0 && (
                <section className="serviciosSeccion">
                    <h3 className="serviciosSeccionTitulo">En progreso</h3>
                    <div className="serviciosLista">
                        {serviciosEnProgreso.map(servicio => (
                            <TarjetaServicioContratado key={servicio.id} servicio={servicio} />
                        ))}
                    </div>
                </section>
            )}

            {serviciosCompletados.length > 0 && (
                <section className="serviciosSeccion">
                    <h3 className="serviciosSeccionTitulo">Completados</h3>
                    <div className="serviciosLista">
                        {serviciosCompletados.map(servicio => (
                            <TarjetaServicioContratado key={servicio.id} servicio={servicio} />
                        ))}
                    </div>
                </section>
            )}

            {serviciosContratados.length === 0 && (
                <div className="serviciosVacio">
                    <p>No tienes servicios contratados.</p>
                </div>
            )}
        </div>
    );
};
