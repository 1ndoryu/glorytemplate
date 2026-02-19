/*
 * FeedSamples — Componente centralizado de lista de samples.
 *
 * Reutilizable en: InicioIsland, ColeccionDetalleIsland, Tab "Más Ideas",
 * PerfilIsland, DescubrirIsland, y cualquier vista que liste samples.
 *
 * Features:
 * - Infinite scroll con IntersectionObserver
 * - Virtualización DOM (MAX_RENDERIZADOS configurable)
 * - Tags dinámicos con inclusión/exclusión
 * - Optimistic UI para likes
 * - Menú contextual + inspector
 * - Proveedor de datos genérico (prop función)
 */

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { Music, Plus, Minus } from 'lucide-react';
import '../../styles/componentes/feedSamples.css';
import { TarjetaSample } from '@app/components/ui/TarjetaSample';
import { MenuContextual } from '@app/components/ui/MenuContextual';
import { ModalInspectorSample } from '@app/components/ui/ModalInspectorSample';
import { SelectFiltro } from '@app/components/ui/SelectFiltro';
import { SelectorBPM } from '@app/components/ui/SelectorBPM';
import { useNavigationStore } from '@/core/router';
import { useMenuContextualSample, EVENTO_SAMPLE_ELIMINADO, EVENTO_SAMPLE_RESTAURADO, EVENTO_SAMPLE_ACTUALIZADO, EVENTO_SAMPLE_CREADO } from '@app/hooks/useMenuContextualSample';
import { darLike, quitarLike } from '@app/services/apiSocial';
import { extraerTagsMetadata, extraerTagsAgrupadosMetadata, type CategoriaTag } from '@app/services/tagUtils';
import { usePanelLateralStore } from '@app/stores/panelLateralStore';
import { useFiltrosStore } from '@app/stores/filtrosStore';
import type { SampleResumen, TipoReaccion } from '@app/types';

/* Tipo del proveedor de datos: recibe página, devuelve samples */
export type ProveedorSamples = (pagina: number) => Promise<SampleResumen[]>;

export interface FeedSamplesProps {
    /* Función que carga samples por página */
    proveedor: ProveedorSamples;
    /* Samples iniciales ya cargados (opcional, evita fetch inicial) */
    samplesIniciales?: SampleResumen[];
    /* Clave para invalidar cache al cambiar filtros/contexto */
    claveCache?: string;
    /* Mostrar barra de tags dinámicos */
    mostrarTags?: boolean;
    /* Habilitar infinite scroll */
    infiniteScroll?: boolean;
    /* Habilitar virtualización DOM */
    virtualizar?: boolean;
    /* Máx tarjetas renderizadas (virtualización) */
    maxRenderizados?: number;
    /* Altura estimada de cada tarjeta para virtualización */
    alturaTarjeta?: number;
    /* Mensaje cuando no hay samples */
    mensajeVacio?: string;
    /* Componente extra debajo del último sample (ej: botón "crear") */
    accionVacia?: React.ReactNode;
    /* Clase CSS extra para el contenedor */
    className?: string;
    /* ID del contenedor principal */
    id?: string;
    /* Callback al dar like (para integración con store externo) */
    onLike?: (sampleId: number, nuevoEstado: boolean) => void;
    /* IDs a excluir de la lista (ej: filtro "Ya reproducidos") */
    idsExcluidos?: Set<number>;
    /* IDs de creadores para incluir exclusivamente (filtro "solo seguidos") */
    idsCreadoresIncluidos?: Set<number>;
    /* Callback con total de samples filtrados (para contadores externos) */
    onConteoChange?: (total: number) => void;
}

const ETIQUETAS_CATEGORIA: Record<CategoriaTag, string> = {
    tipo: 'Tipo',
    genero: 'Género',
    instrumento: 'Instrumento',
    sentimiento: 'Sentimiento',
    otro: 'Tags',
};

