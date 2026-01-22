/*
 * ListaDominios: Grid vertical de dominios contratados del cliente.
 * Ubicación: components/panel/views/dominios/
 */

import React from 'react';
import {TarjetaDominio} from './TarjetaDominio';
import {DominioContratado} from '../../../../data/types/dominio';

interface ListaDominiosProps {
    dominios: DominioContratado[];
    onRenovar: (dominio: DominioContratado) => void;
}

export const ListaDominios: React.FC<ListaDominiosProps> = ({dominios, onRenovar}) => {
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
                <TarjetaDominio key={dominio.id} dominio={dominio} onRenovar={onRenovar} />
            ))}
        </div>
    );
};
