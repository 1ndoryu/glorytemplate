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
import type { CategoriaTag } from '@app/services/tagUtils';
import { usePanelLateralStore } from '@app/stores/panelLateralStore';
import { useFeedFiltros } from '@app/hooks/useFeedFiltros';
import { useFeedArrastreTags } from '@app/hooks/useFeedArrastreTags';
import { usePaginacionProgresiva } from '@app/hooks/usePaginacionProgresiva';
import { useFeedLikes } from '@app/hooks/useFeedLikes';
import { leerCacheFeed, guardarCacheFeed, invalidarCacheFeed as limpiarCachePersistente } from '@app/utils/cacheFeedPersistente';
import { useFeedRefresco } from '@app/hooks/useFeedRefresco';
import type { SampleResumen } from '@app/types';
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

    /* QK100: Inicializar samples desde cache persistente. leerCacheFeed() SIEMPRE
     * devuelve datos si existen (sin importar antigüedad). Solo retorna null si
     * el cache nunca existio o supero TTL maximo (7 dias). Esto garantiza que el
     * usuario nunca ve "Cargando samples..." salvo en su primera visita absoluta.
     * Revalidacion ocurre en background via esCacheStale(). */
    const [samples, setSamples] = useState<SampleResumen[]>(() => {
        if (samplesIniciales) return samplesIniciales;
        return leerCacheFeed(claveCache) ?? [];
    });
    const [cargando, setCargando] = useState(() => {
        if (samplesIniciales) return false;
        /* QK100: Si hay datos cacheados (stale o fresh), no mostrar loading */
        const cached = leerCacheFeed(claveCache);
        return !cached || cached.length === 0;
    });

    /* QL20: Flag robusto que indica si al menos una carga exitosa (API o cache) ha ocurrido.
     * Sin esto, race conditions entre useCallback/useEffect/proveedor pueden generar un
     * render intermedio donde cargando=false y samples=[] — mostrando "No se encontraron
     * samples" en vez del skeleton. primeraCargaCompleta solo se activa cuando HAY datos
     * reales (cache persistente o respuesta API), eliminando cualquier flash del estado vacio. */
    const [primeraCargaCompleta, setPrimeraCargaCompleta] = useState(() => {
        if (samplesIniciales && samplesIniciales.length > 0) return true;
        const cached = leerCacheFeed(claveCache);
        return cached !== null && cached.length > 0;
    });
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

    /* Refs para mantener el IntersectionObserver estable.
     * Sin refs, el observer se destruye/recrea en cada cambio de estado
     * (cargandoMas, hayMasPaginas, paginaActual, etc.), causando delay perceptible
     * al cargar paginas siguientes. Con refs, el observer vive toda la sesion del feed. */
    const cargandoMasRef = useRef(cargandoMas);
    cargandoMasRef.current = cargandoMas;
    const hayMasPaginasRef = useRef(hayMasPaginas);
    hayMasPaginasRef.current = hayMasPaginas;
    const cargandoRef = useRef(cargando);
    cargandoRef.current = cargando;
    const paginaActualRef = useRef(paginaActual);
    paginaActualRef.current = paginaActual;
    const requiereManualRef = useRef(throttle.requiereManual);
    requiereManualRef.current = throttle.requiereManual;

    /* Reset al cambiar claveCache — QK100: cargar cache persistente siempre (stale o fresh) */
    useEffect(() => {
        if (claveCacheAnteriorRef.current !== claveCache) {
            claveCacheAnteriorRef.current = claveCache;
            cacheFeedRef.current = {};
            setPaginaActual(1);
            setHayMasPaginas(true);
            setIndiceInicio(0);
            throttle.resetear();
            /* QK100: Restaurar datos del nuevo cache key (siempre disponibles si hay cache) */
            const cached = leerCacheFeed(claveCache);
            if (cached && cached.length > 0) {
                setSamples(cached);
                setCargando(false);
                setPrimeraCargaCompleta(true);
            } else {
                /* QL20: Nuevo cache key sin datos — volver a skeleton hasta que la API responda */
                setPrimeraCargaCompleta(false);
            }
        }
    }, [claveCache, throttle.resetear]);

    /* Guard contra race conditions */
    const requestIdRef = useRef(0);

    /* Carga de datos paginada con stale-while-revalidate en pagina 1.
     * QK39: Lee cache persistente (localStorage) si no hay cache en memoria.
     * El usuario ve datos instantaneos de la sesion anterior
     * mientras los datos frescos se cargan en background. */
    const cargarPagina = useCallback(async (pagina: number, esNuevo: boolean) => {
        const thisRequest = ++requestIdRef.current;
        const key = `${claveCache}_p${pagina}`;

        /* Stale-while-revalidate: si tenemos cache (memoria o persistente),
         * mostrar inmediatamente y revalidar en background. */
        const datosStale = cacheFeedRef.current[key]
            ?? (pagina === 1 ? leerCacheFeed(claveCache) : null);
        if (datosStale && esNuevo) {
            setSamples(datosStale);
            setCargando(false);
            setPrimeraCargaCompleta(true);
            /* Revalidar en background sin loader */
            const frescos = await proveedor(pagina);
            if (requestIdRef.current !== thisRequest) return;
            cacheFeedRef.current[key] = frescos;
            if (pagina === 1) guardarCacheFeed(claveCache, frescos);
            if (frescos.length === 0) setHayMasPaginas(false);
            setSamples(frescos);
            return;
        }

        if (esNuevo) {
            setCargando(true);
            setIndiceInicio(0);
        } else {
            setCargandoMas(true);
        }

        let resultado: SampleResumen[] = [];

        if (datosStale) {
            resultado = datosStale;
        } else {
            resultado = await proveedor(pagina);
            if (requestIdRef.current !== thisRequest) return;
            cacheFeedRef.current[key] = resultado;
            /* QK39: Persistir pagina 1 para stale-first en recargas */
            if (pagina === 1) guardarCacheFeed(claveCache, resultado);
        }

        if (resultado.length === 0) setHayMasPaginas(false);

        if (esNuevo) {
            setSamples(resultado);
            setCargando(false);
            setPrimeraCargaCompleta(true);
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

    /* QK55: Polling cada 5 min + refresco al volver a la pestana */
    useFeedRefresco({ paginaActual, cargando, cargandoMas, cargarPagina });

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

    /* Infinite scroll con IntersectionObserver estable + throttle progresivo.
     * El observer se crea una sola vez y lee estado desde refs para evitar churn.
     * rootMargin: 600px da mas buffer de prefetch para carga fluida. */
    useEffect(() => {
        if (!infiniteScroll) return;
        const sentinela = sentinelaRef.current;
        if (!sentinela) return;

        const observer = new IntersectionObserver(
            entries => {
                if (
                    entries[0].isIntersecting
                    && !cargandoMasRef.current
                    && hayMasPaginasRef.current
                    && !cargandoRef.current
                    && !requiereManualRef.current
                ) {
                    const nuevaPagina = paginaActualRef.current + 1;
                    throttle.programarCarga(nuevaPagina, () => {
                        setPaginaActual(nuevaPagina);
                        cargarPagina(nuevaPagina, false);
                    });
                }
            },
            { rootMargin: '600px' },
        );

        observer.observe(sentinela);
        return () => observer.disconnect();
    }, [infiniteScroll, cargarPagina, throttle.programarCarga]);

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
                limpiarCachePersistente();
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
                limpiarCachePersistente();
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
            limpiarCachePersistente();
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

    /* Likes optimistas (extraido a hook dedicado) */
    const invalidarCacheFeed = useCallback(() => {
        cacheFeedRef.current = {};
        limpiarCachePersistente(claveCache);
    }, [claveCache]);
    const { manejarLike } = useFeedLikes({ samples, setSamples, invalidarCache: invalidarCacheFeed, onLike });

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
        primeraCargaCompleta,

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
