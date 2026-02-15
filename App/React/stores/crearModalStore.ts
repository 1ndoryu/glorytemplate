/*
 * Store: crearModalStore — Kamples
 * Controla el modal unificado de creación (publicación social + subida de samples).
 * Reemplaza subirModalStore y publicarModalStore.
 */

import { create } from 'zustand';

interface EstadoCrearModal {
    abierto: boolean;
    abrir: () => void;
    cerrar: () => void;
}

export const useCrearModalStore = create<EstadoCrearModal>((set) => ({
    abierto: false,
    abrir: () => set({ abierto: true }),
    cerrar: () => set({ abierto: false }),
}));
