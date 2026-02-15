/*
 * Store: configuracionModalStore — Kamples (FASE 1.2)
 * Controla la apertura/cierre del modal de configuración de perfil.
 */

import { create } from 'zustand';

interface ConfiguracionModalState {
    abierto: boolean;
    abrir: () => void;
    cerrar: () => void;
}

export const useConfiguracionModalStore = create<ConfiguracionModalState>((set) => ({
    abierto: false,
    abrir: () => set({ abierto: true }),
    cerrar: () => set({ abierto: false }),
}));
