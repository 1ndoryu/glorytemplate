/**
 * AdminReservas — Listado de reservas con filtros por estado.
 * Permite cambiar el estado de cada reserva y ver detalles completos.
 */

import { useCallback, useState } from 'react';
import { Boton } from '@app/components/ui/Boton';
import { Modal } from '@app/components/ui/Modal';
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
    const [confirmCancelar, setConfirmCancelar] = useState<number | null>(null);
    const [reservaDetalle, setReservaDetalle] = useState<AdminReserva | null>(null);

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
                                            {r.telefono && <span className="adminClienteTelefono">{r.telefono}</span>}
                                        </div>
                                    </td>
                                    <td className="adminTablaCelda">{r.vehiculoNombre}</td>
                                    <td className="adminTablaCelda">
                                        <div className="adminFechasInfo">
                                            <span className="adminFechas">
                                                {formatearFecha(r.fechaInicio)} — {formatearFecha(r.fechaFin)}
                                            </span>
                                            <span className="adminNoches">{r.noches} noches</span>
                                        </div>
                                    </td>
                                    <td className="adminTablaCelda adminPrecio">{formatearEuros(r.precioTotal)}</td>
                                    <td className="adminTablaCelda"><BadgeEstado estado={r.estado} /></td>
                                    <td className="adminTablaAcciones">
                                        <div className="adminAcciones">
                                            {/* Ver detalle */}
                                            <Boton
                                                variante="icono"
                                                className="adminAccionIcono"
                                                title="Ver detalle"
                                                onClick={() => setReservaDetalle(r)}
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                                    <circle cx="12" cy="12" r="3" />
                                                </svg>
                                            </Boton>
                                            {r.estado === 'pendiente' && (
                                                <>
                                                    {/* Confirmar reserva */}
                                                    <Boton
                                                        variante="icono"
                                                        className="adminAccionIcono adminAccionIconoExito"
                                                        title="Confirmar reserva"
                                                        onClick={() => handleCambiarEstado(r.id, 'confirmada')}
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <polyline points="20 6 9 17 4 12" />
                                                        </svg>
                                                    </Boton>
                                                    {/* Cancelar reserva con confirm */}
                                                    {confirmCancelar === r.id ? (
                                                        <Boton
                                                            variante="icono"
                                                            className="adminAccionIcono adminAccionIconoEliminarConfirm"
                                                            title="Confirmar cancelación"
                                                            onClick={() => { handleCambiarEstado(r.id, 'cancelada'); setConfirmCancelar(null); }}
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                <polyline points="20 6 9 17 4 12" />
                                                            </svg>
                                                        </Boton>
                                                    ) : (
                                                        <Boton
                                                            variante="icono"
                                                            className="adminAccionIcono adminAccionIconoEliminar"
                                                            title="Cancelar reserva"
                                                            onClick={() => setConfirmCancelar(r.id)}
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                                                                <line x1="18" y1="6" x2="6" y2="18" />
                                                                <line x1="6" y1="6" x2="18" y2="18" />
                                                            </svg>
                                                        </Boton>
                                                    )}
                                                </>
                                            )}
                                            {r.estado === 'confirmada' && (
                                                /* Marcar como completada */
                                                <Boton
                                                    variante="icono"
                                                    className="adminAccionIcono adminAccionIconoCompletar"
                                                    title="Marcar como completada"
                                                    onClick={() => handleCambiarEstado(r.id, 'completada')}
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                                                        <polyline points="22 4 12 14.01 9 11.01" />
                                                    </svg>
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

            {/* Modal detalle de reserva */}
            <Modal
                abierto={reservaDetalle !== null}
                titulo={reservaDetalle ? `Reserva #${reservaDetalle.id}` : ''}
                onCerrar={() => setReservaDetalle(null)}
                ancho="520px"
            >
                {reservaDetalle && (
                    <div className="adminReservaDetalle">
                        <div className="adminDetalleSeccion">
                            <h4 className="adminDetalleSubtitulo">Estado</h4>
                            <BadgeEstado estado={reservaDetalle.estado} />
                        </div>

                        <div className="adminDetalleSeccion">
                            <h4 className="adminDetalleSubtitulo">Cliente</h4>
                            <p className="adminDetalleLinea"><strong>{reservaDetalle.nombreCliente}</strong></p>
                            <p className="adminDetalleLinea">{reservaDetalle.emailCliente}</p>
                            {reservaDetalle.telefono && (
                                <p className="adminDetalleLinea">{reservaDetalle.telefono}</p>
                            )}
                        </div>

                        <div className="adminDetalleSeccion">
                            <h4 className="adminDetalleSubtitulo">Reserva</h4>
                            <div className="adminDetalleGrid">
                                <span className="adminDetalleLabel">Vehiculo</span>
                                <span>{reservaDetalle.vehiculoNombre}</span>
                                <span className="adminDetalleLabel">Fechas</span>
                                <span>{formatearFecha(reservaDetalle.fechaInicio)} — {formatearFecha(reservaDetalle.fechaFin)}</span>
                                <span className="adminDetalleLabel">Noches</span>
                                <span>{reservaDetalle.noches}</span>
                                <span className="adminDetalleLabel">Temporada</span>
                                <span>{reservaDetalle.temporada || '—'}</span>
                            </div>
                        </div>

                        <div className="adminDetalleSeccion">
                            <h4 className="adminDetalleSubtitulo">Precio</h4>
                            <div className="adminDetalleGrid">
                                <span className="adminDetalleLabel">Precio/noche</span>
                                <span>{reservaDetalle.precioNoche ? formatearEuros(reservaDetalle.precioNoche) : '—'}</span>
                                <span className="adminDetalleLabel">Total</span>
                                <span className="adminDetallePrecioTotal">{formatearEuros(reservaDetalle.precioTotal)}</span>
                            </div>
                        </div>

                        {reservaDetalle.notas && (
                            <div className="adminDetalleSeccion">
                                <h4 className="adminDetalleSubtitulo">Notas del cliente</h4>
                                <p className="adminDetalleNotas">{reservaDetalle.notas}</p>
                            </div>
                        )}

                        {reservaDetalle.stripeSessionId && (
                            <div className="adminDetalleSeccion">
                                <h4 className="adminDetalleSubtitulo">Stripe</h4>
                                <p className="adminDetalleLinea adminDetalleMono">{reservaDetalle.stripeSessionId}</p>
                            </div>
                        )}

                        <p className="adminDetalleFechaCreacion">
                            Creada el {formatearFecha(reservaDetalle.fechaCreacion)}
                        </p>
                    </div>
                )}
            </Modal>
        </div>
    );
}
