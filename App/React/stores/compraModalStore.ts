/*
 * Store: compraModalStore — Kamples (QQ60)
 * Controla la apertura del modal de confirmacion de compra de sample.
 * El modal muestra info del sample y redirige a Stripe Checkout al confirmar.
 */

import { create } from 'zustand';
import type { SampleResumen } from '../types';

interface CompraModalState {
    abierto: boolean;
    sample: SampleResumen | null;
    abrir: (sample: SampleResumen) => void;
    cerrar: () => void;
}

export const useCompraModalStore = create<CompraModalState>((set) => ({
    abierto: false,
    sample: null,
    abrir: (sample) => set({ abierto: true, sample }),
    cerrar: () => set({ abierto: false, sample: null }),
}));
