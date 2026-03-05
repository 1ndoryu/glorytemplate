/**
 * AdminDashboard — Vista general con estadísticas del negocio.
 * Tarjetas de resumen: reservas, ingresos, vehículos, clientes.
 */

import type { AdminEstadisticas } from '@app/types/cresta';

interface AdminDashboardProps {
    estadisticas: AdminEstadisticas | null;
    loading: boolean;
}

function formatearEuros(cantidad: number): string {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(cantidad);
}

interface TarjetaStatProps {
    titulo: string;
    valor: string;
    icono: JSX.Element;
    color: string;
}

function TarjetaStat({ titulo, valor, icono, color }: TarjetaStatProps): JSX.Element {
    return (
        <div className="adminStatTarjeta">
            <div className={`adminStatIcono adminStatIcono--${color}`}>
                {icono}
            </div>
            <div className="adminStatContenido">
                <span className="adminStatValor">{valor}</span>
                <span className="adminStatTitulo">{titulo}</span>
            </div>
        </div>
    );
}

export function AdminDashboard({ estadisticas, loading }: AdminDashboardProps): JSX.Element {
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
                <TarjetaStat
                    titulo="Reservas totales"
                    valor={String(stats.totalReservas)}
                    color="primario"
                    icono={
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                    }
                />
                <TarjetaStat
                    titulo="Confirmadas"
                    valor={String(stats.reservasConfirmadas)}
                    color="exito"
                    icono={
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                    }
                />
                <TarjetaStat
                    titulo="Pendientes"
                    valor={String(stats.reservasPendientes)}
                    color="aviso"
                    icono={
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                    }
                />
                <TarjetaStat
                    titulo="Ingresos del mes"
                    valor={formatearEuros(stats.ingresosMes)}
                    color="primario"
                    icono={
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" /></svg>
                    }
                />
                <TarjetaStat
                    titulo="Ingresos totales"
                    valor={formatearEuros(stats.ingresosTotales)}
                    color="exito"
                    icono={
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></svg>
                    }
                />
                <TarjetaStat
                    titulo="Vehículos activos"
                    valor={String(stats.vehiculosActivos)}
                    color="primario"
                    icono={
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 17h14v-5H5v5z" /><path d="M2 12l3-6h14l3 6" /><circle cx="7" cy="17" r="2" /><circle cx="17" cy="17" r="2" /></svg>
                    }
                />
                <TarjetaStat
                    titulo="Clientes únicos"
                    valor={String(stats.clientesUnicos)}
                    color="primario"
                    icono={
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /></svg>
                    }
                />
            </div>
        </div>
    );
}
