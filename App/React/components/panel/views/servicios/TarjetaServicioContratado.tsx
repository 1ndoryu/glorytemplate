/*
 * TarjetaServicioContratado: Muestra un servicio contratado del cliente.
 * Ej: Diseño web en progreso con pago al finalizar.
 */

import React from 'react';
import {Palette, Clock, CheckCircle, AlertCircle, Package} from 'lucide-react';
import {Tarjeta} from '../../../ui/Tarjeta';
import {Etiqueta} from '../../../ui/Etiqueta';
import {ServicioContratado} from '../../../../data/types/servicio';

interface TarjetaServicioContratadoProps {
    servicio: ServicioContratado;
}

const iconosTipo = {
    diseno_web: <Palette size={16} />,
    mantenimiento: <Clock size={16} />,
    desarrollo: <Package size={16} />
};

const etiquetasEstado = {
    pendiente: {label: 'Pendiente', variante: 'neutro' as const},
    en_progreso: {label: 'En progreso', variante: 'info' as const},
    completado: {label: 'Completado', variante: 'exito' as const},
    cancelado: {label: 'Cancelado', variante: 'alerta' as const}
};

export const TarjetaServicioContratado: React.FC<TarjetaServicioContratadoProps> = ({servicio}) => {
    const estadoConfig = etiquetasEstado[servicio.estado];
    const icono = iconosTipo[servicio.tipo] || <Package size={24} />;

    const formatearFecha = (fechaIso: string): string => {
        const fecha = new Date(fechaIso);
        return fecha.toLocaleDateString('es-ES', {day: '2-digit', month: 'long', year: 'numeric'});
    };

    const incluyeItems: string[] = [];
    if (servicio.incluyeHosting) {
        incluyeItems.push(`Hosting (${servicio.hostingMesesIncluidos} meses)`);
    }
    if (servicio.incluyeDominio) {
        incluyeItems.push('Dominio');
    }

    return (
        <Tarjeta className={`tarjetaServicioContratado estado${servicio.estado.replace('_', '')}`}>
            <div className="servicioContratadoHeader">
                <div className="servicioContratadoIcono">{icono}</div>
                <div className="servicioContratadoInfo">
                    <h3 className="servicioContratadoNombre">{servicio.nombre}</h3>
                    <p className="servicioContratadoDescripcion">{servicio.descripcion}</p>
                </div>
                <Etiqueta variante={estadoConfig.variante}>{estadoConfig.label}</Etiqueta>
            </div>

            <div className="servicioContratadoDetalles">
                <div className="servicioContratadoDetalle">
                    <span className="servicioDetalleLabel">Precio</span>
                    <span className="servicioDetalleValor precio">${servicio.precio}</span>
                </div>
                <div className="servicioContratadoDetalle">
                    <span className="servicioDetalleLabel">Inicio</span>
                    <span className="servicioDetalleValor">{formatearFecha(servicio.fechaInicio)}</span>
                </div>
                {servicio.fechaEntregaEstimada && (
                    <div className="servicioContratadoDetalle">
                        <span className="servicioDetalleLabel">Entrega estimada</span>
                        <span className="servicioDetalleValor">{formatearFecha(servicio.fechaEntregaEstimada)}</span>
                    </div>
                )}
            </div>

            {servicio.pagoAlFinalizar && servicio.estado !== 'completado' && (
                <div className="servicioContratadoPago">
                    <AlertCircle size={14} />
                    <span>Pago pendiente al finalizar</span>
                </div>
            )}
        </Tarjeta>
    );
};
