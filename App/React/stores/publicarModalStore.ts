/*
 * Store: publicarModalStore — Kamples
 * Controla el estado del modal de publicación social.
 * C802c: Soporta relacionId para adjuntar sample a una relacion de sampleo especifica.
 */

import { create } from 'zustand';

interface EstadoPublicarModal {
    abierto: boolean;
    modo: 'social' | 'sample';
    /* ID de la relacion de sampleo a la que se va a adjuntar el sample (opcional) */
    relacionId: number | null;
    abrir: (modo?: 'social' | 'sample', relacionId?: number | null) => void;
    cerrar: () => void;
}

export const usePublicarModalStore = create<EstadoPublicarModal>((set) => ({
    abierto: false,
    modo: 'social',
    relacionId: null,
    abrir: (modo = 'social', relacionId = null) => set({ abierto: true, modo, relacionId }),
    cerrar: () => set({ abierto: false, relacionId: null }),
}));
