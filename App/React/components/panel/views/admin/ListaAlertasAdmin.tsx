/*
 * ListaAlertasAdmin: Muestra alertas importantes para el administrador.
 * Tipos: facturas vencidas, hostings impagos, dominios por expirar.
 */

import React from 'react';
import {AlertTriangle, CreditCard, Server, Globe} from 'lucide-react';
import {Tarjeta} from '../../../ui/Tarjeta';
import {LucideIcon} from 'lucide-react';

export type TipoAlerta = 'factura_vencida' | 'hosting_impago' | 'dominio_expira';

export interface AlertaAdmin {
    id: string;
    tipo: TipoAlerta;
    titulo: string;
    descripcion: string;
    clienteNombre?: string;
    monto?: number;
    fechaLimite?: string;
}

interface ListaAlertasAdminProps {
    alertas: AlertaAdmin[];
}

const iconosPorTipo: Record<TipoAlerta, LucideIcon> = {
    factura_vencida: CreditCard,
    hosting_impago: Server,
    dominio_expira: Globe
};

const clasesPorTipo: Record<TipoAlerta, string> = {
    factura_vencida: 'alertaError',
    hosting_impago: 'alertaWarning',
    dominio_expira: 'alertaInfo'
};

export const ListaAlertasAdmin: React.FC<ListaAlertasAdminProps> = ({alertas}) => {
    if (alertas.length === 0) {
        return (
            <Tarjeta className="sinAlertas">
                <span className="iconoExito">✓</span>
                <p>No hay alertas pendientes</p>
            </Tarjeta>
        );
    }

    return (
        <div className="listaAlertas">
            {alertas.map(alerta => {
                const Icono = iconosPorTipo[alerta.tipo];
                const claseAlerta = clasesPorTipo[alerta.tipo];

                return (
                    <Tarjeta key={alerta.id} className={`alertaItem ${claseAlerta}`}>
                        <div className="alertaIcono">
                            <Icono size={16} />
                        </div>
                        <div className="alertaContenido">
                            <span className="alertaTitulo">{alerta.titulo}</span>
                            <span className="alertaDescripcion">
                                {alerta.descripcion}
                                {alerta.clienteNombre && <span className="alertaCliente"> - {alerta.clienteNombre}</span>}
                            </span>
                        </div>
                        {alerta.monto && <span className="alertaMonto">${alerta.monto.toFixed(2)}</span>}
                    </Tarjeta>
                );
            })}
        </div>
    );
};
