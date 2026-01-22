/*
 * TarjetaDominio: Muestra un dominio contratado del cliente.
 * Vista simplificada con información de expiración y renovación.
 */

import React from 'react';
import {Globe, AlertCircle, CheckCircle, Clock, RefreshCw} from 'lucide-react';
import {Tarjeta} from '../../../ui/Tarjeta';
import {Etiqueta} from '../../../ui/Etiqueta';
import {Boton} from '../../../ui/Boton';
import {DominioContratado} from '../../../../data/types/dominio';

interface TarjetaDominioProps {
    dominio: DominioContratado;
    onRenovar: (dominio: DominioContratado) => void;
}

const etiquetasEstado = {
    activo: {label: 'Activo', variante: 'exito' as const, icono: <CheckCircle size={12} />},
    expirado: {label: 'Expirado', variante: 'error' as const, icono: <AlertCircle size={12} />},
    pendiente: {label: 'Pendiente', variante: 'warning' as const, icono: <Clock size={12} />}
};

export const TarjetaDominio: React.FC<TarjetaDominioProps> = ({dominio, onRenovar}) => {
    const estadoConfig = etiquetasEstado[dominio.estado];

    const formatearFecha = (fechaIso: string): string => {
        const fecha = new Date(fechaIso);
        return fecha.toLocaleDateString('es-ES', {day: '2-digit', month: 'short', year: 'numeric'});
    };

    /* Calcula si el dominio expira en menos de 30 días */
    const expiraProximamente = (): boolean => {
        const hoy = new Date();
        const expiracion = new Date(dominio.fechaExpiracion);
        const diasRestantes = Math.ceil((expiracion.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
        return diasRestantes <= 30 && diasRestantes > 0;
    };

    /* Nombre capitalizado para la clase CSS */
    const estadoClase = `estado${dominio.estado.charAt(0).toUpperCase() + dominio.estado.slice(1)}`;

    return (
        <Tarjeta className={`tarjetaDominio ${estadoClase}`}>
            <div className="dominioHeader">
                <div className="dominioIcono">
                    <Globe size={16} />
                </div>
                <div className="dominioInfo">
                    <h3 className="dominioNombre">{dominio.nombre}</h3>
                    {dominio.incluidoEnServicio && <span className="dominioIncluidoEn">Incluido en servicio contratado</span>}
                </div>
                <Etiqueta variante={estadoConfig.variante} icono={estadoConfig.icono}>
                    {estadoConfig.label}
                </Etiqueta>
            </div>

            <div className="dominioDetalles">
                <div className="dominioDetalle">
                    <span className="detalleLabel">Expira</span>
                    <span className="detalleValor valorExpiracion">{formatearFecha(dominio.fechaExpiracion)}</span>
                </div>
                {dominio.renovacionAutomatica && (
                    <div className="dominioRenovacionAuto">
                        <RefreshCw size={12} />
                        <span>Renovación automática</span>
                    </div>
                )}
            </div>

            {expiraProximamente() && !dominio.renovacionAutomatica && (
                <div className="dominioAlerta">
                    <AlertCircle size={14} />
                    <span>Expira pronto, considera renovar</span>
                </div>
            )}

            <div className="dominioAcciones">
                {!dominio.renovacionAutomatica && (
                    <Boton variante="outline" tamano="sm" icono={<RefreshCw size={14} />} onClick={() => onRenovar(dominio)}>
                        Renovar
                    </Boton>
                )}
            </div>
        </Tarjeta>
    );
};
