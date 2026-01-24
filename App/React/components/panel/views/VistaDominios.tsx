/*
 * VistaDominios: Vista de dominios contratados.
 * Admin: ve todos los dominios con columna de cliente.
 * Cliente: ve solo sus dominios.
 */

import React from 'react';
import {ResumenDominios} from './dominios/ResumenDominios';
import {ListaDominios} from './dominios/ListaDominios';
import {usePanel} from '../../../context/PanelContext';
import {DominioContratado} from '../../../data/types/dominio';

export const VistaDominios: React.FC = () => {
    const {dominiosContratados, esVistaAdmin, clientes} = usePanel();

    const handleRenovar = (dominio: DominioContratado) => {
        /* TO-DO: Implementar flujo de renovación de dominio */
        console.log('Renovar dominio:', dominio.nombre);
    };

    const handlePagar = (dominio: DominioContratado) => {
        /* TO-DO: Integrar con Stripe para pago real (Fase 5) */
        console.log('Pagar dominio:', dominio.nombre, '$' + dominio.precioAnual);
    };

    /* Helper para obtener nombre del cliente */
    const obtenerNombreCliente = (clienteId: string): string => {
        const cliente = clientes.find(c => c.id === clienteId);
        return cliente?.nombre || 'Desconocido';
    };

    return (
        <div className="bloqueVista" id="vistaDominios">
            <header className="vistaHeader">
                <h2 className="vistaTitulo">{esVistaAdmin ? 'Todos los Dominios' : 'Mis Dominios'}</h2>
                <p className="vistaSubtitulo">{esVistaAdmin ? `Gestiona los dominios de todos los clientes (${dominiosContratados.length} total).` : 'Gestiona tus dominios registrados y renovaciones.'}</p>
            </header>

            <ResumenDominios dominios={dominiosContratados} />

            <ListaDominios dominios={dominiosContratados} onRenovar={handleRenovar} onPagar={handlePagar} mostrarCliente={esVistaAdmin} obtenerNombreCliente={obtenerNombreCliente} />
        </div>
    );
};
