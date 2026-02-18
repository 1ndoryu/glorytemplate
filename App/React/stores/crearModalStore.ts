/*
 * Store: crearModalStore — Kamples
 * Controla el modal unificado de creación (publicación social + subida de samples).
 * C254: Soporta pre-carga de archivo desde el Mezclador (publicar mezcla).
 */

import { create } from 'zustand';

interface EstadoCrearModal {
    abierto: boolean;
    archivoPreCargado: File | null;
    esMezcla: boolean;
    abrir: (archivo?: File, esMezcla?: boolean) => void;
    cerrar: () => void;
    consumirArchivo: () => File | null;
}

export const useCrearModalStore = create<EstadoCrearModal>((set, get) => ({
    abierto: false,
    archivoPreCargado: null,
    esMezcla: false,
    abrir: (archivo, esMezcla) => set({
        abierto: true,
        archivoPreCargado: archivo ?? null,
        esMezcla: esMezcla ?? false,
    }),
    cerrar: () => set({ abierto: false, archivoPreCargado: null, esMezcla: false }),
    /* Consume el archivo una sola vez (evita re-procesar en re-renders) */
    consumirArchivo: () => {
        const archivo = get().archivoPreCargado;
        if (archivo) set({ archivoPreCargado: null });
        return archivo;
    },
}));
