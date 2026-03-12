/*
 * Store: reproducidosStore — Kamples
 * QQ46: Mantiene un Set global de IDs de samples que el usuario ha reproducido.
 * Se carga una vez al autenticar y se actualiza en tiempo real al reproducir.
 * Usado por TarjetaSample para mostrar punto rojo en samples no reproducidos.
 */

import { create } from 'zustand';
import { obtenerIdsReproducidos } from '@app/services/apiReproduciones';

interface ReproducidosState {
    ids: Set<number>;
    cargado: boolean;

    cargar: () => Promise<void>;
    marcarReproducido: (sampleId: number) => void;
    esReproducido: (sampleId: number) => boolean;
}

export const useReproducidosStore = create<ReproducidosState>((set, get) => ({
    ids: new Set(),
    cargado: false,

    cargar: async () => {
        if (get().cargado) return;
        const resp = await obtenerIdsReproducidos();
        if (resp.ok && Array.isArray(resp.data)) {
            set({ ids: new Set(resp.data), cargado: true });
        }
    },

    marcarReproducido: (sampleId) => {
        set(s => {
            if (s.ids.has(sampleId)) return s;
            const copia = new Set(s.ids);
            copia.add(sampleId);
            return { ids: copia };
        });
    },

    esReproducido: (sampleId) => get().ids.has(sampleId),
}));
