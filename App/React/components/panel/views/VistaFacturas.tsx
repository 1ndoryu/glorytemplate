/*
 * VistaFacturas: Vista principal de facturación del panel cliente.
 * Muestra resumen de deuda, lista filtrable y modal de pago.
 */

import React, {useState, useMemo} from 'react';
import {ResumenDeuda} from './facturas/ResumenDeuda';
import {ListaFacturas} from './facturas/ListaFacturas';
import {ModalPagarFactura} from './facturas/ModalPagarFactura';
import {usePanel} from '../../../context/PanelContext';
import {facturasCompletas, calcularTotalPendiente} from '../../../data/mocks/facturas';
import {Factura} from '../../../data/types/facturacion';

export const VistaFacturas: React.FC = () => {
    const {user} = usePanel();
    const [facturaSeleccionada, setFacturaSeleccionada] = useState<Factura | null>(null);
    const [modalVisible, setModalVisible] = useState(false);

    /* Obtener facturas del cliente actual (mock: CLI-001) */
    const clienteId = 'CLI-001';
    const facturas = useMemo(() => facturasCompletas.filter(f => f.clienteId === clienteId), [clienteId]);

    const totalPendiente = useMemo(() => calcularTotalPendiente(clienteId), [clienteId]);

    const cantidadPendientes = useMemo(() => facturas.filter(f => f.estado === 'pendiente' || f.estado === 'vencida').length, [facturas]);

    const handlePagar = (factura: Factura) => {
        setFacturaSeleccionada(factura);
        setModalVisible(true);
    };

    const handleVerDetalle = (factura: Factura) => {
        setFacturaSeleccionada(factura);
        setModalVisible(true);
    };

    const handleConfirmarPago = (factura: Factura) => {
        /* TO-DO: Implementar integración Stripe en Fase 5 */
        console.log('Procesando pago de factura:', factura.referencia);
        setModalVisible(false);
        setFacturaSeleccionada(null);
    };

    const handleCerrarModal = () => {
        setModalVisible(false);
        setFacturaSeleccionada(null);
    };

    return (
        <div className="bloqueVista" id="vistaFacturas">
            <header className="vistaHeader">
                <h2 className="vistaTitulo">Facturación</h2>
                <p className="vistaSubtitulo">Gestiona tus pagos y revisa el historial de facturas.</p>
            </header>

            <ResumenDeuda totalPendiente={totalPendiente} cantidadFacturas={cantidadPendientes} />

            <ListaFacturas facturas={facturas} onPagar={handlePagar} onVerDetalle={handleVerDetalle} />

            <ModalPagarFactura factura={facturaSeleccionada} visible={modalVisible} onCerrar={handleCerrarModal} onConfirmarPago={handleConfirmarPago} />
        </div>
    );
};
