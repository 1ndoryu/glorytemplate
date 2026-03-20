/*
 * Store: algoTimingStore — Kamples
 * Gestiona el estado del modal de métricas del algoritmo (admin only).
 * Carga el historial desde la API REST y lo expone al modal.
 *
 * [2003A-3] Creado para el modal de rendimiento del algoritmo de feed.
 */

import { create } from 'zustand';

export interface EtapasTiming {
    perfilUsuario?: number;
    generacionSQL?: number;
    sqlFeed?: number;
    [key: string]: number | undefined;
}

export interface RegistroTiming {
    ts: string;
    totalMs: number;
    etapas: EtapasTiming;
    meta: {
        totalSamples?: number;
        usoCandidatos?: boolean;
        usoMV?: boolean;
        bulkFetch?: boolean;
        resultados?: number;
        limite?: number;
        offset?: number;
    };
}

interface EstadoAlgoTiming {
    abierto: boolean;
    historial: RegistroTiming[];
    cargando: boolean;
    error: string | null;

    abrir: () => void;
    cerrar: () => void;
    cargarHistorial: () => Promise<void>;
    limpiarHistorial: () => Promise<void>;
}

export const useAlgoTimingStore = create<EstadoAlgoTiming>((set, get) => ({
    abierto: false,
    historial: [],
    cargando: false,
    error: null,

    abrir: () => {
        set({ abierto: true });
        void get().cargarHistorial();
    },

    cerrar: () => set({ abierto: false }),

    cargarHistorial: async () => {
        set({ cargando: true, error: null });
        try {
            const res = await fetch('/wp-json/kamples/v1/admin/algo-timing', {
                credentials: 'include',
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            if (data.ok) {
                set({ historial: data.historial ?? [] });
            } else {
                set({ error: 'Respuesta inválida del servidor' });
            }
        } catch (e) {
            set({ error: (e instanceof Error ? e.message : 'Error de red') });
        } finally {
            set({ cargando: false });
        }
    },

    limpiarHistorial: async () => {
        try {
            const res = await fetch('/wp-json/kamples/v1/admin/algo-timing', {
                method: 'DELETE',
                credentials: 'include',
            });
            if (res.ok) set({ historial: [] });
        } catch {
            /* Error de red al limpiar — ignorar, el usuario puede reintentar */
        }
    },
}));
