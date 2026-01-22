/*
 * VistaHosting: Vista de hostings contratados del cliente.
 * Muestra los sitios web activos sin datos técnicos de Coolify.
 */

import React from 'react';
import {ResumenHostings} from './hosting/ResumenHostings';
import {ListaHostingsCliente} from './hosting/ListaHostingsCliente';
import {usePanel} from '../../../context/PanelContext';
import {HostingContratado} from '../../../data/types/hosting';

export const VistaHosting: React.FC = () => {
    const {hostingsContratados} = usePanel();

    const handleVerDetalle = (hosting: HostingContratado) => {
        /* TO-DO: Implementar vista de detalle expandido */
        console.log('Ver detalle de hosting:', hosting.dominio);
    };

    const handleCambiarPlan = (hosting: HostingContratado) => {
        /* TO-DO: Implementar modal de cambio de plan */
        console.log('Cambiar plan de hosting:', hosting.dominio, 'Plan actual:', hosting.plan);
    };

    return (
        <div className="bloqueVista" id="vistaHosting">
            <header className="vistaHeader">
                <h2 className="vistaTitulo">Mis Hostings</h2>
                <p className="vistaSubtitulo">Gestiona tus sitios web y planes de hosting.</p>
            </header>

            <ResumenHostings hostings={hostingsContratados} />

            <ListaHostingsCliente hostings={hostingsContratados} onVerDetalle={handleVerDetalle} onCambiarPlan={handleCambiarPlan} />
        </div>
    );
};
