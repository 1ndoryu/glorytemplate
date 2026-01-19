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
    setSeccionActiva: (seccion: SeccionActiva) => void;
    toggleSidebar: () => void;
    abrirSidebar: () => void;
    cerrarSidebar: () => void;
}

export const useDashboardStore = create<DashboardState>(set => ({
    seccionActiva: 'calendario',
    sidebarAbierto: false,
    setSeccionActiva: seccion => set({seccionActiva: seccion, sidebarAbierto: false}),
    toggleSidebar: () => set(state => ({sidebarAbierto: !state.sidebarAbierto})),
    abrirSidebar: () => set({sidebarAbierto: true}),
    cerrarSidebar: () => set({sidebarAbierto: false})
}));
