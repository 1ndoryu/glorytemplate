/*
 * Store: solicitudWhatsappStore — Kamples (QQ63)
 * Estado global para el modal de solicitud de ingreso al grupo de WhatsApp.
 */

import { create } from 'zustand';

interface SolicitudWhatsappState {
    abierto: boolean;
    abrir: () => void;
    cerrar: () => void;
}

export const useSolicitudWhatsappStore = create<SolicitudWhatsappState>((set) => ({
    abierto: false,
    abrir: () => set({ abierto: true }),
    cerrar: () => set({ abierto: false }),
}));
