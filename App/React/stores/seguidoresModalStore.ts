/*
 * Store: seguidoresModalStore — Kamples (QQ32)
 * Estado global para el modal de seguidores.
 * Abrir/cerrar + username del perfil a consultar.
 */

import { create } from 'zustand';

interface SeguidoresModalState {
    abierto: boolean;
    username: string | null;
    abrir: (username: string) => void;
    cerrar: () => void;
}

export const useSeguidoresModalStore = create<SeguidoresModalState>((set) => ({
    abierto: false,
    username: null,
    abrir: (username) => set({ abierto: true, username }),
    cerrar: () => set({ abierto: false, username: null }),
}));
