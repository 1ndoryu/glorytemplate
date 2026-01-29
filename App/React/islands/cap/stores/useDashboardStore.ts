/**
 * Store de navegación del Dashboard CAP
 *
 * Gestiona el estado global de navegación y UI del dashboard.
 * Utiliza Zustand para estado ligero y sin boilerplate.
 */

import {create} from 'zustand';

export type SeccionActiva = 'calendario' | 'alumnos' | 'configuracion' | 'reportes';

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

export const useDashboardStore = create<DashboardState>(set => ({
    seccionActiva: 'calendario',
    sidebarAbierto: false,
    sidebarColapsado: false,
    setSeccionActiva: seccion => set({seccionActiva: seccion, sidebarAbierto: false}),
    toggleSidebar: () => set(state => ({sidebarAbierto: !state.sidebarAbierto})),
    abrirSidebar: () => set({sidebarAbierto: true}),
    cerrarSidebar: () => set({sidebarAbierto: false}),
    /* Ajuste: alternar sidebar colapsado en escritorio. */
    toggleSidebarColapsado: () => set(state => ({sidebarColapsado: !state.sidebarColapsado}))
}));
