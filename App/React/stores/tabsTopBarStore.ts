/*
 * Store: tabsTopBarStore — Kamples
 * Gestiona las tabs que se muestran en el TopBar.
 * Cada isla define sus tabs al montarse via setTabs.
 */

import { create } from 'zustand';

export interface TabTopBar {
    id: string;
    etiqueta: string;
}

interface EstadoTabsTopBar {
    tabs: TabTopBar[];
    activa: string;
    setTabs: (tabs: TabTopBar[], activaInicial?: string) => void;
    setActiva: (id: string) => void;
    limpiar: () => void;
}

export const useTabsTopBarStore = create<EstadoTabsTopBar>((set) => ({
    tabs: [],
    activa: '',
    setTabs: (tabs, activaInicial) =>
        set({ tabs, activa: activaInicial ?? tabs[0]?.id ?? '' }),
    setActiva: (activa) => set({ activa }),
    limpiar: () => set({ tabs: [], activa: '' }),
}));
