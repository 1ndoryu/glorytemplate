/*
 * VistaHosting: Vista de hostings contratados.
 * Admin: ve todos los hostings con columna de cliente.
 * Cliente: ve solo sus hostings.
 */

import React from 'react';
import {ResumenHostings} from './hosting/ResumenHostings';
import {ListaHostingsCliente} from './hosting/ListaHostingsCliente';
import {usePanel} from '../../../context/PanelContext';
import {HostingContratado} from '../../../data/types/hosting';

export const VistaHosting: React.FC = () => {
    const {hostingsContratados, esVistaAdmin, clientes} = usePanel();

    const handleVerDetalle = (hosting: HostingContratado) => {
        /* TO-DO: Implementar vista de detalle expandido */
        console.log('Ver detalle de hosting:', hosting.dominio);
    };

    const handleCambiarPlan = (hosting: HostingContratado) => {
        /* TO-DO: Implementar modal de cambio de plan */
        console.log('Cambiar plan de hosting:', hosting.dominio, 'Plan actual:', hosting.plan);
    };

    /* Helper para obtener nombre del cliente */
    const obtenerNombreCliente = (clienteId: string): string => {
        const cliente = clientes.find(c => c.id === clienteId);
        return cliente?.nombre || 'Desconocido';
    };

    return (
        <div className="bloqueVista" id="vistaHosting">
            <header className="vistaHeader">
                <h2 className="vistaTitulo">{esVistaAdmin ? 'Todos los Hostings' : 'Mis Hostings'}</h2>
                <p className="vistaSubtitulo">{esVistaAdmin ? `Gestiona los hostings de todos los clientes (${hostingsContratados.length} total).` : 'Gestiona tus sitios web y planes de hosting.'}</p>
            </header>

            <ResumenHostings hostings={hostingsContratados} />

            <ListaHostingsCliente hostings={hostingsContratados} onVerDetalle={handleVerDetalle} onCambiarPlan={handleCambiarPlan} mostrarCliente={esVistaAdmin} obtenerNombreCliente={obtenerNombreCliente} />
        </div>
    );
};
