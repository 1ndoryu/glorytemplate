/*
 * Isla: AdminPanelIsland — Kamples (FASE 13)
 * Panel de administración principal con tabs iconizadas en TopBar.
 * D4: Tabs migradas al TopBar global via useTabsIsla (consistencia con otras islas).
 * D5: Tab Duplicados para moderación de samples duplicados.
 * C808: Tab Procesos para gestión de procesos de fondo (scraping, extraccion, seed).
 * C807: Tab Contribuciones para moderación de contribuciones comunitarias.
 * QL21: Tabs con iconos + nueva tab Canciones.
 * Protegido por conAutenticacion + guard rol admin.
 */

import { Loader2, ShieldAlert, Users, Shield, BrainCircuit, Copy, Cog, HandHeart, Globe, Headphones, Music, Clock } from 'lucide-react';
import { EstadoVacio } from '@app/components/ui/EstadoVacio';
import { TabUsuariosAdmin } from '@app/components/admin/TabUsuariosAdmin';
import { TabModeracionAdmin } from '@app/components/admin/TabModeracionAdmin';
import { TabColaIaAdmin } from '@app/components/admin/TabColaIaAdmin';
import { TabDuplicadosAdmin } from '@app/components/admin/TabDuplicadosAdmin';
import { TabProcesosAdmin } from '@app/components/admin/TabProcesosAdmin';
import { TabContribucionesAdmin } from '@app/components/admin/TabContribucionesAdmin';
import { TabScrapersAdmin } from '@app/components/admin/TabScrapersAdmin';
import { TabColaExtraccionAdmin } from '@app/components/admin/TabColaExtraccionAdmin';
import { TabCancionesAdmin } from '@app/components/admin/TabCancionesAdmin';
import { TabHistorialLotesAdmin } from '@app/components/admin/TabHistorialLotesAdmin';
import { useAdminPanel } from '@app/hooks/useAdminPanel';
import { useTabsIsla } from '@app/hooks/useTabsIsla';
import { useAuthStore } from '@app/stores/authStore';
import { conAutenticacion } from '@app/components/auth/ConAutenticacion';
import type { TabTopBar } from '@app/stores/tabsTopBarStore';
import '../../styles/componentes/adminPanel.css';

/* QL21: Tabs con iconos — tamaño 16px para consistencia en TopBar */
const TAM_ICONO = 16;

const TABS_ADMIN: TabTopBar[] = [
    { id: 'usuarios', etiqueta: 'Usuarios', icono: <Users size={TAM_ICONO} /> },
    { id: 'moderacion', etiqueta: 'Moderación', icono: <Shield size={TAM_ICONO} /> },
    { id: 'cola-ia', etiqueta: 'Cola IA', icono: <BrainCircuit size={TAM_ICONO} /> },
    { id: 'duplicados', etiqueta: 'Duplicados', icono: <Copy size={TAM_ICONO} /> },
    { id: 'procesos', etiqueta: 'Procesos', icono: <Cog size={TAM_ICONO} /> },
    { id: 'contribuciones', etiqueta: 'Contribuciones', icono: <HandHeart size={TAM_ICONO} /> },
    { id: 'scrapers', etiqueta: 'Scrapers', icono: <Globe size={TAM_ICONO} /> },
    { id: 'cola-extraccion', etiqueta: 'Cola Extracción', icono: <Headphones size={TAM_ICONO} /> },
    { id: 'canciones', etiqueta: 'Canciones', icono: <Music size={TAM_ICONO} /> },
    { id: 'historial', etiqueta: 'Historial', icono: <Clock size={TAM_ICONO} /> },
];

const AdminPanelBase = (): JSX.Element => {
    const usuario = useAuthStore(s => s.usuario);
    const admin = useAdminPanel();

    /* D4: Registrar tabs en el TopBar global */
    useTabsIsla('AdminPanelIsland', TABS_ADMIN, 'usuarios');

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
            {admin.tabActiva === 'usuarios' && (
                <TabUsuariosAdmin
                    kpis={admin.kpis}
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

            {admin.tabActiva === 'scrapers' && (
                <TabScrapersAdmin />
            )}

            {admin.tabActiva === 'cola-extraccion' && (
                <TabColaExtraccionAdmin />
            )}

            {admin.tabActiva === 'canciones' && (
                <TabCancionesAdmin />
            )}

            {admin.tabActiva === 'historial' && (
                <TabHistorialLotesAdmin />
            )}
        </div>
    );
};

export const AdminPanelIsland = conAutenticacion(AdminPanelBase);
