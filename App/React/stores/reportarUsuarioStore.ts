/*
 * Store: reportarUsuarioStore — Kamples (QQ23)
 * Controla la apertura/cierre del modal de reporte de usuario.
 * Almacena el ID y username del usuario a reportar como contexto.
 */

import { create } from 'zustand';

interface ReportarUsuarioState {
    abierto: boolean;
    usuarioId: number | null;
    usuarioUsername: string | null;
    abrir: (id: number, username: string) => void;
    cerrar: () => void;
}

export const useReportarUsuarioStore = create<ReportarUsuarioState>((set) => ({
    abierto: false,
    usuarioId: null,
    usuarioUsername: null,
    abrir: (id, username) => set({ abierto: true, usuarioId: id, usuarioUsername: username }),
    cerrar: () => set({ abierto: false, usuarioId: null, usuarioUsername: null }),
}));
