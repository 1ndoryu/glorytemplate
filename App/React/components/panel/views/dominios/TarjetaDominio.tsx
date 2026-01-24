/*
 * TarjetaDominio: Muestra un dominio contratado.
 * Vista simplificada con información de expiración y renovación.
 * Opcionalmente muestra el nombre del cliente (vista admin).
 * Incluye alerta y botón de pago si el dominio está impago.
 */

import React from 'react';
import {Globe, AlertCircle, CheckCircle, Clock, RefreshCw, User, CreditCard} from 'lucide-react';
import {Tarjeta} from '../../../ui/Tarjeta';
import {Etiqueta} from '../../../ui/Etiqueta';
import {Boton} from '../../../ui/Boton';
import {DominioContratado} from '../../../../data/types/dominio';
import {formatearFecha, fechaProxima} from '../../../../utils/fechaUtils';

interface TarjetaDominioProps {
    dominio: DominioContratado;
    onRenovar: (dominio: DominioContratado) => void;
    onPagar?: (dominio: DominioContratado) => void;
    nombreCliente?: string;
}

const etiquetasEstado = {
    activo: {label: 'Activo', variante: 'exito' as const, icono: <CheckCircle size={12} />},
    expirado: {label: 'Expirado', variante: 'alerta' as const, icono: <AlertCircle size={12} />},
    pendiente: {label: 'Pendiente', variante: 'alerta' as const, icono: <Clock size={12} />}
};

export const TarjetaDominio: React.FC<TarjetaDominioProps> = ({dominio, onRenovar, onPagar, nombreCliente}) => {
    const estadoConfig = etiquetasEstado[dominio.estado];

    /* Calcula si el dominio expira en menos de 30 días usando el util */
    const expiraProximamente = (): boolean => fechaProxima(dominio.fechaExpiracion, 30);

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

            {nombreCliente && (
                <div className="dominioPropietario">
                    <User size={14} />
                    <span>{nombreCliente}</span>
                </div>
            )}

            <div className="dominioDetalles">
                <div className="dominioDetalle">
                    <span className="detalleLabel">Expira</span>
                    <span className="detalleValor valorExpiracion">{formatearFecha(dominio.fechaExpiracion)}</span>
                </div>
                <div className="dominioDetalle">
                    <span className="detalleLabel">Precio</span>
                    <span className="detalleValor">${dominio.precioAnual}/año</span>
                </div>
                {dominio.renovacionAutomatica && (
                    <div className="dominioRenovacionAuto">
                        <RefreshCw size={12} />
                        <span>Renovación automática</span>
                    </div>
                )}
            </div>

            {/* Alerta de pago pendiente (prioridad sobre alerta de expiración) */}
            {!dominio.pagado && (
                <div className="dominioAlerta alertaPago">
                    <CreditCard size={14} />
                    <span>Pago pendiente</span>
                </div>
            )}

            {/* Alerta de expiración próxima (solo si ya está pagado) */}
            {dominio.pagado && expiraProximamente() && !dominio.renovacionAutomatica && (
                <div className="dominioAlerta">
                    <AlertCircle size={14} />
                    <span>Expira pronto, considera renovar</span>
                </div>
            )}

            <div className="dominioAcciones">
                {!dominio.renovacionAutomatica && dominio.pagado && (
                    <Boton variante="outline" tamano="sm" icono={<RefreshCw size={14} />} onClick={() => onRenovar(dominio)}>
                        Renovar
                    </Boton>
                )}
                {!dominio.pagado && onPagar && (
                    <Boton variante="acento" tamano="sm" icono={<CreditCard size={14} />} onClick={() => onPagar(dominio)}>
                        Pagar ahora
                    </Boton>
                )}
            </div>
        </Tarjeta>
    );
};
