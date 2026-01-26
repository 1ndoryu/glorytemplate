/*
 * TarjetaResumenGlobal: Muestra una estadística del dashboard admin.
 * Usada para métricas como clientes, ingresos, facturas, etc.
 */

import React from 'react';
import {LucideIcon} from 'lucide-react';
import {TarjetaResumen} from '../../ui/TarjetaResumen';

export interface DatosResumenGlobal {
    etiqueta: string;
    valor: string | number;
    subtexto?: string;
    icono?: LucideIcon;
    variante: 'primario' | 'exito' | 'alerta' | 'error';
}

interface TarjetaResumenGlobalProps {
    datos: DatosResumenGlobal;
}

export const TarjetaResumenGlobal: React.FC<TarjetaResumenGlobalProps> = ({datos}) => {
    return <TarjetaResumen etiqueta={datos.etiqueta} valor={datos.valor} subtexto={datos.subtexto} icono={datos.icono} variante={datos.variante} />;
};
