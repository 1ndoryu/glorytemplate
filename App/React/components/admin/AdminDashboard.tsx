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
            <div className="adminStatCabecera">
                <span className="adminStatTitulo">{titulo}</span>
                <div className={`adminStatIcono adminStatIcono--${color}`}>
                    {icono}
                </div>
            </div>
            <span className="adminStatValor">{valor}</span>
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
                        /* Calendario con marca de check */
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="4" width="18" height="18" rx="2.5" />
                            <path d="M8 2v4M16 2v4M3 10h18" />
                            <path d="M8 15l2.5 2.5L16 13" />
                        </svg>
                    }
                />
                <TarjetaStat
                    titulo="Confirmadas"
                    valor={String(stats.reservasConfirmadas)}
                    color="exito"
                    icono={
                        /* Escudo con check — confianza/confirmado */
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 2L3 6v6c0 5.25 3.75 10.15 9 11.25C17.25 22.15 21 17.25 21 12V6l-9-4z" />
                            <path d="M8.5 12l2.5 2.5 4.5-4.5" />
                        </svg>
                    }
                />
                <TarjetaStat
                    titulo="Pendientes"
                    valor={String(stats.reservasPendientes)}
                    color="aviso"
                    icono={
                        /* Reloj de arena — espera/pendiente */
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M5 2h14M5 22h14" />
                            <path d="M6 2v6l4 4-4 4v6M18 2v6l-4 4 4 4v6" />
                        </svg>
                    }
                />
                <TarjetaStat
                    titulo="Ingresos del mes"
                    valor={formatearEuros(stats.ingresosMes)}
                    color="primario"
                    icono={
                        /* Billete / ingreso mensual */
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="2" y="6" width="20" height="13" rx="2" />
                            <circle cx="12" cy="12.5" r="2.5" />
                            <path d="M6 6V5a2 2 0 012-2h8a2 2 0 012 2v1" />
                        </svg>
                    }
                />
                <TarjetaStat
                    titulo="Ingresos totales"
                    valor={formatearEuros(stats.ingresosTotales)}
                    color="exito"
                    icono={
                        /* Tendencia al alza */
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 17 8.5 11 13 14.5 21 6" />
                            <polyline points="16 6 21 6 21 11" />
                        </svg>
                    }
                />
                <TarjetaStat
                    titulo="Vehículos activos"
                    valor={String(stats.vehiculosActivos)}
                    color="primario"
                    icono={
                        /* Furgoneta camper más detallada */
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 11l2-5h12l2 5" />
                            <rect x="2" y="11" width="20" height="6" rx="1.5" />
                            <circle cx="7" cy="17" r="2" />
                            <circle cx="17" cy="17" r="2" />
                            <path d="M5 11V8M9 6h6" />
                        </svg>
                    }
                />
                <TarjetaStat
                    titulo="Clientes únicos"
                    valor={String(stats.clientesUnicos)}
                    color="primario"
                    icono={
                        /* Grupo de personas */
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="9" cy="7" r="3" />
                            <path d="M2 21v-1a7 7 0 0114 0v1" />
                            <circle cx="18" cy="7" r="2.5" />
                            <path d="M22 21v-1a5 5 0 00-5-5" />
                        </svg>
                    }
                />
            </div>
        </div>
    );
}
