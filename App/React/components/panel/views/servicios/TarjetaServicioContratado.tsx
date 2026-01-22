/*
 * TarjetaServicioContratado: Muestra un servicio contratado del cliente.
 * Diseño compacto de una sola fila con imagen real, nombre, precio, tiempo restante, estado y menú contextual.
 */

import React from 'react';
import {Eye, MessageCircle, FileText, AlertTriangle, Clock} from 'lucide-react';
import {Tarjeta} from '../../../ui/Tarjeta';
import {MenuContextual, AccionMenu} from '../../../ui/MenuContextual';
import {ServicioContratado} from '../../../../data/types/servicio';

interface TarjetaServicioContratadoProps {
    servicio: ServicioContratado;
    onVerDetalles?: (servicio: ServicioContratado) => void;
    onContactarProveedor?: (servicio: ServicioContratado) => void;
    onDescargarFactura?: (servicio: ServicioContratado) => void;
    onReportarProblema?: (servicio: ServicioContratado) => void;
}

/* Configuración de estados con colores semánticos */
const estadoConfig = {
    pendiente: {label: 'Pendiente', clase: 'estadoPendiente'},
    en_progreso: {label: 'En progreso', clase: 'estadoEnProgreso'},
    completado: {label: 'Completado', clase: 'estadoCompletado'},
    cancelado: {label: 'Cancelado', clase: 'estadoCancelado'}
};

/* Calcula días restantes hasta una fecha */
const calcularDiasRestantes = (fechaIso: string): number => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const fechaEntrega = new Date(fechaIso);
    fechaEntrega.setHours(0, 0, 0, 0);
    const diferencia = fechaEntrega.getTime() - hoy.getTime();
    return Math.ceil(diferencia / (1000 * 60 * 60 * 24));
};

/* Formatea días restantes en texto natural */
const formatearDiasRestantes = (dias: number): string => {
    if (dias < 0) return `${Math.abs(dias)} días de retraso`;
    if (dias === 0) return 'Hoy';
    if (dias === 1) return 'Mañana';
    return `${dias} días`;
};

/* Imagen fallback cuando no hay imagen real */
const IMAGEN_FALLBACK = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80"%3E%3Crect fill="%231a1a2e" width="80" height="80"/%3E%3Ctext x="40" y="45" font-family="system-ui" font-size="12" fill="%236b7280" text-anchor="middle"%3EServicio%3C/text%3E%3C/svg%3E';

export const TarjetaServicioContratado: React.FC<TarjetaServicioContratadoProps> = ({servicio, onVerDetalles, onContactarProveedor, onDescargarFactura, onReportarProblema}) => {
    const config = estadoConfig[servicio.estado];
    const diasRestantes = servicio.fechaEntregaEstimada ? calcularDiasRestantes(servicio.fechaEntregaEstimada) : null;

    /* Construir acciones del menú contextual */
    const acciones: AccionMenu[] = [
        {
            id: 'ver',
            label: 'Ver detalles',
            icono: <Eye size={14} />,
            onClick: () => onVerDetalles?.(servicio)
        },
        {
            id: 'progreso',
            label: 'Ver progreso',
            icono: <Clock size={14} />,
            onClick: () => console.log('TO-DO: Ver progreso del servicio')
        },
        {
            id: 'contactar',
            label: 'Contactar proveedor',
            icono: <MessageCircle size={14} />,
            onClick: () => onContactarProveedor?.(servicio)
        }
    ];

    /* Agregar descarga de factura solo si está pagado o completado */
    if (servicio.estado === 'completado') {
        acciones.push({
            id: 'factura',
            label: 'Descargar factura',
            icono: <FileText size={14} />,
            onClick: () => onDescargarFactura?.(servicio)
        });
    }

    /* Reportar problema siempre al final */
    acciones.push({
        id: 'reportar',
        label: 'Reportar problema',
        icono: <AlertTriangle size={14} />,
        onClick: () => onReportarProblema?.(servicio),
        peligroso: true
    });

    return (
        <Tarjeta className="tarjetaServicioContratado">
            <div className="servicioContratadoFila">
                {/* Imagen real del servicio */}
                <div className="servicioContratadoImagen">
                    <img
                        src={servicio.imagenUrl || IMAGEN_FALLBACK}
                        alt={servicio.nombre}
                        onError={e => {
                            (e.target as HTMLImageElement).src = IMAGEN_FALLBACK;
                        }}
                    />
                </div>

                {/* Nombre del servicio */}
                <span className="servicioContratadoNombre">{servicio.nombre}</span>

                {/* Precio */}
                <span className="servicioContratadoPrecio">${servicio.precio}</span>

                {/* Tiempo restante */}
                {diasRestantes !== null && <span className={`servicioContratadoTiempo ${diasRestantes < 0 ? 'tiempoRetrasado' : ''}`}>{formatearDiasRestantes(diasRestantes)}</span>}

                {/* Estado con color */}
                <span className={`servicioContratadoEstado ${config.clase}`}>{config.label}</span>

                {/* Menú contextual de acciones */}
                <MenuContextual acciones={acciones} ariaLabel={`Acciones para ${servicio.nombre}`} />
            </div>
        </Tarjeta>
    );
};
