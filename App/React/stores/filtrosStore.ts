/*
 * Store: filtrosStore — Kamples
 * Estado global de filtros y ordenamientos para el feed de samples.
 * Filtros: toggles simples on/off (yaReproducidos, likeados, deSeguidos, descargados).
 * Ordenamientos: inteligente (default), recientes, destacados (con sub-periodo).
 */

import { create } from 'zustand';

export type TipoOrdenamiento = 'inteligente' | 'recientes' | 'destacados';
export type PeriodoDestacados = 'semana' | 'mes' | 'anio';

interface EstadoFiltros {
    busqueda: string;
    pagina: number;

    /* Filtros toggle */
    yaReproducidos: boolean;
    likeados: boolean;
    deSeguidos: boolean;
    descargados: boolean;

    /* Ordenamiento */
    ordenamiento: TipoOrdenamiento;
    periodoDestacados: PeriodoDestacados;

    /* Acciones */
    setBusqueda: (busqueda: string) => void;
    setPagina: (pagina: number) => void;
    toggleYaReproducidos: () => void;
    toggleLikeados: () => void;
    toggleDeSeguidos: () => void;
    toggleDescargados: () => void;
    setOrdenamiento: (tipo: TipoOrdenamiento) => void;
    setPeriodoDestacados: (periodo: PeriodoDestacados) => void;
    resetearFiltros: () => void;
}

const filtrosIniciales = {
    busqueda: '',
    pagina: 1,
    yaReproducidos: false,
    likeados: false,
    deSeguidos: false,
    descargados: false,
    ordenamiento: 'inteligente' as TipoOrdenamiento,
    periodoDestacados: 'semana' as PeriodoDestacados,
};

export const useFiltrosStore = create<EstadoFiltros>((set) => ({
    ...filtrosIniciales,

    setBusqueda: (busqueda) => set({ busqueda, pagina: 1 }),
    setPagina: (pagina) => set({ pagina }),
    toggleYaReproducidos: () => set((s) => ({ yaReproducidos: !s.yaReproducidos, pagina: 1 })),
    toggleLikeados: () => set((s) => ({ likeados: !s.likeados, pagina: 1 })),
    toggleDeSeguidos: () => set((s) => ({ deSeguidos: !s.deSeguidos, pagina: 1 })),
    toggleDescargados: () => set((s) => ({ descargados: !s.descargados, pagina: 1 })),
    setOrdenamiento: (ordenamiento) => set({ ordenamiento, pagina: 1 }),
    setPeriodoDestacados: (periodo) => set({ periodoDestacados: periodo, pagina: 1 }),
    resetearFiltros: () => set({ ...filtrosIniciales }),
}));
