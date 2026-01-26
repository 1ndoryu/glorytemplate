/*
 * VistaClientesAdmin: Gestión de clientes.
 * Muestra la lista completa de clientes.
 */
import React from 'react';
import {CabeceraVista} from '../../ui/CabeceraVista';
import {SeccionPanel} from '../../ui/SeccionPanel';
import {TablaClientes} from './TablaClientes';
import {useClientesAdmin} from './hooks/useClientesAdmin';

export const VistaClientesAdmin: React.FC = () => {
    const {clientesConResumen} = useClientesAdmin();

    return (
        <div className="bloqueVista animate-fade-in" id="vistaClientesAdmin">
            <CabeceraVista titulo="Clientes" subtitulo="Gestión de usuarios y sus estados" />

            <SeccionPanel titulo="Lista de clientes">
                <TablaClientes clientes={clientesConResumen} />
            </SeccionPanel>
        </div>
    );
};
