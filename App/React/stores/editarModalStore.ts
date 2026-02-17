/*
 * Store: editarModalStore — Kamples (C126)
 * Controla el modal unificado de edición para samples, publicaciones y colecciones.
 * Almacena el tipo de entidad y la data original para pre-rellenar el formulario.
 */

import { create } from 'zustand';
import type { SampleResumen, Publicacion, Coleccion } from '../types';

export type TipoEntidadEditable = 'sample' | 'publicacion' | 'coleccion';

interface EstadoEditarModal {
    abierto: boolean;
    tipo: TipoEntidadEditable | null;
    sample: SampleResumen | null;
    publicacion: Publicacion | null;
    coleccion: Coleccion | null;
    abrirSample: (sample: SampleResumen) => void;
    abrirPublicacion: (publicacion: Publicacion) => void;
    abrirColeccion: (coleccion: Coleccion) => void;
    cerrar: () => void;
}

export const useEditarModalStore = create<EstadoEditarModal>((set) => ({
    abierto: false,
    tipo: null,
    sample: null,
    publicacion: null,
    coleccion: null,
    abrirSample: (sample) => set({ abierto: true, tipo: 'sample', sample, publicacion: null, coleccion: null }),
    abrirPublicacion: (publicacion) => set({ abierto: true, tipo: 'publicacion', publicacion, sample: null, coleccion: null }),
    abrirColeccion: (coleccion) => set({ abierto: true, tipo: 'coleccion', coleccion, sample: null, publicacion: null }),
    cerrar: () => set({ abierto: false, tipo: null, sample: null, publicacion: null, coleccion: null }),
}));
