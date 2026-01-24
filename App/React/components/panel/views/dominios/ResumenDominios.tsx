/*
 * ResumenDominios: Muestra resumen de dominios con indicadores de expiración y pago.
 */

import React from 'react';
import {Globe, AlertCircle, CreditCard} from 'lucide-react';
import {Tarjeta} from '../../../ui/Tarjeta';
import {DominioContratado} from '../../../../data/types/dominio';

interface ResumenDominiosProps {
    dominios: DominioContratado[];
}

export const ResumenDominios: React.FC<ResumenDominiosProps> = ({dominios}) => {
    const totalDominios = dominios.length;
    const dominiosActivos = dominios.filter(d => d.estado === 'activo').length;

    /* Dominios que expiran en los próximos 30 días */
    const dominiosProxExp = dominios.filter(d => {
        const hoy = new Date();
        const expiracion = new Date(d.fechaExpiracion);
        const diasRestantes = Math.ceil((expiracion.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
        return diasRestantes <= 30 && diasRestantes > 0 && !d.renovacionAutomatica;
    }).length;

    /* Dominios con pago pendiente */
    const dominiosImpagos = dominios.filter(d => !d.pagado);
    const totalImpago = dominiosImpagos.reduce((acc, d) => acc + d.precioAnual, 0);

    return (
        <Tarjeta className="resumenDominios">
            <div className="resumenDominiosIcono">
                <Globe size={24} />
            </div>
            <div className="resumenDominiosInfo">
                <h3 className="resumenDominiosTitulo">
                    {totalDominios} dominio{totalDominios !== 1 ? 's' : ''} registrado{totalDominios !== 1 ? 's' : ''}
                </h3>
                <p className="resumenDominiosDetalle">
                    {dominiosActivos} activo{dominiosActivos !== 1 ? 's' : ''}
                    {dominiosImpagos.length > 0 && (
                        <span className="dominiosPendientePago">
                            <CreditCard size={12} />
                            {dominiosImpagos.length} con pago pendiente (${totalImpago})
                        </span>
                    )}
                    {dominiosProxExp > 0 && (
                        <span className="dominiosProxExp">
                            <AlertCircle size={12} />
                            {dominiosProxExp} por expirar
                        </span>
                    )}
                </p>
            </div>
        </Tarjeta>
    );
};
