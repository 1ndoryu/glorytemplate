/*
 * Hook: useFiltrosContenido — QL87
 * Filtros toggle locales (por contexto/pagina).
 * Cada island crea su propia instancia => independientes entre paginas.
 * Aplica filtros client-side sobre SampleResumen[].
 */

import { useState, useCallback, useMemo, createElement, type ReactNode } from 'react';
import { Play, Heart, Download, Bookmark, FileAudio, Users } from 'lucide-react';
import type { SampleResumen } from '@app/types/sample';

/* QL87: IDs de filtros disponibles */
export type FiltroContenidoId =
    | 'soloWav'
    | 'soloMeEncanta'
    | 'ocultarDescargados'
    | 'ocultarColeccionados'
    | 'ocultarReproducidos'
    | 'ocultarLikeados'
    | 'soloDeSeguidos';

export interface FiltroContenidoDef {
    id: FiltroContenidoId;
    etiqueta: string;
    descripcion: string;
    icono: ReactNode;
}

/* Definiciones de cada filtro (metadatos para la UI) */
const crearDefiniciones = (): Record<FiltroContenidoId, Omit<FiltroContenidoDef, 'id'>> => ({
    soloWav: {
        etiqueta: 'Solo WAV',
        descripcion: 'Mostrar unicamente samples en formato WAV',
        icono: createElement(FileAudio, { size: 16 }),
    },
    soloMeEncanta: {
        etiqueta: 'Solo me encanta',
        descripcion: 'Mostrar unicamente samples que te gustan',
        icono: createElement(Heart, { size: 16 }),
    },
    ocultarDescargados: {
        etiqueta: 'Ocultar ya descargados',
        descripcion: 'Excluir samples que ya tienes descargados',
        icono: createElement(Download, { size: 16 }),
    },
    ocultarColeccionados: {
        etiqueta: 'Ocultar ya coleccionados',
        descripcion: 'Excluir samples guardados en alguna coleccion',
        icono: createElement(Bookmark, { size: 16 }),
    },
    ocultarReproducidos: {
        etiqueta: 'Ocultar ya reproducidos',
        descripcion: 'No mostrar samples que ya escuchaste',
        icono: createElement(Play, { size: 16 }),
    },
    ocultarLikeados: {
        etiqueta: 'Ocultar ya likeados',
        descripcion: 'Excluir samples a los que diste like',
        icono: createElement(Heart, { size: 16 }),
    },
    soloDeSeguidos: {
        etiqueta: 'Solo de personas que sigo',
        descripcion: 'Ver unicamente samples de creadores que sigues',
        icono: createElement(Users, { size: 16 }),
    },
});

const DEFINICIONES = crearDefiniciones();

interface OpcionesFiltrosContenido {
    /** Filtros disponibles para este contexto */
    disponibles: FiltroContenidoId[];
    /* [193A-83] Filtros que se manejan por backend y NO deben aplicarse en `aplicar()`.
     * Siguen visibles en UI y toggleables, pero el callback client-side los ignora
     * para que el cambio de proveedor/claveCache cause un re-fetch limpio
     * en vez de filtrar datos cacheados. */
    servidorSide?: FiltroContenidoId[];
    /**
     * Set de IDs de samples reproducidos (para ocultarReproducidos).
     * Cargar externamente via useHistorialIds si se necesita.
     */
    idsReproducidos?: Set<number>;
    /**
     * Set de IDs de creadores seguidos (para soloDeSeguidos).
     * Cargar externamente via useFiltroIds si se necesita.
     */
    idsSeguidos?: Set<number>;
}

export interface ResultadoFiltrosContenido {
    /** Definiciones de filtros disponibles (para renderizar en UI) */
    filtros: FiltroContenidoDef[];
    /** Estado actual de cada filtro */
    estaActivo: (id: FiltroContenidoId) => boolean;
    /** Toggle on/off un filtro */
    toggle: (id: FiltroContenidoId) => void;
    /** Hay al menos un filtro activo */
    hayActivos: boolean;
    /** Resetear todos los filtros */
    resetear: () => void;
    /** Aplicar filtros a una lista de samples */
    aplicar: (samples: SampleResumen[]) => SampleResumen[];
}

export function useFiltrosContenido(opciones: OpcionesFiltrosContenido): ResultadoFiltrosContenido {
    const { disponibles, servidorSide, idsReproducidos, idsSeguidos } = opciones;
    const [activos, setActivos] = useState<Set<FiltroContenidoId>>(new Set());

    const filtros = useMemo<FiltroContenidoDef[]>(
        () => disponibles.map(id => ({ id, ...DEFINICIONES[id] })),
        [disponibles]
    );

    const toggle = useCallback((id: FiltroContenidoId) => {
        setActivos(prev => {
            const nuevo = new Set(prev);
            if (nuevo.has(id)) nuevo.delete(id);
            else nuevo.add(id);
            return nuevo;
        });
    }, []);

    const estaActivo = useCallback(
        (id: FiltroContenidoId) => activos.has(id),
        [activos]
    );

    const hayActivos = activos.size > 0;

    const resetear = useCallback(() => setActivos(new Set()), []);

    /* [193A-83] Set estable de filtros server-side para evitar recrear `aplicar` innecesariamente */
    const servidorSideSet = useMemo(
        () => new Set(servidorSide ?? []),
        [servidorSide]
    );

    const aplicar = useCallback(
        (samples: SampleResumen[]): SampleResumen[] => {
            if (activos.size === 0) return samples;
            let resultado = samples;

            if (activos.has('soloWav') && !servidorSideSet.has('soloWav')) {
                resultado = resultado.filter(s =>
                    s.formato?.toLowerCase() === 'wav'
                );
            }
            if (activos.has('soloMeEncanta') && !servidorSideSet.has('soloMeEncanta')) {
                /* [193A-44] Filtrar por reaccion 'encanta', no por liked genérico */
                resultado = resultado.filter(s => s.reaccion === 'encanta');
            }
            if (activos.has('ocultarDescargados') && !servidorSideSet.has('ocultarDescargados')) {
                resultado = resultado.filter(s => !s.yaColeccionado);
            }
            if (activos.has('ocultarColeccionados') && !servidorSideSet.has('ocultarColeccionados')) {
                resultado = resultado.filter(s => !s.yaGuardadoEnColeccion);
            }
            if (activos.has('ocultarReproducidos') && !servidorSideSet.has('ocultarReproducidos') && idsReproducidos && idsReproducidos.size > 0) {
                resultado = resultado.filter(s => !idsReproducidos.has(s.id));
            }
            if (activos.has('ocultarLikeados') && !servidorSideSet.has('ocultarLikeados')) {
                resultado = resultado.filter(s => !s.liked);
            }
            if (activos.has('soloDeSeguidos') && !servidorSideSet.has('soloDeSeguidos') && idsSeguidos && idsSeguidos.size > 0) {
                resultado = resultado.filter(s => idsSeguidos.has(s.creador?.id ?? 0));
            }

            return resultado;
        },
        [activos, servidorSideSet, idsReproducidos, idsSeguidos]
    );

    return { filtros, estaActivo, toggle, hayActivos, resetear, aplicar };
}
