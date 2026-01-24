/*
 * ListaFacturas: Contenedor con tabs de filtrado y lista de facturas.
 * Soporta vista admin (con nombre de cliente) y vista cliente.
 */

import React, {useState, useMemo} from 'react';
import {TarjetaFactura} from './TarjetaFactura';
import {Factura} from '../../../../data/types/facturacion';

type FiltroTab = 'pendientes' | 'pagadas' | 'todas';

interface ListaFacturasProps {
    facturas: Factura[];
    onPagar: (factura: Factura) => void;
    onVerDetalle: (factura: Factura) => void;
    mostrarCliente?: boolean;
    obtenerNombreCliente?: (clienteId: string) => string;
}

const tabs: {id: FiltroTab; label: string}[] = [
    {id: 'pendientes', label: 'Pendientes'},
    {id: 'pagadas', label: 'Pagadas'},
    {id: 'todas', label: 'Todas'}
];

export const ListaFacturas: React.FC<ListaFacturasProps> = ({facturas, onPagar, onVerDetalle, mostrarCliente = false, obtenerNombreCliente}) => {
    const [tabActiva, setTabActiva] = useState<FiltroTab>('pendientes');

    const facturasFiltradas = useMemo(() => {
        switch (tabActiva) {
            case 'pendientes':
                return facturas.filter(f => f.estado === 'pendiente' || f.estado === 'vencida');
            case 'pagadas':
                return facturas.filter(f => f.estado === 'pagada');
            case 'todas':
            default:
                return facturas;
        }
    }, [facturas, tabActiva]);

    const conteos = useMemo(
        () => ({
            pendientes: facturas.filter(f => f.estado === 'pendiente' || f.estado === 'vencida').length,
            pagadas: facturas.filter(f => f.estado === 'pagada').length,
            todas: facturas.length
        }),
        [facturas]
    );

    return (
        <div className="listaFacturasContenedor">
            <nav className="facturasTabs">
                {tabs.map(tab => (
                    <button key={tab.id} className={`facturasTab ${tabActiva === tab.id ? 'activa' : ''}`} onClick={() => setTabActiva(tab.id)}>
                        {tab.label}
                        {conteos[tab.id] > 0 && <span className="facturasTabConteo">{conteos[tab.id]}</span>}
                    </button>
                ))}
            </nav>

            <div className="facturasLista">
                {facturasFiltradas.length === 0 ? (
                    <div className="facturasVacio">
                        <p>No hay facturas {tabActiva === 'pendientes' ? 'pendientes' : tabActiva === 'pagadas' ? 'pagadas' : ''}</p>
                    </div>
                ) : (
                    facturasFiltradas.map(factura => <TarjetaFactura key={factura.id} factura={factura} onPagar={onPagar} onVerDetalle={onVerDetalle} nombreCliente={mostrarCliente && obtenerNombreCliente ? obtenerNombreCliente(factura.clienteId) : undefined} />)
                )}
            </div>
        </div>
    );
};
