/*
 * Hook: useFeedSamples
 * Lógica principal del feed: carga paginada, infinite scroll, virtualización,
 * likes optimistas, eventos CRUD y cache por clave.
 *
 * Filtros/tags delegados a useFeedFiltros.
 * Arrastre horizontal de tags delegado a useFeedArrastreTags.
 * Extraído de FeedSamples.tsx para cumplir SRP.
 *
 * TO-DO: Extraer likes optimistas (manejarLike) y listeners CRUD a hooks separados
 * para bajar de 300 lineas efectivas.
 */

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useNavigationStore } from '@/core/router';
import {
    useMenuContextualSample,
    EVENTO_SAMPLE_ELIMINADO,
    EVENTO_SAMPLE_RESTAURADO,
    EVENTO_SAMPLE_ACTUALIZADO,
    EVENTO_SAMPLE_CREADO,
} from '@app/hooks/useMenuContextualSample';
import { darLike, quitarLike } from '@app/services/apiSocial';
import type { CategoriaTag } from '@app/services/tagUtils';
import { usePanelLateralStore } from '@app/stores/panelLateralStore';
import { useFeedFiltros } from '@app/hooks/useFeedFiltros';
import { useFeedArrastreTags } from '@app/hooks/useFeedArrastreTags';
import { usePaginacionProgresiva } from '@app/hooks/usePaginacionProgresiva';
import type { SampleResumen, TipoReaccion } from '@app/types';
import { requiereAuth } from '@app/utils/requiereAuth';
import type { ProveedorSamples } from '@app/components/feed/FeedSamples';

export interface UseFeedSamplesOpciones {
    proveedor: ProveedorSamples;
    samplesIniciales?: SampleResumen[];
    claveCache?: string;
    mostrarTags?: boolean;
    infiniteScroll?: boolean;
    virtualizar?: boolean;
    maxRenderizados?: number;
    alturaTarjeta?: number;
    onLike?: (sampleId: number, nuevoEstado: boolean) => void;
    idsExcluidos?: Set<number>;
    idsCreadoresIncluidos?: Set<number>;
    onConteoChange?: (total: number) => void;
}

export const ETIQUETAS_CATEGORIA: Record<CategoriaTag, string> = {
    tipo: 'Tipo',
    genero: 'Género',
    instrumento: 'Instrumento',
    sentimiento: 'Sentimiento',
    otro: 'Tags',
};

export const CATEGORIAS_SELECT: CategoriaTag[] = ['genero', 'instrumento', 'tipo'];

