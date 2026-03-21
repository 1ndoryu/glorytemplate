/**
 * Store de navegación del Dashboard CAP
 *
 * Gestiona el estado global de navegación y UI del dashboard.
 * Utiliza Zustand para estado ligero y sin boilerplate.
 * El estado de sidebarColapsado persiste en localStorage.
 */

import {create} from 'zustand';
import {persist} from 'zustand/middleware';

export type SeccionActiva = 'calendario' | 'alumnos' | 'configuracion' | 'reportes' | 'clientes' | 'documentacion';

interface DashboardState {
    seccionActiva: SeccionActiva;
    sidebarAbierto: boolean;
    sidebarColapsado: boolean;
    setSeccionActiva: (seccion: SeccionActiva) => void;
    toggleSidebar: () => void;
    abrirSidebar: () => void;
    cerrarSidebar: () => void;
    toggleSidebarColapsado: () => void;
}

export const useDashboardStore = create<DashboardState>()(
    persist(
        set => ({
            seccionActiva: 'calendario',
            sidebarAbierto: false,
            sidebarColapsado: false,
            setSeccionActiva: seccion => set({seccionActiva: seccion, sidebarAbierto: false}),
            toggleSidebar: () => set(state => ({sidebarAbierto: !state.sidebarAbierto})),
            abrirSidebar: () => set({sidebarAbierto: true}),
            cerrarSidebar: () => set({sidebarAbierto: false}),
            /* Ajuste: alternar sidebar colapsado en escritorio. */
            toggleSidebarColapsado: () => set(state => ({sidebarColapsado: !state.sidebarColapsado}))
        }),
        {
            name: 'dashboard-store',
            /* Solo persiste el estado colapsado del sidebar, no toda la navegación */
            partialize: state => ({sidebarColapsado: state.sidebarColapsado})
        }
    )
);
