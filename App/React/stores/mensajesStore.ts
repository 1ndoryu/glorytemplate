/*
 * Store: mensajesStore — Kamples (Fase 7.2-7.3)
 * Estado global de conversaciones y mensajes activos.
 * C192: Cache de conversaciones para evitar re-fetch en cada apertura.
 * Prepara la integración con WebSocket (Fase 7.1).
 */

import { create } from 'zustand';
import type { Conversacion, Mensaje } from '../types';

/* TTL del cache: 2 minutos. Refresca en background si expiro */
const CACHE_TTL_MS = 2 * 60 * 1000;

interface EstadoMensajes {
    conversaciones: Conversacion[];
    conversacionActiva: number | null;
    mensajes: Mensaje[];
    cargandoConversaciones: boolean;
    cargandoMensajes: boolean;
    escribiendo: boolean;

    /* C192: Flags de cache */
    conversacionesCargadas: boolean;
    ultimaCargaConversaciones: number;

    /* Acciones */
    setConversaciones: (conversaciones: Conversacion[]) => void;
    setConversacionActiva: (id: number | null) => void;
    setMensajes: (mensajes: Mensaje[]) => void;
    agregarMensaje: (mensaje: Mensaje) => void;
    eliminarMensaje: (id: number) => void;
    setCargandoConversaciones: (v: boolean) => void;
    setCargandoMensajes: (v: boolean) => void;
    setEscribiendo: (v: boolean) => void;
    marcarConversacionLeida: (conversacionId: number) => void;
    marcarTodasLeidas: () => void;
    actualizarUltimoMensaje: (conversacionId: number, contenido: string) => void;
    totalNoLeidos: () => number;
    necesitaRefrescar: () => boolean;
}

export const useMensajesStore = create<EstadoMensajes>((set, get) => ({
    conversaciones: [],
    conversacionActiva: null,
    mensajes: [],
    /* C192: false por defecto — no mostrar "cargando" si ya hay cache */
    cargandoConversaciones: false,
    cargandoMensajes: false,
    escribiendo: false,

    /* C192: Flags de cache */
    conversacionesCargadas: false,
    ultimaCargaConversaciones: 0,

    setConversaciones: (conversaciones) => set({
        conversaciones,
        conversacionesCargadas: true,
        ultimaCargaConversaciones: Date.now(),
    }),

    setConversacionActiva: (id) => set({ conversacionActiva: id, mensajes: [] }),

    setMensajes: (mensajes) => set({ mensajes }),

    agregarMensaje: (mensaje) =>
        set((state) => ({
            mensajes: [...state.mensajes, mensaje],
        })),

    eliminarMensaje: (id) =>
        set((state) => ({
            mensajes: state.mensajes.filter((m) => m.id !== id),
        })),

    setCargandoConversaciones: (v) => set({ cargandoConversaciones: v }),

    setCargandoMensajes: (v) => set({ cargandoMensajes: v }),

    setEscribiendo: (v) => set({ escribiendo: v }),

    marcarConversacionLeida: (conversacionId) =>
        set((state) => ({
            conversaciones: state.conversaciones.map((c) =>
                c.id === conversacionId ? { ...c, noLeidos: 0 } : c
            ),
        })),

    marcarTodasLeidas: () =>
        set((state) => ({
            conversaciones: state.conversaciones.map((c) =>
                c.noLeidos > 0 ? { ...c, noLeidos: 0 } : c
            ),
        })),

    actualizarUltimoMensaje: (conversacionId, contenido) =>
        set((state) => ({
            conversaciones: state.conversaciones.map((c) =>
                c.id === conversacionId
                    ? { ...c, ultimoMensaje: contenido, ultimoMensajeAt: new Date().toISOString() }
                    : c
            ),
        })),

    totalNoLeidos: () => {
        return get().conversaciones.reduce((acc, c) => acc + c.noLeidos, 0);
    },

    /*
     * C192: Determina si necesita refrescar del backend.
     * true si nunca se cargo o el cache expiro.
     */
    necesitaRefrescar: () => {
        const { conversacionesCargadas, ultimaCargaConversaciones } = get();
        if (!conversacionesCargadas) return true;
        return Date.now() - ultimaCargaConversaciones > CACHE_TTL_MS;
    },
}));
