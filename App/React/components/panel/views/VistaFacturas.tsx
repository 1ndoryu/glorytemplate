import React from 'react';
import {Download} from 'lucide-react';
import {Tarjeta} from '../../ui/Tarjeta';
import {Etiqueta} from '../../ui/Etiqueta';
import {Boton} from '../../ui/Boton';
import {usePanel} from '../../../context/PanelContext';

/**
 * VistaFacturas: Lista de facturas y pagos del cliente.
 */
export const VistaFacturas: React.FC = () => {
    const {facturas} = usePanel();

    const getEstadoColor = (estado: string) => {
        switch (estado) {
            case 'pagada':
                return 'exito';
            case 'pendiente':
                return 'alerta';
            case 'procesando':
                return 'info';
            default:
                return 'neutro';
        }
    };

    return (
        <div className="bloqueVista">
            <header className="vistaHeader">
                <h2 className="vistaTitulo">Facturación</h2>
                <p className="vistaSubtitulo">Gestiona tus pagos y descarga tus facturas.</p>
            </header>

            <Tarjeta className="tablaFacturasContenedor">
                <table className="tablaFacturas">
                    <thead>
                        <tr>
                            <th>Referencia</th>
                            <th>Concepto</th>
                            <th>Fecha</th>
                            <th>Importe</th>
                            <th>Estado</th>
                            <th className="text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {facturas.map(factura => (
                            <tr key={factura.id}>
                                <td className="font-mono">{factura.id}</td>
                                <td>{factura.concepto}</td>
                                <td>{factura.fecha}</td>
                                <td className="font-bold">${factura.importe.toFixed(2)}</td>
                                <td>
                                    <Etiqueta variante={getEstadoColor(factura.estado)}>{factura.estado.charAt(0).toUpperCase() + factura.estado.slice(1)}</Etiqueta>
                                </td>
                                <td className="text-right">
                                    <Boton variante="ghost" tamano="sm" icono={<Download size={14} />}>
                                        PDF
                                    </Boton>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </Tarjeta>
        </div>
    );
};
