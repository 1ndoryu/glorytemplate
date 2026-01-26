/*
 * ModalPagarFactura: Modal con detalle de factura y botón de pago.
 * Ubicación: components/panel/views/facturas/
 *
 * Usa createPortal hacia #modal-root para renderizar fuera del panelLayout.
 */

import React from 'react';
import {createPortal} from 'react-dom';
import {X, CreditCard, FileText} from 'lucide-react';
import {Boton} from '../../../ui/Boton';
import {Factura} from '../../../../data/types/facturacion';
import {formatearFecha} from '../../../../utils/fechaUtils';

interface ModalPagarFacturaProps {
    factura: Factura | null;
    visible: boolean;
    onCerrar: () => void;
    onConfirmarPago: (factura: Factura) => void;
}

export const ModalPagarFactura: React.FC<ModalPagarFacturaProps> = ({factura, visible, onCerrar, onConfirmarPago}) => {
    /* Estado para selección de items (Granularidad) */
    const [seccionados, setSeccionados] = React.useState<number[]>([]);

    React.useEffect(() => {
        if (factura && visible) {
            /* Por defecto todos seleccionados */
            setSeccionados(factura.items.map((_, i) => i));
        }
    }, [factura, visible]);

    if (!visible || !factura) return null;

    const toggleItem = (index: number) => {
        setSeccionados(prev => (prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]));
    };

    const subtotalCalculado = factura.items.filter((_, i) => seccionados.includes(i)).reduce((sum, item) => sum + item.total, 0);

    /* Aproximación simple de impuestos proporcional */
    const impuestosCalculados = factura.subtotal > 0 ? (subtotalCalculado / factura.subtotal) * factura.impuestos : 0;
    const totalCalculado = subtotalCalculado + impuestosCalculados;

    const handlePagar = () => {
        /* TO-DO: Integrar con Stripe y manejar pago parcial */
        onConfirmarPago(factura);
    };

    const modalRoot = document.getElementById('modal-root') || document.body;

    return createPortal(
        <div className="modalOverlay" onClick={onCerrar}>
            <div className="modalVentana" onClick={e => e.stopPropagation()}>
                <header className="modalHeader">
                    <div className="modalTituloWrapper">
                        <FileText size={20} />
                        <h2 className="modalTitulo">Detalle de Factura</h2>
                    </div>
                    <Boton variante="ghost" tamano="sm" onClick={onCerrar} icono={<X size={18} />} pill className="modalCerrar" />
                </header>

                <div className="modalContenido">
                    <div className="facturaDetalleHeader">
                        <div>
                            <span className="facturaDetalleRef">{factura.referencia}</span>
                            <p className="facturaDetalleConcepto">{factura.concepto}</p>
                        </div>
                        <div className="facturaDetalleFechas">
                            <span>Emitida: {formatearFecha(factura.fechaEmision, 'largo')}</span>
                            <span>Vence: {formatearFecha(factura.fechaVencimiento, 'largo')}</span>
                        </div>
                    </div>

                    <div className="facturaItems">
                        <div className="facturaItemsDataHeader">
                            <span style={{width: '24px'}}></span>
                            <span>Descripción</span>
                            <span className="text-right">Cant.</span>
                            <span className="text-right">Precio</span>
                            <span className="text-right">Total</span>
                        </div>
                        {factura.items.map((item, index) => {
                            const isSelected = seccionados.includes(index);
                            return (
                                <div key={index} className={`facturaItemRow ${isSelected ? 'selected' : ''}`} onClick={() => toggleItem(index)}>
                                    <div className="itemCheckbox">
                                        <input type="checkbox" checked={isSelected} readOnly />
                                    </div>
                                    <span className="itemDescripcion">{item.descripcion}</span>
                                    <span className="itemCantidad text-right">{item.cantidad}</span>
                                    <span className="itemPrecio text-right">${item.precioUnitario.toFixed(2)}</span>
                                    <span className="itemTotal text-right">${item.total.toFixed(2)}</span>
                                </div>
                            );
                        })}
                    </div>

                    <div className="facturaTotales">
                        <div className="facturaTotalLinea semiBold">
                            <span>Resumen de pago</span>
                        </div>
                        <div className="facturaTotalLinea">
                            <span>Subtotal selección</span>
                            <span>${subtotalCalculado.toFixed(2)}</span>
                        </div>
                        {impuestosCalculados > 0 && (
                            <div className="facturaTotalLinea">
                                <span>Impuestos</span>
                                <span>${impuestosCalculados.toFixed(2)}</span>
                            </div>
                        )}
                        <div className="facturaTotalLinea totalFinal">
                            <span>Total a pagar</span>
                            <span>${totalCalculado.toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                <footer className="modalFooter">
                    <Boton variante="ghost" onClick={onCerrar}>
                        Cancelar
                    </Boton>
                    {seccionados.length > 0 && (
                        <Boton variante="solid" icono={<CreditCard size={16} />} onClick={handlePagar}>
                            Pagar ${totalCalculado.toFixed(2)}
                        </Boton>
                    )}
                </footer>
            </div>
        </div>,
        modalRoot
    );
};
