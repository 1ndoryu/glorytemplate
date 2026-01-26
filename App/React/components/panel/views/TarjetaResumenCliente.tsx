import React from 'react';
import {Tarjeta} from '../../ui/Tarjeta';
import {Boton} from '../../ui/Boton';

interface TarjetaResumenClienteProps {
    etiqueta: string;
    valor: string | number;
    valorDestacado?: boolean;
    accion?: React.ReactNode;
}

export const TarjetaResumenCliente: React.FC<TarjetaResumenClienteProps> = ({etiqueta, valor, valorDestacado, accion}) => (
    <Tarjeta className="tarjetaResumen">
        <div className="resumenContenido">
            <span className="resumenEtiqueta">{etiqueta}</span>
            <span className={`resumenValor ${valorDestacado ? 'valorAlerta' : ''}`}>{valor}</span>
        </div>
        {accion}
    </Tarjeta>
);