export function useFeedSamples(opciones: UseFeedSamplesOpciones) {
    const {
        proveedor,
        samplesIniciales,
        claveCache = 'default',
        infiniteScroll = true,
        virtualizar = true,
        maxRenderizados = 50,
        alturaTarjeta = 72,
        onLike,
        idsExcluidos,
        idsCreadoresIncluidos,
        onConteoChange,
    } = opciones;

    const [samples, setSamples] = useState<SampleResumen[]>(samplesIniciales ?? []);
    const [cargando, setCargando] = useState(!samplesIniciales);
    const [cargandoMas, setCargandoMas] = useState(false);
    const [paginaActual, setPaginaActual] = useState(1);
    const [hayMasPaginas, setHayMasPaginas] = useState(true);

    /* Filtros client-side y agrupación de tags */
    const {
        tagsAgrupados, tagsSueltos, tagsIncluidos, tagsExcluidos,
        bpmMin, bpmMax, incluirTag, excluirTag, quitarTag, setBpmRango,
        samplesFiltrados, manejarIncluirTag, manejarExcluirTag,
    } = useFeedFiltros({ samples, idsExcluidos, idsCreadoresIncluidos });

    /* Arrastre horizontal de tags */
    const { listaTagsRef, arrastrandoTags, iniciarArrastre, moverArrastre, finalizarArrastre } = useFeedArrastreTags();

    /* Virtualización */
    const [indiceInicio, setIndiceInicio] = useState(0);
    const sentinelaRef = useRef<HTMLDivElement | null>(null);

    /* Cache por clave */
    const cacheFeedRef = useRef<Record<string, SampleResumen[]>>({});
    const claveCacheAnteriorRef = useRef(claveCache);

    const navegar = useNavigationStore(s => s.navegar);
    const menu = useMenuContextualSample();

    /* Panel lateral */
    const panelHabilitado = usePanelLateralStore(s => s.habilitado);
    const abrirDetalle = usePanelLateralStore(s => s.abrirDetalle);
    const abrirComentarios = usePanelLateralStore(s => s.abrirComentarios);

    const manejarClickTitulo = useCallback((sample: SampleResumen) => {
        abrirDetalle(sample);
    }, [abrirDetalle]);

    const manejarComentar = useCallback((sampleId: number) => {
        if (!requiereAuth()) return;
        const sample = samples.find(s => s.id === sampleId);
        if (sample) abrirComentarios(sample);
    }, [abrirComentarios, samples]);

    /* Throttle progresivo para infinite scroll */
    const throttle = usePaginacionProgresiva();

    /* Reset al cambiar claveCache */
    useEffect(() => {
        if (claveCacheAnteriorRef.current !== claveCache) {
            claveCacheAnteriorRef.current = claveCache;
            cacheFeedRef.current = {};
            setPaginaActual(1);
            setHayMasPaginas(true);
            setIndiceInicio(0);
            throttle.resetear();
        }
    }, [claveCache, throttle.resetear]);

    /* Guard contra race conditions */
    const requestIdRef = useRef(0);

    /* Carga de datos paginada */
    const cargarPagina = useCallback(async (pagina: number, esNuevo: boolean) => {
        const thisRequest = ++requestIdRef.current;
        const key = `${claveCache}_p${pagina}`;

        if (esNuevo) {
            setCargando(true);
            setIndiceInicio(0);
        } else {
            setCargandoMas(true);
        }

        let resultado: SampleResumen[] = [];

        if (cacheFeedRef.current[key]) {
            resultado = cacheFeedRef.current[key];
        } else {
            resultado = await proveedor(pagina);
            if (requestIdRef.current !== thisRequest) return;
            cacheFeedRef.current[key] = resultado;
        }

        if (resultado.length === 0) setHayMasPaginas(false);

        if (esNuevo) {
            setSamples(resultado);
            setCargando(false);
        } else {
            setSamples(prev => {
                const idsExistentes = new Set(prev.map(s => s.id));
                const nuevos = resultado.filter(s => !idsExistentes.has(s.id));
                return [...prev, ...nuevos];
            });
            setCargandoMas(false);
        }
    }, [claveCache, proveedor]);

    /* Carga inicial */
    useEffect(() => {
        if (samplesIniciales) return;
        setPaginaActual(1);
        setHayMasPaginas(true);
        cargarPagina(1, true);
    }, [cargarPagina, samplesIniciales]);

    /* Actualizar samples si cambian los iniciales desde fuera */
    useEffect(() => {
        if (samplesIniciales) {
            setSamples(samplesIniciales);
            setCargando(false);
        }
    }, [samplesIniciales]);

    /* Carga manual cuando throttle excede maxAutoCarga */
    const cargarMasManual = useCallback(() => {
        const nuevaPagina = paginaActual + 1;
        throttle.cargarManual(() => {
            setPaginaActual(nuevaPagina);
            cargarPagina(nuevaPagina, false);
        });
    }, [paginaActual, throttle.cargarManual, cargarPagina]);

    /* Infinite scroll con IntersectionObserver + throttle progresivo */
    useEffect(() => {
        if (!infiniteScroll || throttle.requiereManual) return;
        const sentinela = sentinelaRef.current;
        if (!sentinela) return;

        const observer = new IntersectionObserver(
            entries => {
                if (entries[0].isIntersecting && !cargandoMas && hayMasPaginas && !cargando) {
                    const nuevaPagina = paginaActual + 1;
                    throttle.programarCarga(nuevaPagina, () => {
                        setPaginaActual(nuevaPagina);
                        cargarPagina(nuevaPagina, false);
                    });
                }
            },
            { rootMargin: '200px' },
        );

        observer.observe(sentinela);
        return () => observer.disconnect();
    }, [infiniteScroll, cargandoMas, hayMasPaginas, cargando, paginaActual, cargarPagina, throttle.requiereManual, throttle.programarCarga]);

    /* Virtualización: ajustar rango visible al scroll */
    useEffect(() => {
        if (!virtualizar) return;
        const manejarScroll = () => {
            const scrollTop = window.scrollY;
            const nuevoInicio = Math.max(0, Math.floor(scrollTop / alturaTarjeta) - 10);
            setIndiceInicio(nuevoInicio);
        };
        window.addEventListener('scroll', manejarScroll, { passive: true });
        return () => window.removeEventListener('scroll', manejarScroll);
    }, [virtualizar, alturaTarjeta]);

    /* Listener para CRUD de samples */
    const cargarPaginaRef = useRef(cargarPagina);
    cargarPaginaRef.current = cargarPagina;

    useEffect(() => {
        const manejarEliminacion = (event: Event) => {
            const detalle = (event as CustomEvent<{ sampleId?: number }>).detail;
            if (detalle?.sampleId) {
                setSamples(prev => prev.filter(s => s.id !== detalle.sampleId));
                cacheFeedRef.current = {};
            }
        };

        const manejarRestauracion = (event: Event) => {
            const detalle = (event as CustomEvent<{ sample?: SampleResumen }>).detail;
            if (detalle?.sample) {
                setSamples(prev => {
                    if (prev.some(s => s.id === detalle.sample!.id)) return prev;
                    return [detalle.sample!, ...prev];
                });
                cacheFeedRef.current = {};
            }
        };

        const manejarActualizacion = (event: Event) => {
            const detalle = (event as CustomEvent<{ sampleId?: number; cambios?: Partial<SampleResumen> }>).detail;
            if (detalle?.sampleId && detalle?.cambios) {
                setSamples(prev => prev.map(s =>
                    s.id === detalle.sampleId ? { ...s, ...detalle.cambios } : s,
                ));
            }
        };

        const manejarCreacion = () => {
            cacheFeedRef.current = {};
            setPaginaActual(1);
            setHayMasPaginas(true);
            cargarPaginaRef.current(1, true);
        };

        window.addEventListener(EVENTO_SAMPLE_ELIMINADO, manejarEliminacion as EventListener);
        window.addEventListener(EVENTO_SAMPLE_RESTAURADO, manejarRestauracion as EventListener);
        window.addEventListener(EVENTO_SAMPLE_ACTUALIZADO, manejarActualizacion as EventListener);
        window.addEventListener(EVENTO_SAMPLE_CREADO, manejarCreacion);
        return () => {
            window.removeEventListener(EVENTO_SAMPLE_ELIMINADO, manejarEliminacion as EventListener);
            window.removeEventListener(EVENTO_SAMPLE_RESTAURADO, manejarRestauracion as EventListener);
            window.removeEventListener(EVENTO_SAMPLE_ACTUALIZADO, manejarActualizacion as EventListener);
            window.removeEventListener(EVENTO_SAMPLE_CREADO, manejarCreacion);
        };
    }, []);

    /* Notificar conteo al padre */
    useEffect(() => {
        onConteoChange?.(samplesFiltrados.length);
    }, [samplesFiltrados.length, onConteoChange]);

    const abrirSugerencias = usePanelLateralStore(s => s.abrirSugerencias);

    /* Like optimistic UI con soporte de reacciones */
    const manejarLike = useCallback(async (sampleId: number, reaccion?: TipoReaccion) => {
        if (!requiereAuth()) return;
        const sampleRef = samples.find(s => s.id === sampleId) ?? null;

        if (reaccion) {
            const eraPositivo = sampleRef?.reaccion === 'like' || sampleRef?.reaccion === 'encanta';
            const esPositivo = reaccion !== 'dislike';
            const delta = (esPositivo ? 1 : 0) - (eraPositivo ? 1 : 0);
            setSamples(prev =>
                prev.map(s =>
                    s.id === sampleId
                        ? { ...s, liked: esPositivo, reaccion, totalLikes: Math.max(0, s.totalLikes + delta) }
                        : s,
                ),
            );
            cacheFeedRef.current = {};
            await darLike('sample', sampleId, reaccion);
            if (esPositivo && sampleRef) abrirSugerencias(sampleRef);
            onLike?.(sampleId, true);
        } else if (sampleRef?.liked || sampleRef?.reaccion) {
            const eraPositivo = sampleRef?.reaccion === 'like' || sampleRef?.reaccion === 'encanta';
            setSamples(prev =>
                prev.map(s =>
                    s.id === sampleId
                        ? { ...s, liked: false, reaccion: null, totalLikes: Math.max(0, s.totalLikes - (eraPositivo ? 1 : 0)) }
                        : s,
                ),
            );
            cacheFeedRef.current = {};
            await quitarLike('sample', sampleId);
            onLike?.(sampleId, false);
        } else {
            setSamples(prev =>
                prev.map(s =>
                    s.id === sampleId
                        ? { ...s, liked: true, reaccion: 'like' as const, totalLikes: s.totalLikes + 1 }
                        : s,
                ),
            );
            cacheFeedRef.current = {};
            await darLike('sample', sampleId, 'like');
            if (sampleRef) abrirSugerencias(sampleRef);
            onLike?.(sampleId, true);
        }
    }, [samples, onLike, abrirSugerencias]);

    /* Samples visibles (con virtualización aplicada) */
    const samplesVisibles = useMemo(() => {
        if (virtualizar) {
            return samplesFiltrados.slice(indiceInicio, indiceInicio + maxRenderizados);
        }
        return samplesFiltrados;
    }, [virtualizar, samplesFiltrados, indiceInicio, maxRenderizados]);

    return {
        /* Estado de carga */
        cargando,
        cargandoMas,

        /* Samples */
        samplesFiltrados,
        samplesVisibles,

        /* Virtualización */
        indiceInicio,
        sentinelaRef,
        alturaTarjeta,
        maxRenderizados,
        virtualizar,
        infiniteScroll,

        /* Tags y filtros */
        tagsAgrupados,
        tagsSueltos,
        tagsIncluidos,
        tagsExcluidos,
        bpmMin,
        bpmMax,
        incluirTag,
        excluirTag,
        quitarTag,
        setBpmRango,
        manejarIncluirTag,
        manejarExcluirTag,

        /* Arrastre de tags */
        listaTagsRef,
        arrastrandoTags,
        iniciarArrastre,
        moverArrastre,
        finalizarArrastre,

        /* Interacciones */
        manejarLike,
        navegar,
        menu,
        panelHabilitado,
        manejarClickTitulo,
        manejarComentar,

        /* Throttle paginacion */
        requiereManual: throttle.requiereManual,
        cargarMasManual,
    };
}
