/*
 * Store: extenderRecorteStore — Kamples (QQ130)
 * Estado del modal de extension de recortes de audio.
 * Abre/cierra el modal y mantiene referencia al sample objetivo.
 */

import { create } from 'zustand';
import type { SampleResumen } from '@app/types';

interface ExtenderRecorteState {
    abierto: boolean;
    sample: SampleResumen | null;
    abrir: (sample: SampleResumen) => void;
    cerrar: () => void;
}

export const useExtenderRecorteStore = create<ExtenderRecorteState>((set) => ({
    abierto: false,
    sample: null,
    abrir: (sample) => set({ abierto: true, sample }),
    cerrar: () => set({ abierto: false, sample: null }),
}));
