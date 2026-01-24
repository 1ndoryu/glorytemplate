/*
 * ListaDominios: Grid vertical de dominios contratados.
 * Soporta vista admin (con nombre de cliente) y vista cliente.
 */

import React from 'react';
import {TarjetaDominio} from './TarjetaDominio';
import {DominioContratado} from '../../../../data/types/dominio';

interface ListaDominiosProps {
    dominios: DominioContratado[];
    onRenovar: (dominio: DominioContratado) => void;
    onPagar?: (dominio: DominioContratado) => void;
    mostrarCliente?: boolean;
    obtenerNombreCliente?: (clienteId: string) => string;
}

export const ListaDominios: React.FC<ListaDominiosProps> = ({dominios, onRenovar, onPagar, mostrarCliente = false, obtenerNombreCliente}) => {
    if (dominios.length === 0) {
        return (
            <div className="dominiosVacio">
                <p>No tienes dominios contratados.</p>
            </div>
        );
    }

    return (
        <div className="dominiosGrid">
            {dominios.map(dominio => (
                <TarjetaDominio key={dominio.id} dominio={dominio} onRenovar={onRenovar} onPagar={onPagar} nombreCliente={mostrarCliente && obtenerNombreCliente ? obtenerNombreCliente(dominio.clienteId) : undefined} />
            ))}
        </div>
    );
};
