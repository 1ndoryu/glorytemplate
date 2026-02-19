/*
 * Store: sugerenciasLikeStore — Kamples
 * Controla el modal "Tambien te podria gustar" que aparece tras dar like.
 * Carga samples similares via API y los muestra brevemente.
 *
 * FE08: Contador de version para descartar respuestas de requests anteriores (race condition).
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

/* Contador de version fuera del store para evitar race conditions */
let versionRequest = 0;

export const useSugerenciasLikeStore = create<SugerenciasLikeState>((set) => ({
    abierto: false,
    sampleOrigen: null,
    sugerencias: [],
    cargando: false,

    mostrar: async (sample) => {
        const versionActual = ++versionRequest;
        set({ abierto: true, sampleOrigen: sample, sugerencias: [], cargando: true });

        try {
            const resp = await obtenerSimilares(sample.id, 5);

            /* Si hubo otra llamada a mostrar() mientras esperabamos, descartar */
            if (versionActual !== versionRequest) return;

            const lista = resp.ok && resp.data ? resp.data : [];
            set({ sugerencias: lista, cargando: false });
        } catch {
            if (versionActual !== versionRequest) return;
            set({ sugerencias: [], cargando: false });
        }
    },

    cerrar: () => {
        set({ abierto: false, sampleOrigen: null, sugerencias: [], cargando: false });
    },
}));
