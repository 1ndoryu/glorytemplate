/*
 * Store para controlar la apertura del modal de planes.
 * Evita navegar a /planes/ (que desmonta la isla actual y recarga el feed).
 * Se usa desde TopBar, SampleDetalle, etc.
 */

import { create } from 'zustand';

interface PlanesModalState {
    abierto: boolean;
    abrir: () => void;
    cerrar: () => void;
}

export const usePlanesModalStore = create<PlanesModalState>((set) => ({
    abierto: false,
    abrir: () => set({ abierto: true }),
    cerrar: () => set({ abierto: false }),
}));
