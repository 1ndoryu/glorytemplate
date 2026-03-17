/*
 * Store: seleccionSamplesStore — Kamples
 * QL116: Gestiona la selección múltiple de samples.
 * Ctrl+Click toggle individual, Shift+Click selecciona rango.
 */

import { create } from 'zustand';
import type { SampleResumen } from '../types';

interface SeleccionSamplesEstado {
    seleccionados: Map<number, SampleResumen>;
    ultimoId: number | null;
    /* Lista ordenada de IDs del feed actual — necesaria para shift+click range */
    contextoIds: number[];
    contextoMap: Map<number, SampleResumen>;

    /* Acciones */
    toggleSeleccion: (sample: SampleResumen) => void;
    seleccionarRango: (targetId: number) => void;
    limpiarSeleccion: () => void;
    setContexto: (samples: SampleResumen[]) => void;
}

export const useSeleccionSamplesStore = create<SeleccionSamplesEstado>((set, get) => ({
    seleccionados: new Map(),
    ultimoId: null,
    contextoIds: [],
    contextoMap: new Map(),

    toggleSeleccion: (sample) => {
        const { seleccionados } = get();
        const nuevo = new Map(seleccionados);
        if (nuevo.has(sample.id)) {
            nuevo.delete(sample.id);
        } else {
            nuevo.set(sample.id, sample);
        }
        set({ seleccionados: nuevo, ultimoId: sample.id });
    },

    seleccionarRango: (targetId) => {
        const { ultimoId, contextoIds, contextoMap, seleccionados } = get();
        if (ultimoId === null) {
            /* Sin selección previa, seleccionar solo este */
            const sample = contextoMap.get(targetId);
            if (sample) {
                const nuevo = new Map(seleccionados);
                nuevo.set(targetId, sample);
                set({ seleccionados: nuevo, ultimoId: targetId });
            }
            return;
        }

        const idxInicio = contextoIds.indexOf(ultimoId);
        const idxFin = contextoIds.indexOf(targetId);
        if (idxInicio === -1 || idxFin === -1) return;

        const desde = Math.min(idxInicio, idxFin);
        const hasta = Math.max(idxInicio, idxFin);
        const nuevo = new Map(seleccionados);

        for (let i = desde; i <= hasta; i++) {
            const id = contextoIds[i];
            const sample = contextoMap.get(id);
            if (sample) nuevo.set(id, sample);
        }

        set({ seleccionados: nuevo, ultimoId: targetId });
    },

    limpiarSeleccion: () => {
        set({ seleccionados: new Map(), ultimoId: null });
    },

    setContexto: (samples) => {
        const ids = samples.map(s => s.id);
        const map = new Map(samples.map(s => [s.id, s]));
        set({ contextoIds: ids, contextoMap: map });
    },
}));
