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
import {useUsuario} from '../../../context/UsuarioContext';
import {facturasCompletas, calcularTotalPendiente} from '../../../data/mocks/facturas';
import {Factura} from '../../../data/types/facturacion';

export const VistaFacturas: React.FC = () => {
    const {esVistaAdmin, clientes} = usePanel();
    const {clienteId} = useUsuario();
    const [facturaSeleccionada, setFacturaSeleccionada] = useState<Factura | null>(null);
    const [modalVisible, setModalVisible] = useState(false);

    /* Filtrar facturas según rol */
    const facturas = useMemo(() => {
        if (esVistaAdmin) {
            return facturasCompletas;
        }
        return facturasCompletas.filter(f => f.clienteId === clienteId);
    }, [esVistaAdmin, clienteId]);

    /* Total pendiente (para admin es de todos, para cliente solo suyo) */
    const totalPendiente = useMemo(() => {
        if (esVistaAdmin) {
            return facturasCompletas.filter(f => f.estado === 'pendiente' || f.estado === 'vencida').reduce((sum, f) => sum + f.total, 0);
        }
        return clienteId ? calcularTotalPendiente(clienteId) : 0;
    }, [esVistaAdmin, clienteId]);

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
