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
}

interface EstadoTabsTopBar {
    tabs: TabTopBar[];
    activa: string;
    /* Memoria de última tab seleccionada por isla (persistencia keep-alive) */
    tabsPorIsla: Record<string, string>;
    setTabs: (tabs: TabTopBar[], activaInicial?: string, islaId?: string) => void;
    setActiva: (id: string) => void;
    /* Registra la tab activa para una isla en la memoria keep-alive */
    guardarTabIsla: (islaId: string, tabId: string) => void;
    limpiar: () => void;
}

export const useTabsTopBarStore = create<EstadoTabsTopBar>((set, get) => ({
    tabs: [],
    activa: '',
    tabsPorIsla: {},
    setTabs: (tabs, activaInicial, islaId) => {
        /* Si hay isla y tiene una tab guardada, restaurarla en vez de usar la inicial */
        const { tabsPorIsla } = get();
        let tabRestaurada = activaInicial ?? tabs[0]?.id ?? '';
        if (islaId && tabsPorIsla[islaId]) {
            /* Verificar que la tab guardada sigue existiendo en las tabs actuales */
            const existe = tabs.some(t => t.id === tabsPorIsla[islaId]);
            if (existe) {
                tabRestaurada = tabsPorIsla[islaId];
            }
        }
        set({ tabs, activa: tabRestaurada });
    },
    setActiva: (activa) => set({ activa }),
    guardarTabIsla: (islaId, tabId) =>
        set(state => ({
            tabsPorIsla: { ...state.tabsPorIsla, [islaId]: tabId },
        })),
    limpiar: () => set({ tabs: [], activa: '' }),
}));