export const FeedSamples = ({
    proveedor,
    samplesIniciales,
    claveCache = 'default',
    mostrarTags = false,
    infiniteScroll = true,
    virtualizar = true,
    maxRenderizados = 50,
    alturaTarjeta = 72,
    mensajeVacio = 'No se encontraron samples.',
    accionVacia,
    className = '',
    id,
    onLike,
    idsExcluidos,
    idsCreadoresIncluidos,
    onConteoChange,
}: FeedSamplesProps): JSX.Element => {
    const [samples, setSamples] = useState<SampleResumen[]>(samplesIniciales ?? []);
    const [cargando, setCargando] = useState(!samplesIniciales);
    const [cargandoMas, setCargandoMas] = useState(false);
    const [paginaActual, setPaginaActual] = useState(1);
    const [hayMasPaginas, setHayMasPaginas] = useState(true);

    /* C115: Tags del store global (sincronizados con búsqueda del TopBar) */
    const tagsIncluidos = useFiltrosStore(s => s.tagsIncluidos);
    const tagsExcluidos = useFiltrosStore(s => s.tagsExcluidos);
    const bpmMin = useFiltrosStore(s => s.bpmMin);
    const bpmMax = useFiltrosStore(s => s.bpmMax);
    const filtroPrecio = useFiltrosStore(s => s.filtroPrecio);
    const incluirTag = useFiltrosStore(s => s.incluirTag);
    const excluirTag = useFiltrosStore(s => s.excluirTag);
    const quitarTag = useFiltrosStore(s => s.quitarTag);
    const setBpmRango = useFiltrosStore(s => s.setBpmRango);

    /* Arrastre horizontal de tags */
    const [arrastrandoTags, setArrastrandoTags] = useState(false);
    const inicioXRef = useRef(0);
    const scrollInicialRef = useRef(0);
    const listaTagsRef = useRef<HTMLDivElement | null>(null);

    /* Virtualización */
    const [indiceInicio, setIndiceInicio] = useState(0);
    const sentinelaRef = useRef<HTMLDivElement | null>(null);

    /* Cache por clave */
    const cacheFeedRef = useRef<Record<string, SampleResumen[]>>({});
    const claveCacheAnteriorRef = useRef(claveCache);

    const { navegar } = useNavigationStore();
    const menu = useMenuContextualSample();

    /* Panel lateral: si está habilitado, interceptar clicks de título y comentar (C86+C95) */
    const panelHabilitado = usePanelLateralStore(s => s.habilitado);
    const abrirDetalle = usePanelLateralStore(s => s.abrirDetalle);
    const abrirComentarios = usePanelLateralStore(s => s.abrirComentarios);

    const manejarClickTitulo = useCallback((sample: SampleResumen) => {
        abrirDetalle(sample);
    }, [abrirDetalle]);

    const manejarComentar = useCallback((sampleId: number) => {
        const sample = samples.find(s => s.id === sampleId);
        if (sample) abrirComentarios(sample);
    }, [abrirComentarios, samples]);

    /* Reset al cambiar claveCache (cambio de contexto: ordenamiento/periodo, NO filtros client-side) */
    useEffect(() => {
        if (claveCacheAnteriorRef.current !== claveCache) {
            claveCacheAnteriorRef.current = claveCache;
            cacheFeedRef.current = {};
            setPaginaActual(1);
            setHayMasPaginas(true);
            setIndiceInicio(0);
            /* No limpiar tags/búsqueda — son filtros client-side independientes del cache */
        }
    }, [claveCache]);

    /* Guard contra race conditions: descarta respuestas de requests anteriores (C46) */
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
            /* Si llegó una request más nueva, descartar esta respuesta */
            if (requestIdRef.current !== thisRequest) return;
            cacheFeedRef.current[key] = resultado;
        }

        if (resultado.length === 0) setHayMasPaginas(false);

        if (esNuevo) {
            setSamples(resultado);
            setCargando(false);
        } else {
            setSamples((prev) => {
                const idsExistentes = new Set(prev.map((s) => s.id));
                const nuevos = resultado.filter((s) => !idsExistentes.has(s.id));
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

    /* Infinite scroll con IntersectionObserver */
    useEffect(() => {
        if (!infiniteScroll) return;
        const sentinela = sentinelaRef.current;
        if (!sentinela) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && !cargandoMas && hayMasPaginas && !cargando) {
                    const nuevaPagina = paginaActual + 1;
                    setPaginaActual(nuevaPagina);
                    cargarPagina(nuevaPagina, false);
                }
            },
            { rootMargin: '200px' }
        );

        observer.observe(sentinela);
        return () => observer.disconnect();
    }, [infiniteScroll, cargandoMas, hayMasPaginas, cargando, paginaActual, cargarPagina]);

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

    /* Escuchar eliminación de samples para remover sin recargar (C66) */
    /* C223: Ref para cargarPagina accesible dentro del listener de eventos (evita stale closure) */
    const cargarPaginaRef = useRef(cargarPagina);
    cargarPaginaRef.current = cargarPagina;

    useEffect(() => {
        const manejarEliminacion = (event: Event) => {
            const detalle = (event as CustomEvent<{ sampleId?: number }>).detail;
            if (detalle?.sampleId) {
                setSamples((prev) => prev.filter((s) => s.id !== detalle.sampleId));
                cacheFeedRef.current = {};
            }
        };

        const manejarRestauracion = (event: Event) => {
            const detalle = (event as CustomEvent<{ sample?: SampleResumen }>).detail;
            if (detalle?.sample) {
                setSamples((prev) => {
                    if (prev.some((s) => s.id === detalle.sample!.id)) return prev;
                    return [detalle.sample!, ...prev];
                });
                cacheFeedRef.current = {};
            }
        };

        /* C178: Actualizar propiedades de un sample en la lista (ej: verificado) */
        const manejarActualizacion = (event: Event) => {
            const detalle = (event as CustomEvent<{ sampleId?: number; cambios?: Partial<SampleResumen> }>).detail;
            if (detalle?.sampleId && detalle?.cambios) {
                setSamples((prev) => prev.map((s) =>
                    s.id === detalle.sampleId ? { ...s, ...detalle.cambios } : s
                ));
            }
        };

        /* C223: Refrescar lista de samples al publicar uno nuevo */
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

    /*
     * C116: Tags agrupados por categoría (selects) + tags sueltos ("otro").
     * Los selects comprimen géneros, instrumentos, etc.
     * Los tags "otro" se muestran en fila horizontal draggable.
     */
    const tagsAgrupados = useMemo(() => {
        return extraerTagsAgrupadosMetadata(samples);
    }, [samples]);

    /* Máximo de tags sueltos ("otro") visibles — sin compresión, con scroll */
    const MAX_TAGS_SUELTOS = 30;
    const tagsSueltos = useMemo(() => {
        return (tagsAgrupados.otro ?? []).slice(0, MAX_TAGS_SUELTOS);
    }, [tagsAgrupados]);

    /* Categorías que van en selects (excluye "otro") */
    const CATEGORIAS_SELECT: CategoriaTag[] = ['genero', 'instrumento', 'sentimiento', 'tipo'];

    /* Filtrar por tags, por IDs excluidos y por creadores incluídos */
    const samplesFiltrados = useMemo(() => {
        let resultado = samples;

        /* Exclusión por IDs (ej: "Ya reproducidos", "Ya likeados", "Ya descargados") */
        if (idsExcluidos && idsExcluidos.size > 0) {
            resultado = resultado.filter((s) => !idsExcluidos.has(s.id));
        }

        /* Inclusión por creador (filtro "solo seguidos") */
        if (idsCreadoresIncluidos && idsCreadoresIncluidos.size > 0) {
            resultado = resultado.filter((s) => {
                const creadorId = s.creador?.id ?? (s as unknown as Record<string, unknown>).creadorId;
                return typeof creadorId === 'number' && idsCreadoresIncluidos.has(creadorId);
            });
        }

        /* C116: Filtro por rango BPM */
        if (bpmMin !== null || bpmMax !== null) {
            resultado = resultado.filter((s) => {
                const bpm = (s as unknown as Record<string, unknown>).bpm as number | undefined;
                if (bpm === undefined || bpm === null) return true;
                if (bpmMin !== null && bpm < bpmMin) return false;
                if (bpmMax !== null && bpm > bpmMax) return false;
                return true;
            });
        }

        /* C274: Filtro por precio (gratis/premium) */
        if (filtroPrecio === 'gratis') {
            resultado = resultado.filter((s) => !s.esPremium);
        } else if (filtroPrecio === 'premium') {
            resultado = resultado.filter((s) => s.esPremium);
        }

        /* Inclusión/exclusión por tags (C134: usa tags del metadata IA) */
        if (tagsIncluidos.length === 0 && tagsExcluidos.length === 0) return resultado;
        return resultado.filter((s) => {
            const tagsSample = extraerTagsMetadata(s);
            return tagsIncluidos.every((t) => tagsSample.includes(t))
                && tagsExcluidos.every((t) => !tagsSample.includes(t));
        });
    }, [samples, tagsIncluidos, tagsExcluidos, bpmMin, bpmMax, filtroPrecio, idsExcluidos, idsCreadoresIncluidos]);

    /* Notificar conteo al padre (ultra-eficiente: solo lee .length) */
    useEffect(() => {
        onConteoChange?.(samplesFiltrados.length);
    }, [samplesFiltrados.length, onConteoChange]);

    /* C115: Handlers de tags usan store global (sync con búsqueda) */
    const manejarIncluirTag = useCallback((tag: string) => {
        incluirTag(tag);
    }, [incluirTag]);

    const manejarExcluirTag = useCallback((tag: string) => {
        excluirTag(tag);
    }, [excluirTag]);

    /* Arrastre horizontal de tags */
    const iniciarArrastre = useCallback((clientX: number) => {
        if (!listaTagsRef.current) return;
        setArrastrandoTags(true);
        inicioXRef.current = clientX;
        scrollInicialRef.current = listaTagsRef.current.scrollLeft;
    }, []);

    const moverArrastre = useCallback((clientX: number) => {
        if (!arrastrandoTags || !listaTagsRef.current) return;
        listaTagsRef.current.scrollLeft = scrollInicialRef.current - (clientX - inicioXRef.current);
    }, [arrastrandoTags]);

    const finalizarArrastre = useCallback(() => setArrastrandoTags(false), []);

    const { abrirSugerencias } = usePanelLateralStore();

    /* Like optimistic UI con soporte de reacciones */
    const manejarLike = useCallback(async (sampleId: number, reaccion?: TipoReaccion) => {
        const sampleRef = samples.find((s) => s.id === sampleId) ?? null;

        if (reaccion) {
            /* Reaccion especifica desde tooltip */
            const eraPositivo = sampleRef?.reaccion === 'like' || sampleRef?.reaccion === 'encanta';
            const esPositivo = reaccion !== 'dislike';
            const delta = (esPositivo ? 1 : 0) - (eraPositivo ? 1 : 0);
            setSamples((prev) =>
                prev.map((s) =>
                    s.id === sampleId
                        ? { ...s, liked: esPositivo, reaccion, totalLikes: Math.max(0, s.totalLikes + delta) }
                        : s
                )
            );
            cacheFeedRef.current = {};
            await darLike('sample', sampleId, reaccion);
            /* C135: Abrir sugerencias en reacciones positivas */
            if (esPositivo && sampleRef) abrirSugerencias(sampleRef);
            onLike?.(sampleId, true);
        } else if (sampleRef?.liked || sampleRef?.reaccion) {
            /* Quitar reaccion */
            const eraPositivo = sampleRef?.reaccion === 'like' || sampleRef?.reaccion === 'encanta';
            setSamples((prev) =>
                prev.map((s) =>
                    s.id === sampleId
                        ? { ...s, liked: false, reaccion: null, totalLikes: Math.max(0, s.totalLikes - (eraPositivo ? 1 : 0)) }
                        : s
                )
            );
            cacheFeedRef.current = {};
            await quitarLike('sample', sampleId);
            onLike?.(sampleId, false);
        } else {
            /* Like simple */
            setSamples((prev) =>
                prev.map((s) =>
                    s.id === sampleId
                        ? { ...s, liked: true, reaccion: 'like' as const, totalLikes: s.totalLikes + 1 }
                        : s
                )
            );
            cacheFeedRef.current = {};
            await darLike('sample', sampleId, 'like');
            if (sampleRef) abrirSugerencias(sampleRef);
            onLike?.(sampleId, true);
        }
    }, [samples, onLike, abrirSugerencias]);

    /* Renderizar tags (un item con +/-/texto) */
    const renderizarTag = useCallback((tag: string) => (
        <div
            key={tag}
            className={`feedTagItem ${tagsIncluidos.includes(tag) ? 'feedTagItemIncluido' : ''} ${tagsExcluidos.includes(tag) ? 'feedTagItemExcluido' : ''}`}
        >
            <button type="button" className="feedTagBoton feedTagBotonRestar"
                aria-label={`Excluir tag ${tag}`}
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => { e.stopPropagation(); manejarExcluirTag(tag); }}
            >
                <Minus size={10} />
            </button>
            <span className="feedTagTexto" role="button" tabIndex={0}
                aria-label={`Incluir tag ${tag}`}
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => { e.stopPropagation(); manejarIncluirTag(tag); }}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); manejarIncluirTag(tag); } }}
            >
                {tag}
            </span>
            <button type="button" className="feedTagBoton feedTagBotonSumar"
                aria-label={`Incluir tag ${tag}`}
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => { e.stopPropagation(); manejarIncluirTag(tag); }}
            >
                <Plus size={10} />
            </button>
        </div>
    ), [tagsIncluidos, tagsExcluidos, manejarIncluirTag, manejarExcluirTag]);

    /* Loading state */
    if (cargando) {
        return (
            <div className={`feedSamplesContenedor ${className}`} id={id}>
                <div className="feedSamplesVacio">
                    <Music size={40} className="feedSamplesVacioIcono" />
                    <p>Cargando samples…</p>
                </div>
            </div>
        );
    }

    return (
        <div className={`feedSamplesContenedor ${className}`} id={id}>
            {/* C116: Fila de selects por categoría + tags sueltos draggable */}
            {mostrarTags && (
                <div className="feedTags">
                    {/* Fila 1: Selects de categorías + BPM */}
                    <div className="feedFiltrosSelects">
                        {CATEGORIAS_SELECT.map((cat) => {
                            const opciones = tagsAgrupados[cat] ?? [];
                            if (opciones.length === 0) return null;
                            return (
                                <SelectFiltro
                                    key={cat}
                                    etiqueta={ETIQUETAS_CATEGORIA[cat]}
                                    opciones={opciones}
                                    tagsIncluidos={tagsIncluidos}
                                    tagsExcluidos={tagsExcluidos}
                                    onIncluir={incluirTag}
                                    onExcluir={excluirTag}
                                    onQuitar={quitarTag}
                                />
                            );
                        })}
                        <SelectorBPM
                            bpmMin={bpmMin}
                            bpmMax={bpmMax}
                            onCambiar={setBpmRango}
                        />
                    </div>

                    {/* Fila 2: Tags sueltos ("otro") — draggable horizontal, sin compresión */}
                    {tagsSueltos.length > 0 && (
                        <div
                            ref={listaTagsRef}
                            className={`feedTagsLista ${arrastrandoTags ? 'feedTagsListaArrastrando' : ''}`}
                            onMouseDown={(e) => iniciarArrastre(e.clientX)}
                            onMouseMove={(e) => moverArrastre(e.clientX)}
                            onMouseUp={finalizarArrastre}
                            onMouseLeave={finalizarArrastre}
                            onTouchStart={(e) => iniciarArrastre(e.touches[0].clientX)}
                            onTouchMove={(e) => moverArrastre(e.touches[0].clientX)}
                            onTouchEnd={finalizarArrastre}
                        >
                            {tagsSueltos.map(renderizarTag)}
                        </div>
                    )}
                </div>
            )}

            {/* Lista de samples con virtualización */}
            {samplesFiltrados.length === 0 ? (
                <div className="feedSamplesVacio">
                    <Music size={48} className="feedSamplesVacioIcono" />
                    <p>{mensajeVacio}</p>
                    {accionVacia}
                </div>
            ) : (
                <div className="listaDeSamples">
                    {/* Espaciador superior para virtualización */}
                    {virtualizar && indiceInicio > 0 && (
                        <div style={{ height: indiceInicio * alturaTarjeta }} aria-hidden="true" />
                    )}

                    {(virtualizar
                        ? samplesFiltrados.slice(indiceInicio, indiceInicio + maxRenderizados)
                        : samplesFiltrados
                    ).map((s) => (
                        <TarjetaSample
                            key={s.id}
                            sample={s}
                            onLike={manejarLike}
                            onMenu={menu.abrirMenu}
                            onClickCreador={(u) => navegar(`/perfil/${u}`)}
                            onClickTitulo={panelHabilitado ? manejarClickTitulo : undefined}
                            onComentar={panelHabilitado ? manejarComentar : undefined}
                        />
                    ))}

                    {/* Espaciador inferior para virtualización */}
                    {virtualizar && indiceInicio + maxRenderizados < samplesFiltrados.length && (
                        <div
                            style={{ height: (samplesFiltrados.length - indiceInicio - maxRenderizados) * alturaTarjeta }}
                            aria-hidden="true"
                        />
                    )}
                </div>
            )}

            {/* Centinela de infinite scroll */}
            {infiniteScroll && (
                <div ref={sentinelaRef} className="feedSamplesSentinela" aria-hidden="true">
                    {cargandoMas && <p className="feedSamplesCargandoMas">Cargando más samples…</p>}
                </div>
            )}

            <MenuContextual
                abierto={menu.estado.abierto}
                onCerrar={menu.cerrarMenu}
                items={menu.items}
                x={menu.estado.x}
                y={menu.estado.y}
            />

            <ModalInspectorSample
                abierto={!!menu.sampleInspeccion}
                onCerrar={menu.cerrarInspeccion}
                sample={menu.sampleInspeccion}
            />

            {/* C135: Sugerencias ahora se muestran en PanelLateral (modo 'sugerencias') */}
        </div>
    );
};

export default FeedSamples;
