/* sentinel-disable-file limite-lineas: hook central del feed con cache, paginacion, filtros, likes y eventos CRUD; dividirlo completo durante 183A-14 mezclaría una refactorización estructural mayor ajena al fix del falso vacío. */
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
import { useFiltrosStore } from '@app/stores/filtrosStore';
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
import { leerCacheFeed, guardarCacheFeed, leerTotalCacheFeed, invalidarCacheFeed as limpiarCachePersistente } from '@app/utils/cacheFeedPersistente';
import { useFeedRefresco } from '@app/hooks/useFeedRefresco';
import type { SampleResumen } from '@app/types';
import { requiereAuth } from '@app/utils/requiereAuth';
import type { ProveedorSamples } from '@app/components/feed/FeedSamples';

export interface UseFeedSamplesOpciones {
    proveedor: ProveedorSamples;
    samplesIniciales?: SampleResumen[];
    claveCache?: string;
    mostrarTags?: boolean;
    habilitarRefresco?: boolean;
    infiniteScroll?: boolean;
    virtualizar?: boolean;
    maxRenderizados?: number;
    alturaTarjeta?: number;
    onLike?: (sampleId: number, nuevoEstado: boolean) => void;
    idsExcluidos?: Set<number>;
    idsCreadoresIncluidos?: Set<number>;
    onConteoChange?: (total: number) => void;
    /** QL87: Filtro post-procesamiento adicional (useFiltrosContenido.aplicar) */
    filtroAdicional?: (samples: SampleResumen[]) => SampleResumen[];
    /** QL127: Activar filtrado textual client-side (colecciones) */
    busquedaLocal?: boolean;
}

export const ETIQUETAS_CATEGORIA: Record<CategoriaTag, string> = {
    tipo: 'filtros.categoria.tipo',
    genero: 'filtros.categoria.genero',
    instrumento: 'filtros.categoria.instrumento',
    sentimiento: 'filtros.categoria.sentimiento',
    otro: 'filtros.categoria.tags',
};

export const CATEGORIAS_SELECT: CategoriaTag[] = ['genero', 'instrumento', 'tipo'];

