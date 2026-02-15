/*
 * Store: coleccionPickerStore — Kamples
 * Controla la apertura del modal de selección de colección
 * para añadir un sample a una colección existente.
 */

import { create } from 'zustand';
import type { SampleResumen } from '../types';

interface EstadoColeccionPicker {
    abierto: boolean;
    sample: SampleResumen | null;
    abrir: (sample: SampleResumen) => void;
    cerrar: () => void;
}

export const useColeccionPickerStore = create<EstadoColeccionPicker>((set) => ({
    abierto: false,
    sample: null,

    abrir: (sample) => set({ abierto: true, sample }),
    cerrar: () => set({ abierto: false, sample: null }),
}));
