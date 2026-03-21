/*
 * Store: authStore — Kamples
 * Estado global de autenticación y usuario actual.
 */

import { create } from 'zustand';
import type { UsuarioAutenticado } from '../types';

export interface EstadoAuth {
    usuario: UsuarioAutenticado | null;
    cargando: boolean;
    autenticado: boolean;
    /*
     * QK3: Indica si los datos del usuario vienen de la API /me (fuente completa)
     * y no de un cache parcial (Tauri Store, GLORY_CONTEXT fallback).
     * Previene decisiones basadas en datos incompletos (ej: abrir modal de generos
     * porque el cache no incluia generosPreferidos).
     */
    perfilVerificado: boolean;

    /* Acciones */
    setUsuario: (usuario: UsuarioAutenticado | null, verificado?: boolean) => void;
    setCargando: (cargando: boolean) => void;
    cerrarSesion: () => void;
}

export const useAuthStore = create<EstadoAuth>((set) => ({
    usuario: null,
    cargando: true,
    autenticado: false,
    perfilVerificado: false,

    setUsuario: (usuario, verificado) =>
        set({
            usuario,
            autenticado: usuario !== null,
            cargando: false,
            /* Si se pasa verificado explicitamente, usarlo.
             * Si no: true cuando se setea usuario (asume API), false cuando es null (logout). */
            perfilVerificado: verificado ?? (usuario !== null),
        }),

    setCargando: (cargando) => set({ cargando }),

    cerrarSesion: () =>
        set({
            usuario: null,
            autenticado: false,
            cargando: false,
            perfilVerificado: false,
        }),
}));
