/*
 * TarjetaFactura: Card individual de factura con estado visual.
 * Ubicación: components/panel/views/facturas/
 */

import React from 'react';
import {FileText, Clock, AlertTriangle, CheckCircle} from 'lucide-react';
import {Tarjeta} from '../../../ui/Tarjeta';
import {Etiqueta} from '../../../ui/Etiqueta';
import {Boton} from '../../../ui/Boton';
import {Factura} from '../../../../data/types/facturacion';

interface TarjetaFacturaProps {
    factura: Factura;
    onPagar: (factura: Factura) => void;
    onVerDetalle: (factura: Factura) => void;
}

const iconosEstado = {
    pendiente: <Clock size={14} />,
    vencida: <AlertTriangle size={14} />,
    pagada: <CheckCircle size={14} />,
    cancelada: <FileText size={14} />
};

const variantesEstado = {
    pendiente: 'alerta' as const,
    vencida: 'error' as const,
    pagada: 'exito' as const,
    cancelada: 'neutro' as const
};

const etiquetasEstado = {
    pendiente: 'Pendiente',
    vencida: 'Vencida',
    pagada: 'Pagada',
    cancelada: 'Cancelada'
};

export const TarjetaFactura: React.FC<TarjetaFacturaProps> = ({factura, onPagar, onVerDetalle}) => {
    const esPagable = factura.estado === 'pendiente' || factura.estado === 'vencida';

    const formatearFecha = (fechaIso: string): string => {
        const fecha = new Date(fechaIso);
        return fecha.toLocaleDateString('es-ES', {day: '2-digit', month: 'short', year: 'numeric'});
    };

    return (
        <Tarjeta className={`tarjetaFactura estado${factura.estado.charAt(0).toUpperCase() + factura.estado.slice(1)}`}>
            <div className="tarjetaFacturaHeader">
                <div className="tarjetaFacturaInfo">
                    <span className="facturaReferencia">{factura.referencia}</span>
                    <Etiqueta variante={variantesEstado[factura.estado]} icono={iconosEstado[factura.estado]}>
                        {etiquetasEstado[factura.estado]}
                    </Etiqueta>
                </div>
                <span className="facturaMonto">${factura.total.toFixed(2)}</span>
            </div>

            <p className="facturaConcepto">{factura.concepto}</p>

            <div className="tarjetaFacturaFooter">
                <div className="facturaFechas">
                    <span className="facturaFecha">Emitida: {formatearFecha(factura.fechaEmision)}</span>
                    {factura.estado !== 'pagada' && <span className="facturaFecha vencimiento">Vence: {formatearFecha(factura.fechaVencimiento)}</span>}
                </div>
                <div className="facturaAcciones">
                    <Boton variante="ghost" tamano="sm" onClick={() => onVerDetalle(factura)}>
                        Ver detalle
                    </Boton>
                    {esPagable && (
                        <Boton variante="primario" tamano="sm" onClick={() => onPagar(factura)}>
                            Pagar
                        </Boton>
                    )}
                </div>
            </div>
        </Tarjeta>
    );
};
