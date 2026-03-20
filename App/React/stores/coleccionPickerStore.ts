/*
 * Store: coleccionPickerStore — Kamples
 * Controla la apertura del modal de selección de colección.
 * C182: Soporta posicionamiento contextual.
 * [2003A-19] Soporta múltiples samples (batch add).
 */

import { create } from 'zustand';
import type { SampleResumen } from '../types';

interface PosicionModal {
    x: number;
    y: number;
}

interface EstadoColeccionPicker {
    abierto: boolean;
    sample: SampleResumen | null;
    samples: SampleResumen[];
    posicion: PosicionModal | null;
    abrir: (sample: SampleResumen | SampleResumen[], posicion?: PosicionModal) => void;
    cerrar: () => void;
}

export const useColeccionPickerStore = create<EstadoColeccionPicker>((set) => ({
    abierto: false,
    sample: null,
    samples: [],
    posicion: null,

    abrir: (sampleOrArray, posicion) => {
        const arr = Array.isArray(sampleOrArray) ? sampleOrArray : [sampleOrArray];
        set({
            abierto: true,
            sample: arr[0] ?? null,
            samples: arr,
            posicion: posicion ?? null,
        });
    },
    cerrar: () => set({ abierto: false, sample: null, samples: [], posicion: null }),
}));
