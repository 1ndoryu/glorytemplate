/*
 * Store: generosModalStore — Kamples (QQ45)
 * Estado global para el modal de seleccion de generos favoritos.
 * Se abre automaticamente para usuarios nuevos sin generos y desde configuracion.
 */

import { create } from 'zustand';

interface GenerosModalState {
    abierto: boolean;
    abrir: () => void;
    cerrar: () => void;
}

export const useGenerosModalStore = create<GenerosModalState>((set) => ({
    abierto: false,
    abrir: () => set({ abierto: true }),
    cerrar: () => set({ abierto: false }),
}));
