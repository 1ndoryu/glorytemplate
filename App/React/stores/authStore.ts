/*
 * Store: authStore — Kamples
 * Estado global de autenticación y usuario actual.
 */

import { create } from 'zustand';
import type { UsuarioAutenticado } from '../types';

interface EstadoAuth {
    usuario: UsuarioAutenticado | null;
    cargando: boolean;
    autenticado: boolean;

    /* Acciones */
    setUsuario: (usuario: UsuarioAutenticado | null) => void;
    setCargando: (cargando: boolean) => void;
    cerrarSesion: () => void;
}

export const useAuthStore = create<EstadoAuth>((set) => ({
    usuario: null,
    cargando: true,
    autenticado: false,

    setUsuario: (usuario) =>
        set({
            usuario,
            autenticado: usuario !== null,
            cargando: false,
        }),

    setCargando: (cargando) => set({ cargando }),

    cerrarSesion: () =>
        set({
            usuario: null,
            autenticado: false,
            cargando: false,
        }),
}));
