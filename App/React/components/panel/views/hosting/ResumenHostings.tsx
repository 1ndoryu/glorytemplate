/*
 * ResumenHostings: Muestra resumen de hostings con indicador de pago.
 */

import React from 'react';
import {Server, AlertCircle} from 'lucide-react';
import {Tarjeta} from '../../../ui/Tarjeta';
import {HostingContratado} from '../../../../data/types/hosting';

interface ResumenHostingsProps {
    hostings: HostingContratado[];
}

export const ResumenHostings: React.FC<ResumenHostingsProps> = ({hostings}) => {
    const totalHostings = hostings.length;
    const hostingsActivos = hostings.filter(h => h.estado === 'activo').length;
    const hostingsImpagos = hostings.filter(h => !h.pagado).length;

    return (
        <Tarjeta className="resumenHostings">
            <div className="resumenHostingsIcono">
                <Server size={24} />
            </div>
            <div className="resumenHostingsInfo">
                <h3 className="resumenHostingsTitulo">
                    {totalHostings} hosting{totalHostings !== 1 ? 's' : ''} contratado{totalHostings !== 1 ? 's' : ''}
                </h3>
                <p className="resumenHostingsDetalle">
                    {hostingsActivos} activo{hostingsActivos !== 1 ? 's' : ''}
                    {hostingsImpagos > 0 && (
                        <span className="hostingsImpagos">
                            <AlertCircle size={12} />
                            {hostingsImpagos} con pago pendiente
                        </span>
                    )}
                </p>
            </div>
        </Tarjeta>
    );
};
