/*
 * ListaHostingsCliente: Grid de hostings contratados del cliente.
 * Ubicación: components/panel/views/hosting/
 */

import React from 'react';
import {TarjetaHostingCliente} from './TarjetaHostingCliente';
import {HostingContratado} from '../../../../data/types/hosting';

interface ListaHostingsClienteProps {
    hostings: HostingContratado[];
    onVerDetalle: (hosting: HostingContratado) => void;
    onCambiarPlan: (hosting: HostingContratado) => void;
}

export const ListaHostingsCliente: React.FC<ListaHostingsClienteProps> = ({hostings, onVerDetalle, onCambiarPlan}) => {
    if (hostings.length === 0) {
        return (
            <div className="hostingsVacio">
                <p>No tienes hostings contratados.</p>
            </div>
        );
    }

    return (
        <div className="hostingsGrid">
            {hostings.map(hosting => (
                <TarjetaHostingCliente key={hosting.id} hosting={hosting} onVerDetalle={onVerDetalle} onCambiarPlan={onCambiarPlan} />
            ))}
        </div>
    );
};
