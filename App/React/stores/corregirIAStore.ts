/*
 * Store: corregirIAStore — Kamples (C800)
 * Estado del modal de corrección de metadata generada por IA.
 * Abre/cierra el modal y mantiene referencia al sample a corregir.
 */

import { create } from 'zustand';
import type { SampleResumen } from '@app/types';

interface CorregirIAState {
    abierto: boolean;
    sample: SampleResumen | null;
    abrir: (sample: SampleResumen) => void;
    cerrar: () => void;
}

export const useCorregirIAStore = create<CorregirIAState>((set) => ({
    abierto: false,
    sample: null,
    abrir: (sample) => set({ abierto: true, sample }),
    cerrar: () => set({ abierto: false, sample: null }),
}));
