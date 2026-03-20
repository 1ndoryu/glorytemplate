/*
 * Store: algoTimingStore — Kamples
 * Gestiona el estado del modal de métricas del algoritmo (admin only).
 * Carga el historial desde la API REST y lo expone al modal.
 *
 * [2003A-3] Creado para el modal de rendimiento del algoritmo de feed.
 * [2003A-3-A] Fix: usar apiPeticion para enviar X-WP-Nonce y evitar 401
 *  (current_user_can require cookie auth + nonce — fetch raw sin nonce falla).
 */

import { create } from 'zustand';
import { apiPeticion } from '@app/services/apiCliente';

export interface EtapasTiming {
    perfilUsuario?: number;
    generacionSQL?: number;
    sqlFeed?: number;
    [key: string]: number | undefined;
}

/* [2003A-3-B] Nodo del EXPLAIN ANALYZE de PostgreSQL */
export interface NodoExplain {
    etiqueta: string;
    tipo: string;
    totalMs: number;
    exclusivoMs: number;
    filas: number;
    profundidad: number;
    esCte: boolean;
    buffers: number;
}

/* [2003A-3-B] Datos de EXPLAIN ANALYZE parseados */
export interface ExplainData {
    planificacionMs: number;
    ejecucionMs: number;
    nodos: NodoExplain[];
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
    explain?: ExplainData;
}

interface RespuestaTiming {
    ok: boolean;
    historial?: RegistroTiming[];
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
        const res = await apiPeticion<RespuestaTiming>('/admin/algo-timing', { method: 'GET' });
        if (res.ok && res.data?.ok) {
            set({ historial: res.data.historial ?? [], cargando: false });
        } else {
            set({ error: res.error ?? `HTTP ${res.status}`, cargando: false });
        }
    },

    limpiarHistorial: async () => {
        const res = await apiPeticion<RespuestaTiming>('/admin/algo-timing', { method: 'DELETE' });
        if (res.ok) set({ historial: [] });
    },
}));