export function useFeedSamples(opciones: UseFeedSamplesOpciones) {
    const {
        proveedor,
        samplesIniciales,
        claveCache = 'default',
        habilitarRefresco = true,
        infiniteScroll = true,
        virtualizar = false,
        maxRenderizados = 50,
        alturaTarjeta = 72,
        onLike,
        idsExcluidos,
        idsCreadoresIncluidos,
        onConteoChange,
        filtroAdicional,
        busquedaLocal = false,
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
    /* [183A-114] tagsClientSide=true cuando ya tenemos todos los samples en cliente.
     * Evita llamada extra a /tags/aggregates — tags se calculan de los samples cargados. */
    } = useFeedFiltros({ samples, idsExcluidos, idsCreadoresIncluidos, busquedaClientSide: busquedaLocal, tagsClientSide: busquedaLocal });

    /* QL87: Aplicar filtro adicional de useFiltrosContenido (WAV, me encanta, etc.) */
    const samplesPostFiltro = useMemo(
        () => filtroAdicional ? filtroAdicional(samplesFiltrados) : samplesFiltrados,
        [samplesFiltrados, filtroAdicional]
    );

    /* Arrastre horizontal de tags */
    const { listaTagsRef, arrastrandoTags, iniciarArrastre, moverArrastre, finalizarArrastre } = useFeedArrastreTags();

    /* Virtualización */
    const [indiceInicio, setIndiceInicio] = useState(0);
    const sentinelaRef = useRef<HTMLDivElement | null>(null);

    /* Cache por clave */
    const cacheFeedRef = useRef<Record<string, SampleResumen[]>>({});
    const claveCacheAnteriorRef = useRef(claveCache);
    /* QL82: Total real del servidor para contadores precisos.
     * [183A-24] Se inicializa desde cache para evitar mostrar 30 al cargar datos stale. */
    const totalServidorRef = useRef<number | null>(leerTotalCacheFeed(claveCache));

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

    /* Reset al cambiar claveCache — QK100: cargar cache persistente siempre (stale o fresh) */
    useEffect(() => {
        if (claveCacheAnteriorRef.current !== claveCache) {
            claveCacheAnteriorRef.current = claveCache;
            cacheFeedRef.current = {};
            desyncRecargaRef.current = false;
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
    /* [183A-86] Prevenir loops infinitos de recarga por desync stale/fresh */
    const desyncRecargaRef = useRef(false);

    /* Carga de datos paginada con stale-while-revalidate en pagina 1.
     * QK39: Lee cache persistente (localStorage) si no hay cache en memoria.
     * El usuario ve datos instantaneos de la sesion anterior
     * mientras los datos frescos se cargan en background.
     * QL24: try/finally garantiza que cargando/cargandoMas se resetean
     * incluso cuando el requestId guard cancela la operación. Sin esto,
     * cargandoMas quedaba true permanentemente bloqueando el infinite scroll. */
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
            /* QL35: Revalidar en background. try-catch protege datos stale si la API falla.
             * Solo actualizamos UI y cache si la revalidacion fue exitosa (resultado.ok).
             * Sin esto, un error de red reemplazaba datos validos con array vacio y
             * corrompia el cache persistente — causando feedSamplesVacio intermitente. */
            try {
                const resultado = await proveedor(pagina);
                if (requestIdRef.current !== thisRequest) return;
                if (resultado.ok) {
                    cacheFeedRef.current[key] = resultado.data;
                    if (resultado.total !== undefined) totalServidorRef.current = resultado.total;
                        if (pagina === 1) guardarCacheFeed(claveCache, resultado.data, resultado.total);
                        if (resultado.data.length === 0) setHayMasPaginas(false);
                    setSamples(resultado.data);
                }
            } catch {
                /* Error inesperado: mantener datos stale visibles, no corromper cache */
            }
            return;
        }

        if (esNuevo) {
            setCargando(true);
            setIndiceInicio(0);
        } else {
            setCargandoMas(true);
        }

        try {
            let datos: SampleResumen[] = [];

            if (datosStale) {
                datos = datosStale;
            } else {
                const resultado = await proveedor(pagina);
                if (requestIdRef.current !== thisRequest) return;
                if (!resultado.ok) return;
                /* QL35: Solo cachear resultados exitosos — un error de API no debe
                 * persistir array vacio en localStorage corrompiendo futuras cargas. */
                cacheFeedRef.current[key] = resultado.data;
                if (resultado.total !== undefined) totalServidorRef.current = resultado.total;
                if (pagina === 1) guardarCacheFeed(claveCache, resultado.data, resultado.total);
                datos = resultado.data;
            }

            if (datos.length === 0) setHayMasPaginas(false);

            if (esNuevo) {
                setSamples(datos);
                setPrimeraCargaCompleta(true);
            } else {
                let desyncDetectado = false;
                setSamples(prev => {
                    const idsExistentes = new Set(prev.map(s => s.id));
                    const nuevos = datos.filter(s => !idsExistentes.has(s.id));
                    /* [183A-86] Si TODOS los items de la siguiente página son duplicados
                     * (nuevos=0 pero datos>0), hay desync entre stale local (seed viejo) y
                     * datos frescos del servidor (seed nuevo del bulk-fetch). El dedup descarta
                     * todo y la paginación parece rota. Detectar y marcar para recarga. */
                    if (nuevos.length === 0 && datos.length > 0 && !desyncRecargaRef.current) {
                        desyncDetectado = true;
                        return prev;
                    }
                    desyncRecargaRef.current = false;
                    return [...prev, ...nuevos];
                });
                /* [183A-86] Desync: limpiar cache local y recargar página 1 fresca.
                 * El warm del servidor ya completó (~37ms), así que la API devuelve datos
                 * frescos consistentes. El guard desyncRecargaRef evita loops infinitos. */
                if (desyncDetectado) {
                    desyncRecargaRef.current = true;
                    cacheFeedRef.current = {};
                    limpiarCachePersistente();
                    setPaginaActual(1);
                    setHayMasPaginas(true);
                    cargarPagina(1, true);
                    return;
                }
            }
        } finally {
            /* QL24: Resetear flags de carga SIEMPRE, incluso si requestId guard canceló.
             * Sin este finally, cargandoMas quedaba true permanentemente cuando el proveedor
             * cambiaba durante una carga, bloqueando el IntersectionObserver para siempre. */
            if (esNuevo) {
                setCargando(false);
            } else {
                setCargandoMas(false);
            }
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
    /* [183A-14] En detalle de colección el refresco automático puede convertir un fallo transitorio
     * en un vacío visual. Se desactiva por prop sin alterar el comportamiento del feed general. */
    useFeedRefresco({ paginaActual, cargando, cargandoMas, cargarPagina, habilitado: habilitarRefresco });

    /* Actualizar samples si cambian los iniciales desde fuera */
    useEffect(() => {
        if (samplesIniciales) {
            setSamples(samplesIniciales);
            setCargando(false);
        }
    }, [samplesIniciales]);

    /* Carga manual cuando throttle excede maxAutoCarga — removido en QL79.
     * El throttle ahora pausa 2s y reanuda automaticamente. */

    /* Infinite scroll con IntersectionObserver estable + throttle progresivo.
     * El observer se crea una sola vez y lee estado desde refs para evitar churn.
     * rootMargin: 600px da mas buffer de prefetch para carga fluida.
     * [183A-86] primeraCargaCompleta en deps: cuando no hay cache, el componente
     * muestra skeleton (early return) sin sentinel en el DOM. El observer necesita
     * re-crearse cuando primeraCargaCompleta pasa a true y el sentinel aparece. */
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
    }, [infiniteScroll, cargarPagina, throttle.programarCarga, primeraCargaCompleta]);

    /* [183A-86] Fallback: IntersectionObserver solo dispara cuando la intersección
     * CAMBIA (entra/sale de zona). Si el sentinel ya estaba visible cuando el observer
     * se creó y el guard (cargandoRef) bloqueó, el observer no re-dispara porque el
     * sentinel nunca sale y re-entra en la zona de 600px. Este effect complementa al
     * observer: cuando una carga termina (cargando/cargandoMas → false), verifica
     * manualmente si el sentinel sigue visible para disparar la siguiente página. */
    useEffect(() => {
        if (!infiniteScroll || cargando || cargandoMas) return;
        if (!hayMasPaginas || !primeraCargaCompleta) return;
        const sentinela = sentinelaRef.current;
        if (!sentinela) return;

        const raf = requestAnimationFrame(() => {
            const rect = sentinela.getBoundingClientRect();
            const enZona = rect.top < window.innerHeight + 600;
            if (enZona && !cargandoMasRef.current && !cargandoRef.current && hayMasPaginasRef.current) {
                const nuevaPagina = paginaActualRef.current + 1;
                throttle.programarCarga(nuevaPagina, () => {
                    setPaginaActual(nuevaPagina);
                    cargarPagina(nuevaPagina, false);
                });
            }
        });

        return () => cancelAnimationFrame(raf);
    }, [cargando, cargandoMas, infiniteScroll, hayMasPaginas, primeraCargaCompleta, cargarPagina, throttle.programarCarga]);

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

    /* QL82: Notificar conteo al padre — usa total del servidor si disponible */
    useEffect(() => {
        const total = totalServidorRef.current ?? samplesPostFiltro.length;
        onConteoChange?.(total);
    }, [samplesPostFiltro.length, onConteoChange]);

    /* Likes optimistas (extraido a hook dedicado) */
    const invalidarCacheFeed = useCallback(() => {
        cacheFeedRef.current = {};
        limpiarCachePersistente(claveCache);
    }, [claveCache]);
    const { manejarLike } = useFeedLikes({ samples, setSamples, invalidarCache: invalidarCacheFeed, onLike });

    /* Samples visibles (con virtualización aplicada) */
    const samplesVisibles = useMemo(() => {
        if (virtualizar) {
            return samplesPostFiltro.slice(indiceInicio, indiceInicio + maxRenderizados);
        }
        return samplesPostFiltro;
    }, [virtualizar, samplesPostFiltro, indiceInicio, maxRenderizados]);

    /* [193A-23] Click en badge de tag desde TarjetaSample → búsqueda server-side.
     * No usa manejarIncluirTag (filtro client-side) sino setBusqueda para que el
     * proveedor recargue desde el servidor con ese tag como query FTS. */
    const manejarBuscarTag = useCallback((tag: string) => {
        useFiltrosStore.getState().setBusqueda(tag);
    }, []);

    return {
        /* Estado de carga */
        cargando,
        cargandoMas,
        primeraCargaCompleta,

        /* Samples */
        samplesFiltrados: samplesPostFiltro,
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
        manejarBuscarTag,

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

        /* QL109: Refresco manual (pull-to-refresh) */
        refrescar: useCallback(async () => { await cargarPagina(1, true); }, [cargarPagina]),

        /* Throttle paginacion — pausa automatica, sin boton manual */
    };
}
