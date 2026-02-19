/*
 * browserDawStore — Estado del panel browser integrado en el DAW (C307).
 * Controla visibilidad y estado del árbol de carpetas.
 * Separado del mezcladorStore por SRP.
 */

import { create } from 'zustand';

interface BrowserDawState {
    abierto: boolean;
    carpetasExpandidas: Set<string>;
    toggle: () => void;
    abrir: () => void;
    cerrar: () => void;
    toggleCarpeta: (carpeta: string) => void;
}

export const useBrowserDawStore = create<BrowserDawState>((set) => ({
    abierto: false,
    carpetasExpandidas: new Set(),

    toggle: () => set(prev => ({ abierto: !prev.abierto })),
    abrir: () => set({ abierto: true }),
    cerrar: () => set({ abierto: false }),

    toggleCarpeta: (carpeta) => set(prev => {
        const nuevas = new Set(prev.carpetasExpandidas);
        if (nuevas.has(carpeta)) nuevas.delete(carpeta);
        else nuevas.add(carpeta);
        return { carpetasExpandidas: nuevas };
    }),
}));
