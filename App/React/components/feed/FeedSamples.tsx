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
import { Music, Plus, Minus, ChevronRight } from 'lucide-react';
import '../../styles/componentes/feedSamples.css';
import { TarjetaSample } from '@app/components/ui/TarjetaSample';
import { MenuContextual } from '@app/components/ui/MenuContextual';
import { ModalInspectorSample } from '@app/components/ui/ModalInspectorSample';
import { useNavigationStore } from '@/core/router';
import { useMenuContextualSample } from '@app/hooks/useMenuContextualSample';
import { darLike, quitarLike } from '@app/services/apiSocial';
import { agruparTagsPorCategoria, type CategoriaTag } from '@app/services/tagUtils';
import { useSugerenciasLikeStore } from '@app/stores/sugerenciasLikeStore';
import { ModalSugerenciasLike } from '@app/components/feed/ModalSugerenciasLike';
import type { SampleResumen } from '@app/types';

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
}

const ETIQUETAS_CATEGORIA: Record<CategoriaTag, string> = {
    tipo: 'Tipo',
    genero: 'Género',
    instrumento: 'Instrumento',
    sentimiento: 'Sentimiento',
    otro: 'Tags',
};

const ORDEN_CATEGORIAS: CategoriaTag[] = ['tipo', 'genero', 'instrumento', 'sentimiento', 'otro'];

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
}: FeedSamplesProps): JSX.Element => {
    const [samples, setSamples] = useState<SampleResumen[]>(samplesIniciales ?? []);
    const [cargando, setCargando] = useState(!samplesIniciales);
    const [cargandoMas, setCargandoMas] = useState(false);
    const [paginaActual, setPaginaActual] = useState(1);
    const [hayMasPaginas, setHayMasPaginas] = useState(true);

    /* Tags inclusión/exclusión */
    const [tagsIncluidos, setTagsIncluidos] = useState<string[]>([]);
    const [tagsExcluidos, setTagsExcluidos] = useState<string[]>([]);
    const [tagsExpandidos, setTagsExpandidos] = useState(false);

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

    /* Reset al cambiar claveCache (cambio de filtros/contexto) */
    useEffect(() => {
        if (claveCacheAnteriorRef.current !== claveCache) {
            claveCacheAnteriorRef.current = claveCache;
            cacheFeedRef.current = {};
            setPaginaActual(1);
            setHayMasPaginas(true);
            setIndiceInicio(0);
            setTagsIncluidos([]);
            setTagsExcluidos([]);
            setTagsExpandidos(false);
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

    /* Tags dinámicos ordenados por frecuencia */
    const todosLosTags = useMemo(() => {
        const conteo = new Map<string, number>();
        samples.forEach((s) => s.tags?.forEach((t) => {
            conteo.set(t, (conteo.get(t) ?? 0) + 1);
        }));
        return Array.from(conteo.entries())
            .sort((a, b) => b[1] - a[1])
            .map(([tag]) => tag);
    }, [samples]);

    const TAGS_COLAPSADOS = useMemo(() => {
        if (typeof window === 'undefined') return 12;
        const ancho = window.innerWidth;
        if (ancho > 1400) return 20;
        if (ancho > 1024) return 16;
        if (ancho > 768) return 12;
        return 8;
    }, []);

    const tagsVisibles = tagsExpandidos ? todosLosTags : todosLosTags.slice(0, TAGS_COLAPSADOS);
    const hayMasTags = todosLosTags.length > TAGS_COLAPSADOS;

    const tagsAgrupados = useMemo(() => {
        if (!tagsExpandidos) return null;
        return agruparTagsPorCategoria(todosLosTags);
    }, [tagsExpandidos, todosLosTags]);

    /* Filtrar por tags y por IDs excluidos */
    const samplesFiltrados = useMemo(() => {
        let resultado = samples;

        /* Exclusión por IDs (ej: "Ya reproducidos") */
        if (idsExcluidos && idsExcluidos.size > 0) {
            resultado = resultado.filter((s) => !idsExcluidos.has(s.id));
        }

        /* Inclusión/exclusión por tags */
        if (tagsIncluidos.length === 0 && tagsExcluidos.length === 0) return resultado;
        return resultado.filter((s) => {
            const tagsSample = s.tags ?? [];
            return tagsIncluidos.every((t) => tagsSample.includes(t))
                && tagsExcluidos.every((t) => !tagsSample.includes(t));
        });
    }, [samples, tagsIncluidos, tagsExcluidos, idsExcluidos]);

    /* Handlers de tags */
    const manejarIncluirTag = useCallback((tag: string) => {
        setTagsExcluidos((prev) => prev.filter((i) => i !== tag));
        setTagsIncluidos((prev) =>
            prev.includes(tag) ? prev.filter((i) => i !== tag) : [...prev, tag]
        );
    }, []);

    const manejarExcluirTag = useCallback((tag: string) => {
        setTagsIncluidos((prev) => prev.filter((i) => i !== tag));
        setTagsExcluidos((prev) =>
            prev.includes(tag) ? prev.filter((i) => i !== tag) : [...prev, tag]
        );
    }, []);

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

    const { mostrar: mostrarSugerencias } = useSugerenciasLikeStore();

    /* Like optimistic UI — si es nuevo like, muestra modal de sugerencias */
    const manejarLike = useCallback(async (sampleId: number) => {
        let estabaLiked = false;
        let sampleRef: SampleResumen | null = null;
        setSamples((prev) =>
            prev.map((s) => {
                if (s.id === sampleId) {
                    estabaLiked = s.liked ?? false;
                    sampleRef = s;
                    return { ...s, liked: !s.liked, totalLikes: s.totalLikes + (s.liked ? -1 : 1) };
                }
                return s;
            })
        );
        cacheFeedRef.current = {};

        const nuevoEstado = !estabaLiked;
        if (estabaLiked) {
            await quitarLike('sample', sampleId);
        } else {
            await darLike('sample', sampleId);
            /* Mostrar modal "También te podría gustar" al dar like */
            if (sampleRef) mostrarSugerencias(sampleRef);
        }

        onLike?.(sampleId, nuevoEstado);
    }, [onLike, mostrarSugerencias]);

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
            {/* Tags dinámicos con inclusión/exclusión */}
            {mostrarTags && todosLosTags.length > 0 && (
                <div className="feedTags">
                    {tagsExpandidos && tagsAgrupados ? (
                        <div className="feedTagsAgrupados">
                            {ORDEN_CATEGORIAS.map((cat) => {
                                const arr = tagsAgrupados[cat];
                                if (arr.length === 0) return null;
                                return (
                                    <div key={cat} className="feedTagGrupo">
                                        <span className="feedTagGrupoTitulo">{ETIQUETAS_CATEGORIA[cat]}</span>
                                        <div className="feedTagGrupoLista">
                                            {arr.map(renderizarTag)}
                                        </div>
                                    </div>
                                );
                            })}
                            <button type="button" className="feedTagExpandirBtn"
                                onClick={() => setTagsExpandidos(false)} aria-label="Ver menos tags"
                            >
                                <ChevronRight size={12} className="feedTagExpandirIconoRotado" />
                                Menos
                            </button>
                        </div>
                    ) : (
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
                            {tagsVisibles.map(renderizarTag)}
                            {hayMasTags && (
                                <button type="button" className="feedTagExpandirBtn"
                                    onClick={() => setTagsExpandidos(true)} aria-label="Ver más tags"
                                >
                                    <ChevronRight size={12} />
                                    +{todosLosTags.length - TAGS_COLAPSADOS}
                                </button>
                            )}
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
                <div className="feedSamplesLista">
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

            {/* Modal "También te podría gustar" — se abre tras dar like */}
            <ModalSugerenciasLike />
        </div>
    );
};

export default FeedSamples;
