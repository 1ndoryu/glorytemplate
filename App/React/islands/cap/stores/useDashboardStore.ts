/**
 * Store de navegación del Dashboard CAP
 *
 * Gestiona el estado global de navegación y UI del dashboard.
 * Utiliza Zustand para estado ligero y sin boilerplate.
 */

import {create} from 'zustand';

export type SeccionActiva = 'calendario' | 'alumnos' | 'configuracion';

interface DashboardState {
    /* Estado de navegación */
    seccionActiva: SeccionActiva;
    sidebarAbierto: boolean;

    /* Acciones */
    setSeccionActiva: (seccion: SeccionActiva) => void;
    toggleSidebar: () => void;
    abrirSidebar: () => void;
    cerrarSidebar: () => void;
}

export const useDashboardStore = create<DashboardState>(set => ({
    /* Estado inicial */
    seccionActiva: 'calendario',
    sidebarAbierto: false,

    /* Acciones */
    setSeccionActiva: seccion => set({seccionActiva: seccion, sidebarAbierto: false}),
    toggleSidebar: () => set(state => ({sidebarAbierto: !state.sidebarAbierto})),
    abrirSidebar: () => set({sidebarAbierto: true}),
    cerrarSidebar: () => set({sidebarAbierto: false})
}));
