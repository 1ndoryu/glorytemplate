/**
 * AdminDashboard — Vista general con estadisticas del negocio.
 * Tarjetas de resumen + actividad reciente.
 */

import type { AdminEstadisticas, EventoActividad, TipoEvento } from '@app/types/cresta';

interface AdminDashboardProps {
    estadisticas: AdminEstadisticas | null;
    loading: boolean;
    actividad: EventoActividad[];
    loadingActividad: boolean;
}

function formatearEuros(cantidad: number): string {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(cantidad);
}

interface TarjetaStatProps {
    titulo: string;
    valor: string;
}

function TarjetaStat({ titulo, valor }: TarjetaStatProps): JSX.Element {
    return (
        <div className="adminStatTarjeta">
            <span className="adminStatTitulo">{titulo}</span>
            <span className="adminStatValor">{valor}</span>
        </div>
    );
}

const ICONO_EVENTO: Record<TipoEvento, string> = {
    nueva_reserva: 'reserva',
    reserva_confirmada: 'exito',
    reserva_cancelada: 'error',
    pago_fallido: 'error',
    entrega_hoy: 'entrega',
    devolucion_hoy: 'devolucion',
    devolucion_manana: 'aviso',
};

function formatearFechaRelativa(fecha: string): string {
    try {
        const ahora = Date.now();
        const objetivo = new Date(fecha).getTime();
        const diffMs = ahora - objetivo;
        const diffMin = Math.floor(diffMs / 60000);
        if (diffMin < 1) return 'ahora';
        if (diffMin < 60) return `hace ${diffMin} min`;
        const diffH = Math.floor(diffMin / 60);
        if (diffH < 24) return `hace ${diffH}h`;
        const diffD = Math.floor(diffH / 24);
        if (diffD < 7) return `hace ${diffD}d`;
        return new Date(fecha).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
    } catch {
        return fecha;
    }
}

function EventoItem({ evento }: { evento: EventoActividad }): JSX.Element {
    const clase = ICONO_EVENTO[evento.tipo] ?? 'reserva';
    return (
        <div className={`adminActividadItem adminActividadItem--${clase}`}>
            <div className="adminActividadIcono" />
            <div className="adminActividadContenido">
                <span className="adminActividadMensaje">{evento.mensaje}</span>
                <span className="adminActividadFecha">{formatearFechaRelativa(evento.fecha)}</span>
            </div>
        </div>
    );
}

export function AdminDashboard({ estadisticas, loading, actividad, loadingActividad }: AdminDashboardProps): JSX.Element {
    if (loading) {
        return (
            <div className="adminSeccionCargando">
                <div className="cargandoSpinner" />
                <p>Cargando estadísticas...</p>
            </div>
        );
    }

    const stats = estadisticas ?? {
        totalReservas: 0,
        reservasConfirmadas: 0,
        reservasPendientes: 0,
        ingresosMes: 0,
        ingresosTotales: 0,
        vehiculosActivos: 0,
        clientesUnicos: 0,
    };

    return (
        <div className="adminSeccion">
            <h2 className="adminSeccionTitulo">Dashboard</h2>
            <p className="adminSeccionDesc">Vista general de tu negocio</p>

            <div className="adminStatsGrid">
                <TarjetaStat titulo="Reservas totales" valor={String(stats.totalReservas)} />
                <TarjetaStat titulo="Confirmadas" valor={String(stats.reservasConfirmadas)} />
                <TarjetaStat titulo="Pendientes" valor={String(stats.reservasPendientes)} />
                <TarjetaStat titulo="Ingresos del mes" valor={formatearEuros(stats.ingresosMes)} />
                <TarjetaStat titulo="Ingresos totales" valor={formatearEuros(stats.ingresosTotales)} />
                <TarjetaStat titulo="Vehiculos activos" valor={String(stats.vehiculosActivos)} />
                <TarjetaStat titulo="Clientes unicos" valor={String(stats.clientesUnicos)} />
            </div>

            {/* Actividad reciente */}
            <div className="adminActividadSeccion">
                <h3 className="adminConfigSubtitulo">Actividad reciente</h3>
                {loadingActividad ? (
                    <div className="adminSeccionCargando">
                        <div className="cargandoSpinner" />
                    </div>
                ) : actividad.length === 0 ? (
                    <p className="adminVacioTexto">No hay actividad reciente</p>
                ) : (
                    <div className="adminActividadLista">
                        {actividad.map((ev, i) => (
                            <EventoItem key={`${ev.tipo}-${ev.reservaId ?? i}`} evento={ev} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
