/*
 * Store: authModalStore
 * Controla apertura del modal de login/registro.
 * Vista puede ser 'login' o 'registro'.
 */

import { create } from 'zustand';

type VistaAuth = 'login' | 'registro';

interface AuthModalState {
    abierto: boolean;
    vista: VistaAuth;
    abrir: (vista?: VistaAuth) => void;
    cerrar: () => void;
    cambiarVista: (vista: VistaAuth) => void;
}

export const useAuthModalStore = create<AuthModalState>((set) => ({
    abierto: false,
    vista: 'login',
    abrir: (vista = 'login') => set({ abierto: true, vista }),
    cerrar: () => set({ abierto: false }),
    cambiarVista: (vista) => set({ vista }),
}));
