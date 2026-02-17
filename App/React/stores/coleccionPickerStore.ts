/*
 * Store: coleccionPickerStore — Kamples
 * Controla la apertura del modal de selección de colección
 * para añadir un sample a una colección existente.
 * C182: Soporta posicionamiento contextual (donde se hizo click).
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
    posicion: PosicionModal | null;
    abrir: (sample: SampleResumen, posicion?: PosicionModal) => void;
    cerrar: () => void;
}

export const useColeccionPickerStore = create<EstadoColeccionPicker>((set) => ({
    abierto: false,
    sample: null,
    posicion: null,

    abrir: (sample, posicion) => set({ abierto: true, sample, posicion: posicion ?? null }),
    cerrar: () => set({ abierto: false, sample: null, posicion: null }),
}));
