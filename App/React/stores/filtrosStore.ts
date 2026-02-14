/*
 * Store: filtrosStore — Kamples
 * Estado global de filtros para el explorador de samples.
 */

import { create } from 'zustand';
import type { TipoSample, NotaMusical } from '../types';

interface EstadoFiltros {
    busqueda: string;
    genero: string;
    bpmMin: number | undefined;
    bpmMax: number | undefined;
    key: NotaMusical | undefined;
    tipo: TipoSample | undefined;
    ordenar: 'relevancia' | 'recientes' | 'popular' | 'duracion';
    pagina: number;

    /* Acciones */
    setBusqueda: (busqueda: string) => void;
    setGenero: (genero: string) => void;
    setBpmRango: (min?: number, max?: number) => void;
    setKey: (key: NotaMusical | undefined) => void;
    setTipo: (tipo: TipoSample | undefined) => void;
    setOrdenar: (ordenar: EstadoFiltros['ordenar']) => void;
    setPagina: (pagina: number) => void;
    resetearFiltros: () => void;
}

const filtrosIniciales = {
    busqueda: '',
    genero: '',
    bpmMin: undefined as number | undefined,
    bpmMax: undefined as number | undefined,
    key: undefined as NotaMusical | undefined,
    tipo: undefined as TipoSample | undefined,
    ordenar: 'relevancia' as const,
    pagina: 1,
};

export const useFiltrosStore = create<EstadoFiltros>((set) => ({
    ...filtrosIniciales,

    setBusqueda: (busqueda) => set({ busqueda, pagina: 1 }),
    setGenero: (genero) => set({ genero, pagina: 1 }),
    setBpmRango: (min, max) => set({ bpmMin: min, bpmMax: max, pagina: 1 }),
    setKey: (key) => set({ key, pagina: 1 }),
    setTipo: (tipo) => set({ tipo, pagina: 1 }),
    setOrdenar: (ordenar) => set({ ordenar, pagina: 1 }),
    setPagina: (pagina) => set({ pagina }),
    resetearFiltros: () => set({ ...filtrosIniciales }),
}));
