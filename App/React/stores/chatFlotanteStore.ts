/*
 * Store: chatFlotanteStore — Kamples (FASE 5.1)
 * Gestiona las conversaciones flotantes tipo Messenger.
 * Múltiples chats abiertos simultáneamente, minimizables.
 */

import { create } from 'zustand';

export interface ChatFlotanteInfo {
    conversacionId: number;
    participanteId: number;
    participanteUsername: string;
    nombreParticipante: string;
    avatarUrl: string | null;
    minimizado: boolean;
}

interface ChatFlotanteState {
    chatsAbiertos: ChatFlotanteInfo[];
    abrirChat: (info: Omit<ChatFlotanteInfo, 'minimizado'>) => void;
    cerrarChat: (conversacionId: number) => void;
    minimizarChat: (conversacionId: number) => void;
    restaurarChat: (conversacionId: number) => void;
}

/* Máximo de chats flotantes simultáneos */
const MAX_CHATS = 3;

export const useChatFlotanteStore = create<ChatFlotanteState>((set) => ({
    chatsAbiertos: [],

    abrirChat: (info) =>
        set((state) => {
            /* Si ya existe, restaurar */
            const existe = state.chatsAbiertos.find((c) => c.conversacionId === info.conversacionId);
            if (existe) {
                return {
                    chatsAbiertos: state.chatsAbiertos.map((c) =>
                        c.conversacionId === info.conversacionId ? { ...c, minimizado: false } : c
                    ),
                };
            }

            /* Si se excede el límite, cerrar el más antiguo */
            const nuevos = [...state.chatsAbiertos];
            if (nuevos.length >= MAX_CHATS) {
                nuevos.shift();
            }

            return {
                chatsAbiertos: [...nuevos, { ...info, minimizado: false }],
            };
        }),

    cerrarChat: (conversacionId) =>
        set((state) => ({
            chatsAbiertos: state.chatsAbiertos.filter((c) => c.conversacionId !== conversacionId),
        })),

    minimizarChat: (conversacionId) =>
        set((state) => ({
            chatsAbiertos: state.chatsAbiertos.map((c) =>
                c.conversacionId === conversacionId ? { ...c, minimizado: true } : c
            ),
        })),

    restaurarChat: (conversacionId) =>
        set((state) => ({
            chatsAbiertos: state.chatsAbiertos.map((c) =>
                c.conversacionId === conversacionId ? { ...c, minimizado: false } : c
            ),
        })),
}));
