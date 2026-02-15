/*
 * Store: mensajesStore — Kamples (Fase 7.2-7.3)
 * Estado global de conversaciones y mensajes activos.
 * Prepara la integración con WebSocket (Fase 7.1).
 */

import { create } from 'zustand';
import type { Conversacion, Mensaje } from '../types';

interface EstadoMensajes {
    conversaciones: Conversacion[];
    conversacionActiva: number | null;
    mensajes: Mensaje[];
    cargandoConversaciones: boolean;
    cargandoMensajes: boolean;
    escribiendo: boolean;

    /* Acciones */
    setConversaciones: (conversaciones: Conversacion[]) => void;
    setConversacionActiva: (id: number | null) => void;
    setMensajes: (mensajes: Mensaje[]) => void;
    agregarMensaje: (mensaje: Mensaje) => void;
    setCargandoConversaciones: (v: boolean) => void;
    setCargandoMensajes: (v: boolean) => void;
    setEscribiendo: (v: boolean) => void;
    marcarConversacionLeida: (conversacionId: number) => void;
    actualizarUltimoMensaje: (conversacionId: number, contenido: string) => void;
    totalNoLeidos: () => number;
}

export const useMensajesStore = create<EstadoMensajes>((set, get) => ({
    conversaciones: [],
    conversacionActiva: null,
    mensajes: [],
    cargandoConversaciones: true,
    cargandoMensajes: false,
    escribiendo: false,

    setConversaciones: (conversaciones) => set({ conversaciones }),

    setConversacionActiva: (id) => set({ conversacionActiva: id, mensajes: [] }),

    setMensajes: (mensajes) => set({ mensajes }),

    agregarMensaje: (mensaje) =>
        set((state) => ({
            mensajes: [...state.mensajes, mensaje],
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
}));
