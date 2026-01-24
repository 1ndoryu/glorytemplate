/*
 * TablaClientes: Lista de clientes para el dashboard admin.
 * Muestra nombre, email, deuda pendiente, servicios activos.
 */

import React from 'react';
import {Eye, Mail, ChevronRight} from 'lucide-react';
import {Tarjeta} from '../../../ui/Tarjeta';
import {Boton} from '../../../ui/Boton';
import {Etiqueta} from '../../../ui/Etiqueta';
import {Cliente} from '../../../../data/types/cliente';

export interface ClienteConResumen extends Cliente {
    deudaPendiente: number;
    serviciosActivos: number;
    hostingsActivos: number;
}

interface TablaClientesProps {
    clientes: ClienteConResumen[];
    onVerCliente?: (cliente: ClienteConResumen) => void;
    onEnviarRecordatorio?: (cliente: ClienteConResumen) => void;
}

export const TablaClientes: React.FC<TablaClientesProps> = ({clientes, onVerCliente, onEnviarRecordatorio}) => {
    if (clientes.length === 0) {
        return (
            <Tarjeta className="tablaVacia">
                <p>No hay clientes registrados.</p>
            </Tarjeta>
        );
    }

    return (
        <div className="tablaClientes">
            <div className="tablaClientesEncabezado">
                <span className="columnaNombre">Cliente</span>
                <span className="columnaDeuda">Deuda</span>
                <span className="columnaServicios">Servicios</span>
                <span className="columnaAcciones">Acciones</span>
            </div>

            {clientes.map(cliente => (
                <Tarjeta key={cliente.id} className="filaCliente">
                    <div className="clienteInfo">
                        <div className="clienteAvatar">{cliente.nombre.charAt(0)}</div>
                        <div className="clienteDatos">
                            <span className="clienteNombre">{cliente.nombre}</span>
                            <span className="clienteEmail">{cliente.email}</span>
                        </div>
                    </div>

                    <div className="clienteDeuda">{cliente.deudaPendiente > 0 ? <Etiqueta variante="alerta">${cliente.deudaPendiente.toFixed(2)}</Etiqueta> : <Etiqueta variante="exito">Al día</Etiqueta>}</div>

                    <div className="clienteServicios">
                        <span className="serviciosContador">{cliente.serviciosActivos} servicios</span>
                        <span className="hostingsContador">{cliente.hostingsActivos} hostings</span>
                    </div>

                    <div className="clienteAcciones">
                        {cliente.deudaPendiente > 0 && onEnviarRecordatorio && (
                            <Boton variante="ghost" tamano="sm" onClick={() => onEnviarRecordatorio(cliente)}>
                                <Mail size={14} />
                            </Boton>
                        )}
                        {onVerCliente && (
                            <Boton variante="outline" tamano="sm" onClick={() => onVerCliente(cliente)}>
                                <Eye size={14} />
                                <span>Ver</span>
                            </Boton>
                        )}
                    </div>
                </Tarjeta>
            ))}
        </div>
    );
};
