/*
 * Store: filtrosStore — Kamples
 * Estado global de filtros y ordenamientos para el feed de samples.
 * Filtros: toggles simples on/off (yaReproducidos, likeados, deSeguidos, descargados).
 * Ordenamientos: inteligente (default), recientes, destacados (con sub-periodo).
 * C115: Tags incluidos/excluidos globales, sincronizados con búsqueda.
 */

import { create } from 'zustand';

export type TipoOrdenamiento = 'inteligente' | 'recientes' | 'destacados';
export type PeriodoDestacados = 'semana' | 'mes' | 'anio';
/* C274: Filtro por tipo de precio */
export type FiltroPrecio = 'todos' | 'gratis' | 'premium';

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

    /* C115: Tags globales incluidos/excluidos */
    tagsIncluidos: string[];
    tagsExcluidos: string[];

    /* C116: Rango BPM */
    bpmMin: number | null;
    bpmMax: number | null;

    /* C274: Filtro free/premium */
    filtroPrecio: FiltroPrecio;

    /* Acciones */
    setBusqueda: (busqueda: string) => void;
    setPagina: (pagina: number) => void;
    toggleYaReproducidos: () => void;
    toggleLikeados: () => void;
    toggleDeSeguidos: () => void;
    toggleDescargados: () => void;
    setOrdenamiento: (tipo: TipoOrdenamiento) => void;
    setPeriodoDestacados: (periodo: PeriodoDestacados) => void;

    /* C115: Acciones de tags */
    incluirTag: (tag: string) => void;
    excluirTag: (tag: string) => void;
    quitarTag: (tag: string) => void;
    limpiarTags: () => void;

    /* C116: Acciones BPM */
    setBpmRango: (min: number | null, max: number | null) => void;

    /* C274: Acción precio */
    setFiltroPrecio: (filtro: FiltroPrecio) => void;

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
    tagsIncluidos: [] as string[],
    tagsExcluidos: [] as string[],
    bpmMin: null as number | null,
    bpmMax: null as number | null,
    filtroPrecio: 'todos' as FiltroPrecio,
};

/*
 * C115/QL128: Tags y busqueda son filtros INDEPENDIENTES (QQ15).
 * Antes, tags se sincronizaban a busqueda via generarBusquedaDesdeTags,
 * lo que activaba el dropdown de busqueda rapida en el TopBar al clickear tags.
 * Eliminado: las acciones incluirTag/excluirTag/quitarTag ya no tocan busqueda.
 */

/*
 * C115: Parsea string de búsqueda a tags incluidos/excluidos.
 * Formato: "hip hop, -trap, lofi" → incluidos: [hip hop, lofi], excluidos: [trap]
 */
export const parsearBusquedaATags = (busqueda: string): { incluidos: string[]; excluidos: string[] } => {
    const incluidos: string[] = [];
    const excluidos: string[] = [];
    if (!busqueda.trim()) return { incluidos, excluidos };

    busqueda.split(',').forEach((parte) => {
        const limpio = parte.trim();
        if (!limpio) return;
        if (limpio.startsWith('-')) {
            const tag = limpio.slice(1).trim();
            if (tag) excluidos.push(tag.toLowerCase());
        } else {
            incluidos.push(limpio.toLowerCase());
        }
    });
    return { incluidos, excluidos };
};

export const useFiltrosStore = create<EstadoFiltros>((set) => ({
    ...filtrosIniciales,

    setBusqueda: (busqueda) => {
        /*
         * QQ15: busqueda y tags son filtros INDEPENDIENTES.
         * Escribir en el buscador NO parsea tags — solo setea busqueda textual.
         * Tags se gestionan exclusivamente via incluirTag/excluirTag (click en chip).
         * Antes (C115 roto): se auto-parseaba busqueda→tags, causando doble
         * filtrado con normalización inconsistente que eliminaba resultados válidos.
         */
        set({ busqueda, pagina: 1 });
    },
    setPagina: (pagina) => set({ pagina }),
    toggleYaReproducidos: () => set((s) => ({ yaReproducidos: !s.yaReproducidos, pagina: 1 })),
    toggleLikeados: () => set((s) => ({ likeados: !s.likeados, pagina: 1 })),
    toggleDeSeguidos: () => set((s) => ({ deSeguidos: !s.deSeguidos, pagina: 1 })),
    toggleDescargados: () => set((s) => ({ descargados: !s.descargados, pagina: 1 })),
    setOrdenamiento: (ordenamiento) => set({ ordenamiento, pagina: 1 }),
    setPeriodoDestacados: (periodo) => set({ periodoDestacados: periodo, pagina: 1 }),

    /*
     * QL128: Tags y busqueda son INDEPENDIENTES (QQ15).
     * Clickear un tag NO actualiza busqueda — evita que el dropdown de
     * busqueda rapida se abra involuntariamente en el TopBar.
     */
    incluirTag: (tag) => set((s) => {
        const excluidos = s.tagsExcluidos.filter((t) => t !== tag);
        const incluidos = s.tagsIncluidos.includes(tag)
            ? s.tagsIncluidos.filter((t) => t !== tag)
            : [...s.tagsIncluidos, tag];
        return { tagsIncluidos: incluidos, tagsExcluidos: excluidos, pagina: 1 };
    }),
    excluirTag: (tag) => set((s) => {
        const incluidos = s.tagsIncluidos.filter((t) => t !== tag);
        const excluidos = s.tagsExcluidos.includes(tag)
            ? s.tagsExcluidos.filter((t) => t !== tag)
            : [...s.tagsExcluidos, tag];
        return { tagsIncluidos: incluidos, tagsExcluidos: excluidos, pagina: 1 };
    }),
    quitarTag: (tag) => set((s) => {
        const incluidos = s.tagsIncluidos.filter((t) => t !== tag);
        const excluidos = s.tagsExcluidos.filter((t) => t !== tag);
        return { tagsIncluidos: incluidos, tagsExcluidos: excluidos, pagina: 1 };
    }),
    limpiarTags: () => set({ tagsIncluidos: [], tagsExcluidos: [], pagina: 1 }),

    /* C116: BPM rango */
    setBpmRango: (min, max) => set({ bpmMin: min, bpmMax: max, pagina: 1 }),

    /* C274: Filtro free/premium */
    setFiltroPrecio: (filtro) => set({ filtroPrecio: filtro, pagina: 1 }),

    resetearFiltros: () => set({ ...filtrosIniciales }),
}));
