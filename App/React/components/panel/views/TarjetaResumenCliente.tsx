import React from 'react';
import {TarjetaResumen} from '../ui/TarjetaResumen';

interface TarjetaResumenClienteProps {
    etiqueta: string;
    valor: string | number;
    valorDestacado?: boolean;
    accion?: React.ReactNode;
}

export const TarjetaResumenCliente: React.FC<TarjetaResumenClienteProps> = ({etiqueta, valor, valorDestacado, accion}) => <TarjetaResumen etiqueta={etiqueta} valor={valor} variante={valorDestacado ? 'error' : 'neutro'} accion={accion} />;
