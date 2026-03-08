/*
 * Store: notificacionesStore
 * Orquesta cache, conteo no leído y cola de toasts por sesión.
 */

import { create } from 'zustand';
import type { Notificacion } from '@app/services/apiNotificaciones';
import type { NotificacionUI } from '@app/types/notificaciones';
import { mapearNotificacionApiANotificacionUI } from '@app/utils/notificaciones';

const CACHE_TTL_MS = 2 * 60 * 1000;

interface EstadoNotificaciones {
    notificaciones: NotificacionUI[];
    inicializado: boolean;
    cargandoVisible: boolean;
    cargandoSilencioso: boolean;
    notificacionesCargadas: boolean;
    ultimaCarga: number;
    colaToasts: number[];
    idsToastMostrados: Record<string, true>;

    hidratarNotificaciones: (notificaciones: Notificacion[], silenciosa?: boolean) => void;
    setCargandoVisible: (v: boolean) => void;
    setCargandoSilencioso: (v: boolean) => void;
    marcarLeidaLocal: (id: number) => void;
    marcarTodasLeidasLocal: () => void;
    totalNoLeidas: () => number;
    necesitaRefrescar: () => boolean;
    consumirSiguienteToast: () => NotificacionUI | null;
}

export const useNotificacionesStore = create<EstadoNotificaciones>((set, get) => ({
    notificaciones: [],
    inicializado: false,
    cargandoVisible: false,
    cargandoSilencioso: false,
    notificacionesCargadas: false,
    ultimaCarga: 0,
    colaToasts: [],
    idsToastMostrados: {},

    hidratarNotificaciones: (notificaciones, silenciosa = false) => {
        const estadoActual = get();
        const notificacionesMapeadas = notificaciones.map(mapearNotificacionApiANotificacionUI);
        const idsPrevios = new Set(estadoActual.notificaciones.map((item) => item.id));

        const nuevosToastIds = estadoActual.inicializado
            ? notificacionesMapeadas
                .filter((item) => (
                    !item.leida
                    && item.permiteToast
                    && !idsPrevios.has(item.id)
                    && !estadoActual.idsToastMostrados[String(item.id)]
                ))
                .map((item) => item.id)
            : [];

        set({
            notificaciones: notificacionesMapeadas,
            inicializado: true,
            notificacionesCargadas: true,
            ultimaCarga: Date.now(),
            cargandoVisible: false,
            cargandoSilencioso: false,
            colaToasts: silenciosa
                ? [...estadoActual.colaToasts, ...nuevosToastIds]
                : [...estadoActual.colaToasts, ...nuevosToastIds],
        });
    },

    setCargandoVisible: (v) => set({ cargandoVisible: v }),

    setCargandoSilencioso: (v) => set({ cargandoSilencioso: v }),

    marcarLeidaLocal: (id) =>
        set((state) => ({
            notificaciones: state.notificaciones.map((item) => (
                item.id === id ? { ...item, leida: true } : item
            )),
        })),

    marcarTodasLeidasLocal: () =>
        set((state) => ({
            notificaciones: state.notificaciones.map((item) => ({ ...item, leida: true })),
        })),

    totalNoLeidas: () => {
        return get().notificaciones.filter((item) => !item.leida).length;
    },

    necesitaRefrescar: () => {
        const { notificacionesCargadas, ultimaCarga } = get();
        if (!notificacionesCargadas) return true;
        return Date.now() - ultimaCarga > CACHE_TTL_MS;
    },

    consumirSiguienteToast: () => {
        const estadoActual = get();
        const siguienteId = estadoActual.colaToasts[0];

        if (!siguienteId) return null;

        const siguiente = estadoActual.notificaciones.find((item) => item.id === siguienteId) ?? null;

        set({
            colaToasts: estadoActual.colaToasts.slice(1),
            idsToastMostrados: siguiente
                ? {
                    ...estadoActual.idsToastMostrados,
                    [String(siguiente.id)]: true,
                }
                : estadoActual.idsToastMostrados,
        });

        return siguiente;
    },
}));
