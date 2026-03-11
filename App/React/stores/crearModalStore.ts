/*
 * Store: crearModalStore — Kamples
 * Controla el modal unificado de creación (publicación social + subida de samples).
 * C254: Soporta pre-carga de archivo desde el Mezclador (publicar mezcla).
 * C802c: Soporta contexto de adjuncion para vincular sample a cancion/relacion.
 */

import { create } from 'zustand';

export type LadoRelacion = 'fuente' | 'destino';

/* Informacion minima de un lado del sampleo para mostrar el selector de lado en el modal */
export interface LadoOpcion {
    cancionId: number;
    titulo: string;
    artista?: string;
}

/*
 * Contexto para adjuntar sample a una cancion y opcionalmente a un sampleo.
 * Cuando se abre desde RelacionDetalle sin lado pre-seleccionado:
 *   - cancionOrigenId y ladoRelacion son undefined
 *   - ladoFuente + ladoDestino se usan para renderizar el selector de lado en el modal
 *   - Al seleccionar, se llama a seleccionarLado() para completar el contexto
 */
export interface ContextoAdjuntar {
    cancionOrigenId?: number;
    relacionId?: number;
    ladoRelacion?: LadoRelacion;
    /* Para el selector de lado en el modal (L7.1) */
    ladoFuente?: LadoOpcion;
    ladoDestino?: LadoOpcion;
    /* L7.2: Timing de inicio sugerido desde la relacion (pre-rellenado) */
    inicioSegundos?: number;
}

interface EstadoCrearModal {
    abierto: boolean;
    archivoPreCargado: File | null;
    esMezcla: boolean;
    contextoAdjuntar: ContextoAdjuntar | null;
    abrir: (archivo?: File, esMezcla?: boolean) => void;
    abrirConContexto: (contexto: ContextoAdjuntar) => void;
    /* Completa el contexto con el lado elegido en el selector del modal */
    seleccionarLado: (cancionOrigenId: number, lado: LadoRelacion) => void;
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
    seleccionarLado: (cancionOrigenId, lado) => set((estado) => ({
        contextoAdjuntar: estado.contextoAdjuntar
            ? { ...estado.contextoAdjuntar, cancionOrigenId, ladoRelacion: lado }
            : null,
    })),
    cerrar: () => set({ abierto: false, archivoPreCargado: null, esMezcla: false, contextoAdjuntar: null }),
    /* Consume el archivo una sola vez (evita re-procesar en re-renders) */
    consumirArchivo: () => {
        const archivo = get().archivoPreCargado;
        if (archivo) set({ archivoPreCargado: null });
        return archivo;
    },
}));
