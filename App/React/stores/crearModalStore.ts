/*
 * Store: crearModalStore — Kamples
 * Controla el modal unificado de creación (publicación social + subida de samples).
 * C254: Soporta pre-carga de archivo desde el Mezclador (publicar mezcla).
 * C802c: Soporta relacionSampleoId para adjuntar sample a una relacion especifica.
 */

import { create } from 'zustand';

interface EstadoCrearModal {
    abierto: boolean;
    archivoPreCargado: File | null;
    esMezcla: boolean;
    /* ID de la relacion de sampleo a la que se adjunta el sample (opcional) */
    relacionSampleoId: number | null;
    abrir: (archivo?: File, esMezcla?: boolean, relacionSampleoId?: number | null) => void;
    cerrar: () => void;
    consumirArchivo: () => File | null;
}

export const useCrearModalStore = create<EstadoCrearModal>((set, get) => ({
    abierto: false,
    archivoPreCargado: null,
    esMezcla: false,
    relacionSampleoId: null,
    abrir: (archivo, esMezcla, relacionSampleoId = null) => set({
        abierto: true,
        archivoPreCargado: archivo ?? null,
        esMezcla: esMezcla ?? false,
        relacionSampleoId,
    }),
    cerrar: () => set({ abierto: false, archivoPreCargado: null, esMezcla: false, relacionSampleoId: null }),
    /* Consume el archivo una sola vez (evita re-procesar en re-renders) */
    consumirArchivo: () => {
        const archivo = get().archivoPreCargado;
        if (archivo) set({ archivoPreCargado: null });
        return archivo;
    },
}));
