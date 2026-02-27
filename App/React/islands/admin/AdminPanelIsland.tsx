/*
 * Isla: AdminPanelIsland — Kamples (FASE 13)
 * Panel de administración principal con tabs: Resumen, Usuarios, Moderación.
 * Protegido por conAutenticacion + guard rol admin.
 */

import { Loader2, ShieldAlert } from 'lucide-react';
import { TabBar } from '@app/components/ui/TabBar';
import type { TabDefinicion } from '@app/components/ui';
import { TabResumenAdmin } from '@app/components/admin/TabResumenAdmin';
import { TabUsuariosAdmin } from '@app/components/admin/TabUsuariosAdmin';
import { TabModeracionAdmin } from '@app/components/admin/TabModeracionAdmin';
import { TabColaIaAdmin } from '@app/components/admin/TabColaIaAdmin';
import { useAdminPanel } from '@app/hooks/useAdminPanel';
import { useAuthStore } from '@app/stores/authStore';
import { conAutenticacion } from '@app/components/auth/ConAutenticacion';
import '../../styles/componentes/adminPanel.css';

/* Definición de tabs */
const TABS_ADMIN: TabDefinicion[] = [
    { id: 'resumen', etiqueta: 'Resumen' },
    { id: 'usuarios', etiqueta: 'Usuarios' },
    { id: 'moderacion', etiqueta: 'Moderación' },
    { id: 'cola-ia', etiqueta: 'Cola IA' },
];

const AdminPanelBase = (): JSX.Element => {
    const usuario = useAuthStore(s => s.usuario);
    const admin = useAdminPanel();

    /* Guard: solo admins pueden ver este panel */
    if (usuario?.rol !== 'admin') {
        return (
            <div className="adminPanel">
                <div className="adminVacio">
                    <ShieldAlert size={32} style={{ marginBottom: '0.75rem', opacity: 0.5 }} />
                    <div>No tienes permisos para acceder al panel de administración.</div>
                </div>
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
            <h1 className="adminPanelTitulo">Panel de Administración</h1>
            <p className="adminPanelSubtitulo">
                Gestiona usuarios, modera contenido y supervisa la plataforma.
            </p>

            <div className="adminPanelTabs">
                <TabBar
                    tabs={TABS_ADMIN}
                    activa={admin.tabActiva}
                    onChange={admin.setTabActiva}
                />
            </div>

            {admin.tabActiva === 'resumen' && (
                <TabResumenAdmin
                    kpis={admin.kpis}
                    actividad={admin.actividad}
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
                />
            )}

            {admin.tabActiva === 'moderacion' && (
                <TabModeracionAdmin
                    moderacion={admin.moderacion}
                    historialModeracion={admin.historialModeracion}
                    onModerar={admin.moderar}
                    onResolverReporte={admin.manejarResolverReporte}
                />
            )}

            {admin.tabActiva === 'cola-ia' && (
                <TabColaIaAdmin />
            )}
        </div>
    );
};

export const AdminPanelIsland = conAutenticacion(AdminPanelBase);
