/*
 * Store: tooltipPerfilStore — Kamples
 * Estado global del tooltip de perfil (hover card estilo Twitter/X).
 * Timers centralizados: tanto el trigger (useHoverPerfil) como el componente
 * (TooltipPerfil) comparten los mismos timers para coordinar show/hide.
 * Cache de perfiles evita re-fetching en hovers repetidos.
 */

import { create } from 'zustand';
import type { Usuario } from '@app/types/usuario';

const DELAY_MOSTRAR = 400;
const DELAY_OCULTAR = 250;

export interface AnclaRect {
    top: number;
    left: number;
    width: number;
    height: number;
}

/* Timers a nivel de modulo — compartidos entre trigger y tooltip */
let timerMostrar: ReturnType<typeof setTimeout> | null = null;
let timerOcultar: ReturnType<typeof setTimeout> | null = null;

interface TooltipPerfilState {
    username: string | null;
    ancla: AnclaRect | null;
    cache: Record<string, Usuario>;

    /* Acciones con delay para hover natural */
    programarAbrir: (username: string, ancla: AnclaRect) => void;
    programarCerrar: () => void;
    cancelarCerrar: () => void;
    cancelarTodo: () => void;

    /* Acciones directas (sin delay) */
    abrirInmediato: (username: string, ancla: AnclaRect) => void;
    cerrarInmediato: () => void;

    /* Cache */
    guardarEnCache: (username: string, perfil: Usuario) => void;
    obtenerDeCache: (username: string) => Usuario | undefined;
    limpiarCache: () => void;
    invalidarCache: (username: string) => void;
}

export const useTooltipPerfilStore = create<TooltipPerfilState>((set, get) => ({
    username: null,
    ancla: null,
    cache: {},

    programarAbrir: (username, ancla) => {
        /* Cancelar cualquier timer pendiente */
        if (timerOcultar) { clearTimeout(timerOcultar); timerOcultar = null; }
        if (timerMostrar) { clearTimeout(timerMostrar); timerMostrar = null; }

        timerMostrar = setTimeout(() => {
            timerMostrar = null;
            set({ username, ancla });
        }, DELAY_MOSTRAR);
    },

    programarCerrar: () => {
        if (timerMostrar) { clearTimeout(timerMostrar); timerMostrar = null; }
        if (timerOcultar) { clearTimeout(timerOcultar); timerOcultar = null; }

        timerOcultar = setTimeout(() => {
            timerOcultar = null;
            set({ username: null, ancla: null });
        }, DELAY_OCULTAR);
    },

    cancelarCerrar: () => {
        if (timerOcultar) { clearTimeout(timerOcultar); timerOcultar = null; }
    },

    cancelarTodo: () => {
        if (timerMostrar) { clearTimeout(timerMostrar); timerMostrar = null; }
        if (timerOcultar) { clearTimeout(timerOcultar); timerOcultar = null; }
    },

    abrirInmediato: (username, ancla) => {
        if (timerMostrar) { clearTimeout(timerMostrar); timerMostrar = null; }
        if (timerOcultar) { clearTimeout(timerOcultar); timerOcultar = null; }
        set({ username, ancla });
    },

    cerrarInmediato: () => {
        if (timerMostrar) { clearTimeout(timerMostrar); timerMostrar = null; }
        if (timerOcultar) { clearTimeout(timerOcultar); timerOcultar = null; }
        set({ username: null, ancla: null });
    },

    guardarEnCache: (username, perfil) =>
        set(s => ({ cache: { ...s.cache, [username]: perfil } })),

    obtenerDeCache: (username) => get().cache[username],

    /* QK1: Limpia todo el cache de perfiles al cerrar sesión.
     * Evita datos de seguimiento del usuario anterior. */
    limpiarCache: () => set({ cache: {} }),

    /* QK2: Invalida un perfil específico del cache para forzar re-fetch.
     * Usado tras follow/unfollow para que el próximo hover muestre estado fresco. */
    invalidarCache: (username: string) =>
        set(s => {
            const cacheNuevo = { ...s.cache };
            delete cacheNuevo[username];
            return { cache: cacheNuevo };
        }),
}));
