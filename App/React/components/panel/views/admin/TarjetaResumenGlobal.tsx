/*
 * TarjetaResumenGlobal: Muestra una estadística del dashboard admin.
 * Usada para métricas como clientes, ingresos, facturas, etc.
 */

import React from 'react';
import {LucideIcon} from 'lucide-react';
import {Tarjeta} from '../../../ui/Tarjeta';

export interface DatosResumenGlobal {
    etiqueta: string;
    valor: string | number;
    subtexto?: string;
    icono: LucideIcon;
    variante: 'primario' | 'exito' | 'alerta' | 'error';
}

interface TarjetaResumenGlobalProps {
    datos: DatosResumenGlobal;
}

export const TarjetaResumenGlobal: React.FC<TarjetaResumenGlobalProps> = ({datos}) => {
    const {etiqueta, valor, subtexto, icono: Icono, variante} = datos;

    return (
        <Tarjeta className="tarjetaResumenAdmin">
            <div className={`resumenIconoAdmin resumenIcono--${variante}`}>
                <Icono size={20} />
            </div>
            <div className="resumenContenidoAdmin">
                <span className="resumenEtiquetaAdmin">{etiqueta}</span>
                <span className="resumenValorAdmin">{valor}</span>
                {subtexto && <span className="resumenSubtextoAdmin">{subtexto}</span>}
            </div>
        </Tarjeta>
    );
};
