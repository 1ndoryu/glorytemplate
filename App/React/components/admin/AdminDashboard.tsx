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
}

function TarjetaStat({ titulo, valor }: TarjetaStatProps): JSX.Element {
    return (
        <div className="adminStatTarjeta">
            <span className="adminStatTitulo">{titulo}</span>
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
                <TarjetaStat titulo="Reservas totales" valor={String(stats.totalReservas)} />
                <TarjetaStat titulo="Confirmadas" valor={String(stats.reservasConfirmadas)} />
                <TarjetaStat titulo="Pendientes" valor={String(stats.reservasPendientes)} />
                <TarjetaStat titulo="Ingresos del mes" valor={formatearEuros(stats.ingresosMes)} />
                <TarjetaStat titulo="Ingresos totales" valor={formatearEuros(stats.ingresosTotales)} />
                <TarjetaStat titulo="Vehículos activos" valor={String(stats.vehiculosActivos)} />
                <TarjetaStat titulo="Clientes únicos" valor={String(stats.clientesUnicos)} />
            </div>
        </div>
    );
}
