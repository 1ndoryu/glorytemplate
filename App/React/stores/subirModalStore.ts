/*
 * Store: subirModalStore — Kamples
 * Estado global para controlar la apertura/cierre del modal de subida de samples.
 * Separado en su propio store para cumplir SRP.
 */

import { create } from 'zustand';

interface SubirModalState {
    abierto: boolean;
    abrir: () => void;
    cerrar: () => void;
    toggle: () => void;
}

export const useSubirModalStore = create<SubirModalState>((set) => ({
    abierto: false,
    abrir: () => set({ abierto: true }),
    cerrar: () => set({ abierto: false }),
    toggle: () => set((s) => ({ abierto: !s.abierto })),
}));
