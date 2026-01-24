/*
 * ModalPagarFactura: Modal con detalle de factura y botón de pago.
 * Ubicación: components/panel/views/facturas/
 */

import React from 'react';
import {X, CreditCard, FileText} from 'lucide-react';
import {Boton} from '../../../ui/Boton';
import {Factura} from '../../../../data/types/facturacion';

interface ModalPagarFacturaProps {
    factura: Factura | null;
    visible: boolean;
    onCerrar: () => void;
    onConfirmarPago: (factura: Factura) => void;
}

export const ModalPagarFactura: React.FC<ModalPagarFacturaProps> = ({factura, visible, onCerrar, onConfirmarPago}) => {
    if (!visible || !factura) return null;

    const formatearFecha = (fechaIso: string): string => {
        const fecha = new Date(fechaIso);
        return fecha.toLocaleDateString('es-ES', {day: '2-digit', month: 'long', year: 'numeric'});
    };

    const handlePagar = () => {
        /* TO-DO: Integrar con Stripe en Fase 5 */
        onConfirmarPago(factura);
    };

    return (
        <div className="modalOverlay" onClick={onCerrar}>
            <div className="modalVentana" onClick={e => e.stopPropagation()}>
                <header className="modalHeader">
                    <div className="modalTituloWrapper">
                        <FileText size={20} />
                        <h2 className="modalTitulo">Detalle de Factura</h2>
                    </div>
                    <button className="modalCerrar" onClick={onCerrar}>
                        <X size={18} />
                    </button>
                </header>

                <div className="modalContenido">
                    <div className="facturaDetalleHeader">
                        <div>
                            <span className="facturaDetalleRef">{factura.referencia}</span>
                            <p className="facturaDetalleConcepto">{factura.concepto}</p>
                        </div>
                        <div className="facturaDetalleFechas">
                            <span>Emitida: {formatearFecha(factura.fechaEmision)}</span>
                            <span>Vence: {formatearFecha(factura.fechaVencimiento)}</span>
                        </div>
                    </div>

                    <div className="facturaItems">
                        <div className="facturaItemsHeader">
                            <span>Descripción</span>
                            <span>Cant.</span>
                            <span>Precio</span>
                            <span>Total</span>
                        </div>
                        {factura.items.map((item, index) => (
                            <div key={index} className="facturaItem">
                                <span className="itemDescripcion">{item.descripcion}</span>
                                <span className="itemCantidad">{item.cantidad}</span>
                                <span className="itemPrecio">${item.precioUnitario.toFixed(2)}</span>
                                <span className="itemTotal">${item.total.toFixed(2)}</span>
                            </div>
                        ))}
                    </div>

                    <div className="facturaTotales">
                        <div className="facturaTotalLinea">
                            <span>Subtotal</span>
                            <span>${factura.subtotal.toFixed(2)}</span>
                        </div>
                        {factura.impuestos > 0 && (
                            <div className="facturaTotalLinea">
                                <span>Impuestos</span>
                                <span>${factura.impuestos.toFixed(2)}</span>
                            </div>
                        )}
                        <div className="facturaTotalLinea totalFinal">
                            <span>Total a pagar</span>
                            <span>${factura.total.toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                <footer className="modalFooter">
                    <Boton variante="ghost" onClick={onCerrar}>
                        Cancelar
                    </Boton>
                    <Boton variante="solid" icono={<CreditCard size={16} />} onClick={handlePagar}>
                        Pagar ${factura.total.toFixed(2)}
                    </Boton>
                </footer>
            </div>
        </div>
    );
};
