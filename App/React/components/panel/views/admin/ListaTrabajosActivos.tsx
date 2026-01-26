/*
 * ListaTrabajosActivos: Muestra servicios en progreso para el admin.
 * Incluye barra de progreso, cliente asignado y acciones.
 */

import React from 'react';
import {Clock} from 'lucide-react';
import {Tarjeta} from '../../../ui/Tarjeta';
import {ServicioContratado} from '../../../../data/types/servicio';
import {TarjetaServicioContratado} from '../servicios/TarjetaServicioContratado';

interface ListaTrabajosActivosProps {
    trabajos: ServicioContratado[];
    onVerDetalle?: (trabajo: ServicioContratado) => void;
    onMarcarCompletado?: (trabajo: ServicioContratado) => void;
}

export const ListaTrabajosActivos: React.FC<ListaTrabajosActivosProps> = ({trabajos, onVerDetalle, onMarcarCompletado}) => {
    if (trabajos.length === 0) {
        return (
            <Tarjeta className="listaVacia">
                <Clock size={24} className="iconoVacio" />
                <p>No hay trabajos activos.</p>
            </Tarjeta>
        );
    }

    return (
        <Tarjeta className="listaTrabajosActivos contenedorLista p-0">
            {trabajos.map(trabajo => (
                <TarjetaServicioContratado key={trabajo.id} servicio={trabajo} onVerDetalles={onVerDetalle} onMarcarCompletado={onMarcarCompletado} />
            ))}
        </Tarjeta>
    );
};
