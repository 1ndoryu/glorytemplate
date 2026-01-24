/*
 * ListaHostingsCliente: Grid de hostings contratados.
 * Soporta vista admin (con nombre de cliente) y vista cliente.
 */

import React from 'react';
import {TarjetaHostingCliente} from './TarjetaHostingCliente';
import {HostingContratado} from '../../../../data/types/hosting';

interface ListaHostingsClienteProps {
    hostings: HostingContratado[];
    onVerDetalle: (hosting: HostingContratado) => void;
    onCambiarPlan: (hosting: HostingContratado) => void;
    mostrarCliente?: boolean;
    obtenerNombreCliente?: (clienteId: string) => string;
    onPagar?: (hosting: HostingContratado) => void;
}

export const ListaHostingsCliente: React.FC<ListaHostingsClienteProps> = ({hostings, onVerDetalle, onCambiarPlan, mostrarCliente = false, obtenerNombreCliente, onPagar}) => {
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
                <TarjetaHostingCliente key={hosting.id} hosting={hosting} onVerDetalle={onVerDetalle} onCambiarPlan={onCambiarPlan} nombreCliente={mostrarCliente && obtenerNombreCliente ? obtenerNombreCliente(hosting.clienteId) : undefined} onPagar={onPagar} />
            ))}
        </div>
    );
};
