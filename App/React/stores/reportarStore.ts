/*
 * Store: reportarStore — Kamples (QQ38)
 * Store centralizado para el sistema de reportes.
 * Reemplaza reportarUsuarioStore y reportarErrorStore.
 */

import { create } from 'zustand';

export type TipoReporte = 'usuario' | 'publicacion' | 'comentario' | 'sample' | 'error_plataforma';

interface ReportarState {
    abierto: boolean;
    tipo: TipoReporte | null;
    targetId: number | null;
    targetNombre: string;
    abrir: (tipo: TipoReporte, targetId?: number | null, targetNombre?: string) => void;
    cerrar: () => void;
}

export const useReportarStore = create<ReportarState>((set) => ({
    abierto: false,
    tipo: null,
    targetId: null,
    targetNombre: '',
    abrir: (tipo, targetId = null, targetNombre = '') =>
        set({ abierto: true, tipo, targetId, targetNombre }),
    cerrar: () =>
        set({ abierto: false, tipo: null, targetId: null, targetNombre: '' }),
}));
