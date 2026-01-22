/*
 * TarjetaHostingCliente: Muestra un hosting contratado del cliente.
 * Vista simplificada sin datos técnicos de Coolify.
 */

import React from 'react';
import {Globe, ExternalLink, AlertCircle, CheckCircle} from 'lucide-react';
import {Tarjeta} from '../../../ui/Tarjeta';
import {Etiqueta} from '../../../ui/Etiqueta';
import {Boton} from '../../../ui/Boton';
import {HostingContratado} from '../../../../data/types/hosting';

interface TarjetaHostingClienteProps {
    hosting: HostingContratado;
    onVerDetalle: (hosting: HostingContratado) => void;
    onCambiarPlan: (hosting: HostingContratado) => void;
}

const etiquetasEstado = {
    activo: {label: 'Activo', variante: 'exito' as const, icono: <CheckCircle size={12} />},
    suspendido: {label: 'Suspendido', variante: 'error' as const, icono: <AlertCircle size={12} />},
    cancelado: {label: 'Cancelado', variante: 'neutro' as const, icono: <AlertCircle size={12} />}
};

export const TarjetaHostingCliente: React.FC<TarjetaHostingClienteProps> = ({hosting, onVerDetalle, onCambiarPlan}) => {
    const estadoConfig = etiquetasEstado[hosting.estado];
    const urlSitio = hosting.dominioTemporal ? `https://${hosting.dominioTemporal}` : `https://${hosting.dominio}`;

    const formatearFecha = (fechaIso: string): string => {
        const fecha = new Date(fechaIso);
        return fecha.toLocaleDateString('es-ES', {day: '2-digit', month: 'short', year: 'numeric'});
    };

    return (
        <Tarjeta className={`tarjetaHostingCliente estado${hosting.estado.charAt(0).toUpperCase() + hosting.estado.slice(1)}`}>
            <div className="hostingClienteHeader">
                <div className="hostingClienteIcono">
                    <Globe size={16} />
                </div>
                <div className="hostingClienteInfo">
                    <h3 className="hostingClienteDominio">{hosting.dominio}</h3>
                    {hosting.dominioTemporal && hosting.dominioTemporal !== hosting.dominio && <span className="hostingClienteTemporal">Temporal: {hosting.dominioTemporal}</span>}
                </div>
                <Etiqueta variante={estadoConfig.variante} icono={estadoConfig.icono}>
                    {estadoConfig.label}
                </Etiqueta>
            </div>

            <div className="hostingClienteDetalles">
                <div className="hostingClienteDetalle">
                    <span className="detalleLabel">Plan</span>
                    <span className="detalleValor planBadge">{hosting.plan === 'mensual' ? `$${hosting.precioMensual}/mes` : `$${hosting.precioAnual}/año`}</span>
                </div>
                <div className="hostingClienteDetalle">
                    <span className="detalleLabel">Próxima renovación</span>
                    <span className="detalleValor">{formatearFecha(hosting.fechaProximaRenovacion)}</span>
                </div>
            </div>

            {!hosting.pagado && (
                <div className="hostingClienteAlerta">
                    <AlertCircle size={14} />
                    <span>Pago pendiente</span>
                </div>
            )}

            <div className="hostingClienteAcciones">
                <Boton variante="outline" tamano="sm" icono={<ExternalLink size={14} />} onClick={() => window.open(urlSitio, '_blank')}>
                    Visitar sitio
                </Boton>
                <Boton variante="outline" tamano="sm" onClick={() => onCambiarPlan(hosting)}>
                    Cambiar plan
                </Boton>
            </div>
        </Tarjeta>
    );
};
