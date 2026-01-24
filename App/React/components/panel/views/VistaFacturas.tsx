/*
 * VistaFacturas: Vista principal de facturación.
 * Admin: ve todas las facturas con columna de cliente.
 * Cliente: ve solo sus facturas.
 */

import React, {useState, useMemo} from 'react';
import {ResumenDeuda} from './facturas/ResumenDeuda';
import {ListaFacturas} from './facturas/ListaFacturas';
import {ModalPagarFactura} from './facturas/ModalPagarFactura';
import {usePanel} from '../../../context/PanelContext';
import {Factura} from '../../../data/types/facturacion';

export const VistaFacturas: React.FC = () => {
    const {esVistaAdmin, clientes, marcarProductosComoPagados, facturas} = usePanel();
    const [facturaSeleccionada, setFacturaSeleccionada] = useState<Factura | null>(null);
    const [modalVisible, setModalVisible] = useState(false);

    /* Total pendiente (basado en facturas ya filtradas por el contexto) */
    const totalPendiente = useMemo(() => {
        return facturas.filter(f => f.estado === 'pendiente' || f.estado === 'vencida').reduce((sum, f) => sum + f.total, 0);
    }, [facturas]);

    const cantidadPendientes = useMemo(() => facturas.filter(f => f.estado === 'pendiente' || f.estado === 'vencida').length, [facturas]);

    const handlePagar = (factura: Factura) => {
        setFacturaSeleccionada(factura);
        setModalVisible(true);
    };

    const handleVerDetalle = (factura: Factura) => {
        setFacturaSeleccionada(factura);
        setModalVisible(true);
    };

    /*
     * Al confirmar pago, sincronizamos el estado pagado de los productos.
     * TO-DO Fase 5: Integrar con Stripe antes de marcar como pagado.
     */
    const handleConfirmarPago = (factura: Factura) => {
        const productosRef = factura.items.map(item => item.productoRef).filter((ref): ref is string => !!ref);

        if (productosRef.length > 0) {
            marcarProductosComoPagados(productosRef);
        }

        console.log('Pago confirmado. Productos actualizados:', productosRef);
        setModalVisible(false);
        setFacturaSeleccionada(null);
    };

    const handleCerrarModal = () => {
        setModalVisible(false);
        setFacturaSeleccionada(null);
    };

    /* Helper para obtener nombre del cliente */
    const obtenerNombreCliente = (cId: string): string => {
        const cliente = clientes.find(c => c.id === cId);
        return cliente?.nombre || 'Desconocido';
    };

    return (
        <div className="bloqueVista" id="vistaFacturas">
            <header className="vistaHeader">
                <h2 className="vistaTitulo">{esVistaAdmin ? 'Todas las Facturas' : 'Facturación'}</h2>
                <p className="vistaSubtitulo">{esVistaAdmin ? `Gestiona las facturas de todos los clientes (${facturas.length} total).` : 'Gestiona tus pagos y revisa el historial de facturas.'}</p>
            </header>

            <ResumenDeuda totalPendiente={totalPendiente} cantidadFacturas={cantidadPendientes} />

            <ListaFacturas facturas={facturas} onPagar={handlePagar} onVerDetalle={handleVerDetalle} mostrarCliente={esVistaAdmin} obtenerNombreCliente={obtenerNombreCliente} />

            <ModalPagarFactura factura={facturaSeleccionada} visible={modalVisible} onCerrar={handleCerrarModal} onConfirmarPago={handleConfirmarPago} />
        </div>
    );
};
