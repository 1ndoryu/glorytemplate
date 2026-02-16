/*
 * Store: devToolsStore — Kamples
 * Gestiona el modo de simulación para testing visual.
 * Permite cambiar plan y rol sin afectar datos reales ni API.
 * Solo override visual: los badges, gates de UI, y permisos frontend cambian.
 */

import { create } from 'zustand';
import type { TipoPlan, RolUsuario } from '../types';

interface OverrideVisual {
    plan?: TipoPlan;
    rol?: RolUsuario;
    simulaDeslogueado?: boolean;
}

interface EstadoDevTools {
    panelVisible: boolean;
    override: OverrideVisual | null;

    togglePanel: () => void;
    aplicarOverride: (override: OverrideVisual) => void;
    limpiarOverride: () => void;
}

export const useDevToolsStore = create<EstadoDevTools>((set) => ({
    panelVisible: false,
    override: null,

    togglePanel: () => set((s) => ({ panelVisible: !s.panelVisible })),

    aplicarOverride: (override) => set({ override }),

    limpiarOverride: () => set({ override: null }),
}));
