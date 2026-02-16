/*
 * Store: toastStore — Kamples
 * Sistema de notificaciones toast en esquina inferior derecha.
 * Soporta acciones (confirmar/cancelar/deshacer) y auto-cierre.
 */

import { create } from 'zustand';

export type ToastTipo = 'info' | 'exito' | 'error' | 'confirmacion';

export interface ToastAccion {
    etiqueta: string;
    onClick: () => void;
    variante?: 'primario' | 'peligro' | 'neutro';
}

export interface Toast {
    id: string;
    mensaje: string;
    tipo: ToastTipo;
    acciones?: ToastAccion[];
    duracion?: number;
    eliminando?: boolean;
}

interface EstadoToast {
    toasts: Toast[];
    agregar: (toast: Omit<Toast, 'id'>) => string;
    quitar: (id: string) => void;
    limpiar: () => void;
}

let contadorId = 0;

export const useToastStore = create<EstadoToast>((set) => ({
    toasts: [],

    agregar: (toast) => {
        const id = `toast_${++contadorId}_${Date.now()}`;
        const nuevoToast: Toast = { ...toast, id };

        set((prev) => ({
            toasts: [...prev.toasts, nuevoToast],
        }));

        /* Auto-cierre si no es confirmación */
        if (toast.tipo !== 'confirmacion') {
            const duracion = toast.duracion ?? 4000;
            setTimeout(() => {
                set((prev) => ({
                    toasts: prev.toasts.map((t) =>
                        t.id === id ? { ...t, eliminando: true } : t
                    ),
                }));
                /* Dar tiempo a la animación de salida */
                setTimeout(() => {
                    set((prev) => ({
                        toasts: prev.toasts.filter((t) => t.id !== id),
                    }));
                }, 300);
            }, duracion);
        }

        return id;
    },

    quitar: (id) => {
        set((prev) => ({
            toasts: prev.toasts.map((t) =>
                t.id === id ? { ...t, eliminando: true } : t
            ),
        }));
        setTimeout(() => {
            set((prev) => ({
                toasts: prev.toasts.filter((t) => t.id !== id),
            }));
        }, 300);
    },

    limpiar: () => set({ toasts: [] }),
}));

/*
 * Helpers para uso rápido desde cualquier parte de la app.
 * Evitan importar el store completo.
 */

export const toast = {
    info: (mensaje: string, duracion?: number) =>
        useToastStore.getState().agregar({ mensaje, tipo: 'info', duracion }),

    exito: (mensaje: string, acciones?: ToastAccion[], duracion?: number) =>
        useToastStore.getState().agregar({ mensaje, tipo: 'exito', acciones, duracion }),

    error: (mensaje: string, duracion?: number) =>
        useToastStore.getState().agregar({ mensaje, tipo: 'error', duracion: duracion ?? 6000 }),

    confirmar: (mensaje: string, onConfirmar: () => void, onCancelar?: () => void) =>
        useToastStore.getState().agregar({
            mensaje,
            tipo: 'confirmacion',
            acciones: [
                {
                    etiqueta: 'Cancelar',
                    variante: 'neutro',
                    onClick: () => {
                        onCancelar?.();
                    },
                },
                {
                    etiqueta: 'Confirmar',
                    variante: 'peligro',
                    onClick: () => {
                        onConfirmar();
                    },
                },
            ],
        }),
};
