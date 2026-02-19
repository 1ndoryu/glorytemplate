/*
 * Store: sugerenciasLikeStore — Kamples
 * Controla el modal "También te podría gustar" que aparece tras dar like.
 * Carga samples similares via API y los muestra brevemente.
 */

import { create } from 'zustand';
import { obtenerSimilares } from '@app/services/apiReproduciones';
import type { SampleResumen } from '@app/types';

interface SugerenciasLikeState {
    abierto: boolean;
    sampleOrigen: SampleResumen | null;
    sugerencias: SampleResumen[];
    cargando: boolean;

    /* Abre el modal y carga sugerencias para el sample dado */
    mostrar: (sample: SampleResumen) => void;
    cerrar: () => void;
}

export const useSugerenciasLikeStore = create<SugerenciasLikeState>((set) => ({
    abierto: false,
    sampleOrigen: null,
    sugerencias: [],
    cargando: false,

    mostrar: async (sample) => {
        set({ abierto: true, sampleOrigen: sample, sugerencias: [], cargando: true });

        try {
            const resp = await obtenerSimilares(sample.id, 5);
            const lista = resp.ok && resp.data ? resp.data : [];
            set({ sugerencias: lista, cargando: false });
        } catch {
            set({ sugerencias: [], cargando: false });
        }
    },

    cerrar: () => {
        set({ abierto: false, sampleOrigen: null, sugerencias: [], cargando: false });
    },
}));
