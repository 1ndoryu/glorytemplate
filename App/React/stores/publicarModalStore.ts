/*
 * Store: publicarModalStore — Kamples
 * Controla el estado del modal de publicación social.
 */

import { create } from 'zustand';

interface EstadoPublicarModal {
    abierto: boolean;
    modo: 'social' | 'sample';
    abrir: (modo?: 'social' | 'sample') => void;
    cerrar: () => void;
}

export const usePublicarModalStore = create<EstadoPublicarModal>((set) => ({
    abierto: false,
    modo: 'social',
    abrir: (modo = 'social') => set({ abierto: true, modo }),
    cerrar: () => set({ abierto: false }),
}));
