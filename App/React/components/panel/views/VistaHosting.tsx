/*
 * VistaHosting: Vista de hostings contratados.
 * Admin: ve todos los hostings con columna de cliente.
 * Cliente: ve solo sus hostings.
 */

import React, {useState} from 'react';
import {ResumenHostings} from './hosting/ResumenHostings';
import {ListaHostingsCliente} from './hosting/ListaHostingsCliente';
import {ModalCambiarPlan} from './hosting/ModalCambiarPlan';
import {usePanel} from '../../../context/PanelContext';
import {HostingContratado} from '../../../data/types/hosting';

export const VistaHosting: React.FC = () => {
    const {hostingsContratados, esVistaAdmin, clientes, actualizarHosting} = usePanel();
    const [modalVisible, setModalVisible] = useState(false);
    const [hostingSeleccionado, setHostingSeleccionado] = useState<HostingContratado | null>(null);

    const handleVerDetalle = (hosting: HostingContratado) => {
        /* TO-DO: Implementar vista de detalle expandido */
        console.log('Ver detalle de hosting:', hosting.dominio);
    };

    const handleCambiarPlan = (hosting: HostingContratado) => {
        setHostingSeleccionado(hosting);
        setModalVisible(true);
    };

    const confirmarCambioPlan = (nuevoPlan: 'mensual' | 'anual') => {
        if (hostingSeleccionado) {
            const hostingActualizado = {
                ...hostingSeleccionado,
                plan: nuevoPlan
            };
            actualizarHosting(hostingActualizado);
            console.log(`Plan cambiado a ${nuevoPlan} para ${hostingSeleccionado.dominio}`);
            setModalVisible(false);
            setHostingSeleccionado(null);
        }
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

            {/* Modales */}
            <ModalCambiarPlan hosting={hostingSeleccionado} visible={modalVisible} onCerrar={() => setModalVisible(false)} onConfirmar={confirmarCambioPlan} />
        </div>
    );
};
