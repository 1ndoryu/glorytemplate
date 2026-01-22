/*
 * ResumenDeuda: Muestra el total pendiente de pago de forma destacada.
 * Ubicación: components/panel/views/facturas/
 */

import React from 'react';
import {AlertCircle} from 'lucide-react';
import {Tarjeta} from '../../../ui/Tarjeta';

interface ResumenDeudaProps {
    totalPendiente: number;
    cantidadFacturas: number;
}

export const ResumenDeuda: React.FC<ResumenDeudaProps> = ({totalPendiente, cantidadFacturas}) => {
    const tieneDeuda = totalPendiente > 0;

    return (
        <Tarjeta className={`resumenDeuda ${tieneDeuda ? 'conDeuda' : 'sinDeuda'}`}>
            <div className="resumenDeudaIcono">{tieneDeuda ? <AlertCircle size={24} /> : <span className="checkIcono">✓</span>}</div>
            <div className="resumenDeudaContenido">
                <h3 className="resumenDeudaTitulo">{tieneDeuda ? 'Tienes pagos pendientes' : 'Estás al día'}</h3>
                <p className="resumenDeudaTexto">{tieneDeuda ? `${cantidadFacturas} factura${cantidadFacturas > 1 ? 's' : ''} pendiente${cantidadFacturas > 1 ? 's' : ''}` : 'No tienes facturas pendientes de pago'}</p>
            </div>
            <div className="resumenDeudaMonto">
                <span className="montoTotal">${totalPendiente.toFixed(2)}</span>
                {tieneDeuda && <span className="montoLabel">Pendiente</span>}
            </div>
        </Tarjeta>
    );
};
