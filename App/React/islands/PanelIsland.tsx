/**
 * PanelIsland — Isla principal del panel de administración.
 * Guarda de acceso + composición de secciones admin.
 */

import { useAdminPanel } from '@app/hooks/useAdminPanel';
import { AdminSidebar } from '@app/components/admin/AdminSidebar';
import { AdminDashboard } from '@app/components/admin/AdminDashboard';
import { AdminReservas } from '@app/components/admin/AdminReservas';
import { AdminFlota } from '@app/components/admin/AdminFlota';
import { AdminClientes } from '@app/components/admin/AdminClientes';
import { AdminConfiguracion } from '@app/components/admin/AdminConfiguracion';
import { Header } from '@app/components/Header';
import { Boton } from '@app/components/ui/Boton';
import { GloryLink } from '@/core/router/GloryLink';

function ContenidoSeccion(props: ReturnType<typeof useAdminPanel>): JSX.Element {
    switch (props.seccion) {
        case 'dashboard':
            return (
                <AdminDashboard
                    estadisticas={props.estadisticas}
                    loading={props.loadingEstadisticas}
                />
            );
        case 'reservas':
            return (
                <AdminReservas
                    reservas={props.reservas}
                    loading={props.loadingReservas}
                    filtroEstado={props.filtroEstadoReserva}
                    onFiltroChange={props.setFiltroEstadoReserva}
                    onCambiarEstado={props.cambiarEstadoReserva}
                />
            );
        case 'flota':
            return (
                <AdminFlota
                    vehiculos={props.vehiculos}
                    loading={props.loadingVehiculos}
                    onGuardar={props.guardarVehiculo}
                    onToggleActivo={props.toggleActivoVehiculo}
                    onEliminar={props.eliminarVehiculo}
                />
            );
        case 'clientes':
            return (
                <AdminClientes
                    clientes={props.clientes}
                    loading={props.loadingClientes}
                />
            );
        case 'configuracion':
            return (
                <AdminConfiguracion
                    configuracion={props.configuracion}
                    loading={props.loadingConfiguracion}
                    onGuardar={props.guardarConfiguracion}
                />
            );
    }
}

export function PanelIsland(): JSX.Element {
    const panel = useAdminPanel();

    /* Guarda de acceso — solo admins */
    if (!panel.isAdmin) {
        return (
            <div className="paginaBase">
                <Header />
                <div className="adminAccesoDenegado">
                    <h1>Acceso restringido</h1>
                    <p>No tienes permisos para acceder al panel de administración.</p>
                    <GloryLink href="/" className="boton botonPrimario">Volver al inicio</GloryLink>
                </div>
            </div>
        );
    }

    return (
        <div className="adminPagina">
            <Header />

            <div className="adminLayout">
                <AdminSidebar
                    seccion={panel.seccion}
                    onChange={panel.setSeccion}
                />
                <main className="adminContenido">
                    {panel.error && (
                        <div className="adminErrorBanner">
                            <span>{panel.error}</span>
                            <Boton
                                variante="icono"
                                className="adminErrorCerrar"
                                onClick={panel.limpiarError}
                                aria-label="Cerrar error"
                            >
                                &times;
                            </Boton>
                        </div>
                    )}
                    <ContenidoSeccion {...panel} />
                </main>
            </div>
        </div>
    );
}
