/*
 * Store: crearModalStore — Kamples
 * Controla el modal unificado de creación (publicación social + subida de samples).
 * C254: Soporta pre-carga de archivo desde el Mezclador (publicar mezcla).
 * C802c: Soporta contexto de adjuncion para vincular sample a cancion/relacion.
 */

import { create } from 'zustand';

export type LadoRelacion = 'fuente' | 'destino';

/* Contexto para adjuntar sample a una cancion y opcionalmente a un sampleo */
export interface ContextoAdjuntar {
    cancionOrigenId: number;
    relacionId?: number;
    ladoRelacion?: LadoRelacion;
}

interface EstadoCrearModal {
    abierto: boolean;
    archivoPreCargado: File | null;
    esMezcla: boolean;
    contextoAdjuntar: ContextoAdjuntar | null;
    abrir: (archivo?: File, esMezcla?: boolean) => void;
    abrirConContexto: (contexto: ContextoAdjuntar) => void;
    cerrar: () => void;
    consumirArchivo: () => File | null;
}

export const useCrearModalStore = create<EstadoCrearModal>((set, get) => ({
    abierto: false,
    archivoPreCargado: null,
    esMezcla: false,
    contextoAdjuntar: null,
    abrir: (archivo, esMezcla) => set({
        abierto: true,
        archivoPreCargado: archivo ?? null,
        esMezcla: esMezcla ?? false,
        contextoAdjuntar: null,
    }),
    abrirConContexto: (contexto) => set({
        abierto: true,
        archivoPreCargado: null,
        esMezcla: false,
        contextoAdjuntar: contexto,
    }),
    cerrar: () => set({ abierto: false, archivoPreCargado: null, esMezcla: false, contextoAdjuntar: null }),
    /* Consume el archivo una sola vez (evita re-procesar en re-renders) */
    consumirArchivo: () => {
        const archivo = get().archivoPreCargado;
        if (archivo) set({ archivoPreCargado: null });
        return archivo;
    },
}));
