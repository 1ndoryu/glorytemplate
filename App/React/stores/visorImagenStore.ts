/*
 * Store: visorImagenStore — Kamples (QQ52)
 * Estado global para el visor modal de imágenes.
 * Reutilizable para cualquier contexto (chat, publicaciones, etc.).
 */

import { create } from 'zustand';

interface EstadoVisorImagen {
    url: string | null;
    alt: string;
    abrir: (url: string, alt?: string) => void;
    cerrar: () => void;
}

export const useVisorImagenStore = create<EstadoVisorImagen>((set) => ({
    url: null,
    alt: '',
    abrir: (url, alt = '') => set({ url, alt }),
    cerrar: () => set({ url: null, alt: '' }),
}));
