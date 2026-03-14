/*
 * Isla: AdminPanelIsland — Kamples (FASE 13)
 * Panel de administración principal con tabs: Resumen, Usuarios, Moderación, Cola IA, Duplicados, Procesos.
 * D4: Tabs migradas al TopBar global via useTabsIsla (consistencia con otras islas).
 * D5: Tab Duplicados para moderación de samples duplicados.
 * C808: Tab Procesos para gestión de procesos de fondo (scraping, extraccion, seed).
 * C807: Tab Contribuciones para moderación de contribuciones comunitarias.
 * Protegido por conAutenticacion + guard rol admin.
 */

import { Loader2, ShieldAlert } from 'lucide-react';
import { EstadoVacio } from '@app/components/ui/EstadoVacio';
import { TabResumenAdmin } from '@app/components/admin/TabResumenAdmin';
import { TabUsuariosAdmin } from '@app/components/admin/TabUsuariosAdmin';
import { TabModeracionAdmin } from '@app/components/admin/TabModeracionAdmin';
import { TabColaIaAdmin } from '@app/components/admin/TabColaIaAdmin';
import { TabDuplicadosAdmin } from '@app/components/admin/TabDuplicadosAdmin';
import { TabProcesosAdmin } from '@app/components/admin/TabProcesosAdmin';
import { TabContribucionesAdmin } from '@app/components/admin/TabContribucionesAdmin';
import { useAdminPanel } from '@app/hooks/useAdminPanel';
import { useTabsIsla } from '@app/hooks/useTabsIsla';
import { useAuthStore } from '@app/stores/authStore';
import { conAutenticacion } from '@app/components/auth/ConAutenticacion';
import '../../styles/componentes/adminPanel.css';

/* Definición de tabs — registradas en TopBar via useTabsIsla */
const TABS_ADMIN = [
    { id: 'resumen', etiqueta: 'Resumen' },
    { id: 'usuarios', etiqueta: 'Usuarios' },
    { id: 'moderacion', etiqueta: 'Moderación' },
    { id: 'cola-ia', etiqueta: 'Cola IA' },
    { id: 'duplicados', etiqueta: 'Duplicados' },
    { id: 'procesos', etiqueta: 'Procesos' },
    { id: 'contribuciones', etiqueta: 'Contribuciones' },
];

const AdminPanelBase = (): JSX.Element => {
    const usuario = useAuthStore(s => s.usuario);
    const admin = useAdminPanel();

    /* D4: Registrar tabs en el TopBar global */
    useTabsIsla('AdminPanelIsland', TABS_ADMIN, 'resumen');

    /* Guard: solo admins pueden ver este panel */
    if (usuario?.rol !== 'admin') {
        return (
            <div className="adminPanel">
                <EstadoVacio
                    mensaje="No tienes permisos para acceder al panel de administración."
                    icono={<ShieldAlert size={32} />}
                />
            </div>
        );
    }

    /* Cargando datos iniciales */
    if (admin.cargando) {
        return (
            <div className="adminCargando">
                <Loader2 size={24} className="adminSpinner" />
            </div>
        );
    }

    return (
        <div className="adminPanel" id="adminPanel">
            {admin.tabActiva === 'resumen' && (
                <TabResumenAdmin
                    kpis={admin.kpis}
                    actividad={admin.actividad}
                    colaIaStats={admin.colaIaStats}
                    colaIaRecientes={admin.colaIaRecientes}
                />
            )}

            {admin.tabActiva === 'usuarios' && (
                <TabUsuariosAdmin
                    usuarios={admin.usuarios}
                    totalUsuarios={admin.totalUsuarios}
                    pagina={admin.paginaUsuarios}
                    busqueda={admin.busquedaUsuarios}
                    filtroPlan={admin.filtroPlannUsuarios}
                    onCambiarPagina={admin.setPaginaUsuarios}
                    onCambiarBusqueda={admin.setBusquedaUsuarios}
                    onCambiarFiltroPlan={admin.setFiltroPlannUsuarios}
                    onActualizarUsuario={admin.actualizarUsuario}
                    onRefrescar={admin.cargarUsuarios}
                />
            )}

            {admin.tabActiva === 'moderacion' && (
                <TabModeracionAdmin
                    moderacion={admin.moderacion}
                    historialModeracion={admin.historialModeracion}
                    onModerar={admin.moderar}
                    onResolverReporte={admin.manejarResolverReporte}
                    onRechazarTodosPendientes={admin.manejarRechazarTodosPendientes}
                    onBanear={admin.banear}
                    onRechazarTodasDeUsuario={admin.rechazarTodasDeUsuario}
                />
            )}

            {admin.tabActiva === 'cola-ia' && (
                <TabColaIaAdmin />
            )}

            {admin.tabActiva === 'duplicados' && (
                <TabDuplicadosAdmin />
            )}

            {admin.tabActiva === 'procesos' && (
                <TabProcesosAdmin />
            )}

            {admin.tabActiva === 'contribuciones' && (
                <TabContribucionesAdmin />
            )}
        </div>
    );
};

export const AdminPanelIsland = conAutenticacion(AdminPanelBase);
