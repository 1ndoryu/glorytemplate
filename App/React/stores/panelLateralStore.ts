/*
 * Store: panelLateralStore — Kamples (C86+C95+C111)
 * Controla el panel lateral derecho (~30%) que muestra:
 * - Sugerencias "También te podría gustar"
 * - Detalle condensado de sample (click en título)
 * - Comentarios de un sample (click en icono comentar)
 * Solo activo en islas que lo soporten (Inicio, Colecciones, Librería).
 */

import { create } from 'zustand';
import type { SampleResumen } from '@app/types';

type ModoPanelLateral = 'sugerencias' | 'detalle' | 'comentarios' | null;

interface PanelLateralState {
    modo: ModoPanelLateral;
    sampleId: number | null;
    sampleSlug: string | null;
    sample: SampleResumen | null;
    habilitado: boolean;

    /* Activar/desactivar el panel según la isla actual */
    habilitar: () => void;
    deshabilitar: () => void;

    /* Mostrar detalle de un sample */
    abrirDetalle: (sample: SampleResumen) => void;

    /* Mostrar comentarios de un sample */
    abrirComentarios: (sample: SampleResumen) => void;

    /* Mostrar sugerencias tras like */
    abrirSugerencias: (sample: SampleResumen) => void;

    /* Cerrar panel */
    cerrar: () => void;
}

export const usePanelLateralStore = create<PanelLateralState>((set) => ({
    modo: null,
    sampleId: null,
    sampleSlug: null,
    sample: null,
    habilitado: false,

    habilitar: () => set({ habilitado: true }),
    deshabilitar: () => set({ habilitado: false, modo: null, sampleId: null, sampleSlug: null, sample: null }),

    abrirDetalle: (sample) => set({
        modo: 'detalle',
        sampleId: sample.id,
        sampleSlug: sample.slug,
        sample,
    }),

    abrirComentarios: (sample) => set({
        modo: 'comentarios',
        sampleId: sample.id,
        sampleSlug: sample.slug,
        sample,
    }),

    abrirSugerencias: (sample) => set({
        modo: 'sugerencias',
        sampleId: sample.id,
        sampleSlug: sample.slug,
        sample,
    }),

    cerrar: () => set({ modo: null, sampleId: null, sampleSlug: null, sample: null }),
}));
