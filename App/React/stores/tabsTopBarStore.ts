/*
 * Store: tabsTopBarStore — Kamples
 * Gestiona las tabs que se muestran en el TopBar.
 * Cada isla define sus tabs al montarse via setTabs.
 *
 * tabsPorIsla: guarda la última tab seleccionada por cada isla (keep-alive).
 * Cuando una isla vuelve a activarse, se restaura su tab anterior
 * en vez de resetear siempre a la inicial.
 */

import { create } from 'zustand';

export interface TabTopBar {
    id: string;
    etiqueta: string;
    icono?: React.ReactNode;
}

interface EstadoTabsTopBar {
    tabs: TabTopBar[];
    activa: string;
    islaTabsActual: string | null;
    /* Memoria de última tab seleccionada por isla (persistencia keep-alive) */
    tabsPorIsla: Record<string, string>;
    setTabs: (tabs: TabTopBar[], activaInicial?: string, islaId?: string) => void;
    setActiva: (id: string) => void;
    /* Registra la tab activa para una isla en la memoria keep-alive */
    guardarTabIsla: (islaId: string, tabId: string) => void;
    limpiar: (islaId?: string) => void;
}

export const useTabsTopBarStore = create<EstadoTabsTopBar>((set, get) => ({
    tabs: [],
    activa: '',
    islaTabsActual: null,
    tabsPorIsla: {},
    setTabs: (tabs, activaInicial, islaId) => {
        /* QK56: Prioridad de restauración: URL param > memoria keep-alive > inicial */
        const { tabsPorIsla } = get();
        let tabRestaurada = activaInicial ?? tabs[0]?.id ?? '';

        /* Restaurar desde URL si hay ?tab= */
        const urlTab = new URLSearchParams(window.location.search).get('tab');
        if (urlTab && tabs.some(t => t.id === urlTab)) {
            tabRestaurada = urlTab;
        } else if (islaId && tabsPorIsla[islaId]) {
            /* Verificar que la tab guardada sigue existiendo en las tabs actuales */
            const existe = tabs.some(t => t.id === tabsPorIsla[islaId]);
            if (existe) {
                tabRestaurada = tabsPorIsla[islaId];
            }
        }
        set({ tabs, activa: tabRestaurada, islaTabsActual: islaId ?? null });
    },
    setActiva: (activa) => set({ activa }),
    guardarTabIsla: (islaId, tabId) =>
        set(state => ({
            tabsPorIsla: { ...state.tabsPorIsla, [islaId]: tabId },
        })),
    limpiar: (islaId) =>
        set(state => {
            if (islaId && state.islaTabsActual !== islaId) {
                return state;
            }

            return { ...state, tabs: [], activa: '', islaTabsActual: null };
        }),
}));
