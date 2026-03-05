/**
 * AdminReservas — Listado de reservas con filtros por estado.
 * Permite cambiar el estado de cada reserva.
 */

import { useCallback } from 'react';
import { Boton } from '@app/components/ui/Boton';
import type { AdminReserva, EstadoReserva } from '@app/types/cresta';

interface AdminReservasProps {
    reservas: AdminReserva[];
    loading: boolean;
    filtroEstado: EstadoReserva | 'todas';
    onFiltroChange: (f: EstadoReserva | 'todas') => void;
    onCambiarEstado: (id: number, estado: EstadoReserva) => Promise<boolean>;
}

const FILTROS: { clave: EstadoReserva | 'todas'; label: string }[] = [
    { clave: 'todas', label: 'Todas' },
    { clave: 'pendiente', label: 'Pendientes' },
    { clave: 'confirmada', label: 'Confirmadas' },
    { clave: 'completada', label: 'Completadas' },
    { clave: 'cancelada', label: 'Canceladas' },
];

function BadgeEstado({ estado }: { estado: EstadoReserva }): JSX.Element {
    const clases: Record<EstadoReserva, string> = {
        pendiente: 'adminBadge adminBadgeAviso',
        confirmada: 'adminBadge adminBadgeExito',
        completada: 'adminBadge adminBadgePrimario',
        cancelada: 'adminBadge adminBadgeError',
        fallida: 'adminBadge adminBadgeError',
    };
    return <span className={clases[estado] ?? 'adminBadge'}>{estado}</span>;
}

function formatearFecha(fecha: string): string {
    try {
        return new Date(fecha).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
        return fecha;
    }
}

function formatearEuros(cantidad: number): string {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(cantidad);
}

export function AdminReservas({ reservas, loading, filtroEstado, onFiltroChange, onCambiarEstado }: AdminReservasProps): JSX.Element {

    const handleCambiarEstado = useCallback(async (id: number, estado: EstadoReserva) => {
        await onCambiarEstado(id, estado);
    }, [onCambiarEstado]);

    return (
        <div className="adminSeccion">
            <h2 className="adminSeccionTitulo">Reservas</h2>
            <p className="adminSeccionDesc">Gestiona todas las reservas de tus clientes</p>

            {/* Filtros */}
            <div className="adminFiltros">
                {FILTROS.map(f => (
                    <Boton
                        key={f.clave}
                        variante="icono"
                        className={`adminFiltroBtn ${filtroEstado === f.clave ? 'adminFiltroBtnActivo' : ''}`}
                        onClick={() => onFiltroChange(f.clave)}
                    >
                        {f.label}
                    </Boton>
                ))}
            </div>

            {loading ? (
                <div className="adminSeccionCargando">
                    <div className="cargandoSpinner" />
                    <p>Cargando reservas...</p>
                </div>
            ) : reservas.length === 0 ? (
                <div className="adminVacio">
                    <p>No hay reservas {filtroEstado !== 'todas' ? `con estado "${filtroEstado}"` : ''}</p>
                </div>
            ) : (
                <div className="adminTablaWrap">
                    <table className="adminTabla">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Cliente</th>
                                <th>Vehículo</th>
                                <th>Fechas</th>
                                <th>Total</th>
                                <th>Estado</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reservas.map(r => (
                                <tr key={r.id}>
                                    <td className="adminTablaCelda">#{r.id}</td>
                                    <td className="adminTablaCelda">
                                        <div className="adminClienteInfo">
                                            <span className="adminClienteNombre">{r.nombreCliente}</span>
                                            <span className="adminClienteEmail">{r.emailCliente}</span>
                                        </div>
                                    </td>
                                    <td className="adminTablaCelda">{r.vehiculoNombre}</td>
                                    <td className="adminTablaCelda">
                                        <span className="adminFechas">
                                            {formatearFecha(r.fechaInicio)} — {formatearFecha(r.fechaFin)}
                                        </span>
                                        <span className="adminNoches">{r.noches} noches</span>
                                    </td>
                                    <td className="adminTablaCelda adminPrecio">{formatearEuros(r.precioTotal)}</td>
                                    <td className="adminTablaCelda"><BadgeEstado estado={r.estado} /></td>
                                    <td className="adminTablaCelda">
                                        <div className="adminAcciones">
                                            {r.estado === 'pendiente' && (
                                                <>
                                                    <Boton variante="enlace" onClick={() => handleCambiarEstado(r.id, 'confirmada')}>
                                                        Confirmar
                                                    </Boton>
                                                    <Boton variante="enlace" onClick={() => handleCambiarEstado(r.id, 'cancelada')}>
                                                        Cancelar
                                                    </Boton>
                                                </>
                                            )}
                                            {r.estado === 'confirmada' && (
                                                <Boton variante="enlace" onClick={() => handleCambiarEstado(r.id, 'completada')}>
                                                    Completar
                                                </Boton>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
