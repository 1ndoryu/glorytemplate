/*
 * Store: notificacionStore — Kamples
 * Estado global de notificaciones (toasts) y notificaciones persistentes.
 */

import { create } from 'zustand';
import type { DatosToast, TipoToast } from '../components/ui/Notificacion';

interface EstadoNotificacion {
    toasts: DatosToast[];
    contadorNoLeidas: number;

    /* Acciones */
    agregarToast: (tipo: TipoToast, titulo: string, mensaje?: string, duracionMs?: number) => void;
    quitarToast: (id: string) => void;
    limpiarToasts: () => void;
    setContadorNoLeidas: (n: number) => void;
}

let contadorId = 0;

export const useNotificacionStore = create<EstadoNotificacion>((set) => ({
    toasts: [],
    contadorNoLeidas: 0,

    agregarToast: (tipo, titulo, mensaje, duracionMs) => {
        const nuevoToast: DatosToast = {
            id: `toast-${++contadorId}-${Date.now()}`,
            tipo,
            titulo,
            mensaje,
            duracionMs,
        };

        set((s) => ({
            toasts: [...s.toasts.slice(-4), nuevoToast],
        }));
    },

    quitarToast: (id) =>
        set((s) => ({
            toasts: s.toasts.filter((t) => t.id !== id),
        })),

    limpiarToasts: () => set({ toasts: [] }),

    setContadorNoLeidas: (n) => set({ contadorNoLeidas: n }),
}));
