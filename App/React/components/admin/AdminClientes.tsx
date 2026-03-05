/**
 * AdminClientes — Listado de clientes derivados de reservas.
 * Muestra nombre, email, reservas totales, gasto acumulado.
 */

import type { AdminCliente } from '@app/types/cresta';

interface AdminClientesProps {
    clientes: AdminCliente[];
    loading: boolean;
}

function formatearEuros(cantidad: number): string {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(cantidad);
}

function formatearFecha(fecha: string): string {
    if (!fecha) return '—';
    try {
        return new Date(fecha).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
        return fecha;
    }
}

export function AdminClientes({ clientes, loading }: AdminClientesProps): JSX.Element {
    return (
        <div className="adminSeccion">
            <h2 className="adminSeccionTitulo">Clientes</h2>
            <p className="adminSeccionDesc">Historial de clientes que han realizado reservas</p>

            {loading ? (
                <div className="adminSeccionCargando">
                    <div className="cargandoSpinner" />
                    <p>Cargando clientes...</p>
                </div>
            ) : clientes.length === 0 ? (
                <div className="adminVacio">
                    <p>No hay clientes registrados todavía.</p>
                </div>
            ) : (
                <div className="adminTablaWrap">
                    <table className="adminTabla">
                        <thead>
                            <tr>
                                <th>Cliente</th>
                                <th>Teléfono</th>
                                <th>Reservas</th>
                                <th>Última reserva</th>
                                <th>Gasto total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {clientes.map(c => (
                                <tr key={c.email}>
                                    <td className="adminTablaCelda">
                                        <div className="adminClienteInfo">
                                            <span className="adminClienteNombre">{c.nombre}</span>
                                            <span className="adminClienteEmail">{c.email}</span>
                                        </div>
                                    </td>
                                    <td className="adminTablaCelda">{c.telefono || '—'}</td>
                                    <td className="adminTablaCelda">{c.totalReservas}</td>
                                    <td className="adminTablaCelda">{formatearFecha(c.ultimaReserva)}</td>
                                    <td className="adminTablaCelda adminPrecio">{formatearEuros(c.gastoTotal)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
