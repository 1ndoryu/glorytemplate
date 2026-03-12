/*
 * Store: reportarErrorStore — Kamples
 * Controla la apertura/cierre del modal de reporte de errores de plataforma.
 */

import { create } from 'zustand';

interface ReportarErrorState {
    abierto: boolean;
    abrir: () => void;
    cerrar: () => void;
}

export const useReportarErrorStore = create<ReportarErrorState>((set) => ({
    abierto: false,
    abrir: () => set({ abierto: true }),
    cerrar: () => set({ abierto: false }),
}));
