/*
 * DashboardEncabezado
 * Componente del header del dashboard
 * Responsabilidad única: mostrar logo, título y navegación
 */

interface DashboardEncabezadoProps {
    titulo?: string;
    version?: string;
    usuario?: string;
}

export function DashboardEncabezado({titulo = 'DASHBOARD_01', version = 'v1.0.0-beta', usuario = 'user@admin'}: DashboardEncabezadoProps): JSX.Element {
    return (
        <header id="dashboard-encabezado" className="dashboardEncabezado">
            <div className="encabezadoLogo">
                <div className="encabezadoIndicador"></div>
                <span className="encabezadoTitulo">{titulo}</span>
            </div>
            <nav className="encabezadoNav">
                <span className="encabezadoEnlace">{version}</span>
                <span className="encabezadoEnlace">{usuario}</span>
            </nav>
        </header>
    );
}
