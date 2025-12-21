/*
 * DashboardEncabezado
 * Componente del header del dashboard
 * Responsabilidad única: mostrar logo, título y navegación
 */

import {IndicadorSincronizacion} from '../shared';

interface SincronizacionInfo {
    sincronizado: boolean;
    pendiente: boolean;
    error: string | null;
    estaLogueado: boolean;
    sincronizarAhora: () => Promise<void>;
}

interface DashboardEncabezadoProps {
    titulo?: string;
    version?: string;
    usuario?: string;
    sincronizacion?: SincronizacionInfo;
}

export function DashboardEncabezado({titulo = 'DASHBOARD_01', version = 'v1.0.0-beta', usuario = 'user@admin', sincronizacion}: DashboardEncabezadoProps): JSX.Element {
    return (
        <header id="dashboard-encabezado" className="dashboardEncabezado">
            <div className="encabezadoLogo">
                <div className="encabezadoIndicador"></div>
                <span className="encabezadoTitulo">{titulo}</span>
            </div>
            <nav className="encabezadoNav">
                {sincronizacion && <IndicadorSincronizacion sincronizado={sincronizacion.sincronizado} pendiente={sincronizacion.pendiente} error={sincronizacion.error} estaLogueado={sincronizacion.estaLogueado} onSincronizar={sincronizacion.sincronizarAhora} />}
                <span className="encabezadoEnlace">{version}</span>
                <span className="encabezadoEnlace">{usuario}</span>
            </nav>
        </header>
    );
}
