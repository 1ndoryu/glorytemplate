/*
 * DashboardFooter
 * Pie de página del dashboard
 * Responsabilidad única: mostrar información del sistema y fecha
 */

interface DashboardFooterProps {
    mensaje?: string;
}

export function DashboardFooter({mensaje = 'SYSTEM_READY'}: DashboardFooterProps): JSX.Element {
    const fechaFormateada = new Date().toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    return (
        <footer id="dashboard-footer" className="dashboardFooter">
            <p>
                {mensaje} • {fechaFormateada}
            </p>
        </footer>
    );
}
