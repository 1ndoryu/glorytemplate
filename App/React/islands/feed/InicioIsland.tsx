/*
 * InicioIsland — Kamples
 * Feed principal con ordenamientos (Inteligente/Recientes/Destacados).
 * Sin tabs: los ordenamientos están al lado del botón de filtros.
 * La búsqueda se conecta al filtrosStore (escrita desde TopBar).
 * Los tags dinámicos permiten filtrar por inclusión/exclusión.
 * Si el usuario no está autenticado, muestra LandingPublica.
 */

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { Music, SlidersHorizontal, Plus, Minus, ChevronDown, ChevronRight, ArrowDownWideNarrow } from 'lucide-react';
import { BotonBase } from '@app/components/ui';
import { TarjetaSample } from '@app/components/ui/TarjetaSample';
import { MenuContextual } from '@app/components/ui/MenuContextual';
import { LandingPublica } from '@app/components/social/LandingPublica';
import { obtenerFeed, listarSamples } from '@app/services/apiSamples';
import { darLike, quitarLike } from '@app/services/apiSocial';
import { useCrearModalStore } from '@app/stores/crearModalStore';
import { useAuthStore } from '@app/stores/authStore';
import { useFiltrosStore } from '@app/stores/filtrosStore';
import { useTabsTopBarStore } from '@app/stores/tabsTopBarStore';
import { useNavigationStore } from '@/core/router';
import { useMenuContextualSample } from '@app/hooks/useMenuContextualSample';
import { agruparTagsPorCategoria, type CategoriaTag } from '@app/services/tagUtils';
import { ModalFiltros } from '@app/components/ui/ModalFiltros';
import type { SampleResumen } from '@app/types';
import type { TipoOrdenamiento, PeriodoDestacados } from '@app/stores/filtrosStore';
import '../../styles/componentes/inicio.css';

export const InicioIsland = (): JSX.Element => {
    const { autenticado, cargando } = useAuthStore();

    if (cargando) {
        return (
            <div className="inicioContenedor" id="seccionInicio">
                <div className="inicioVacio">
                    <Music size={40} className="inicioVacioIcono" />
                    <p>Cargando…</p>
                </div>
            </div>
        );
    }

    if (!autenticado) {
        return <LandingPublica />;
    }

    return <FeedUnificado />;
};

/* Feed unificado controlado por ordenamiento y filtros toggle */
const FeedUnificado = (): JSX.Element => {
    const [samples, setSamples] = useState<SampleResumen[]>([]);
    const [cargando, setCargando] = useState(true);
    const [cargandoMas, setCargandoMas] = useState(false);
    const [paginaActual, setPaginaActual] = useState(1);
    const [hayMasPaginas, setHayMasPaginas] = useState(true);
    const [tagsIncluidos, setTagsIncluidos] = useState<string[]>([]);
    const [tagsExcluidos, setTagsExcluidos] = useState<string[]>([]);
    const [filtrosAbierto, setFiltrosAbierto] = useState(false);
    const [menuOrdenamiento, setMenuOrdenamiento] = useState(false);
    const [arrastrandoTags, setArrastrandoTags] = useState(false);
    const [tagsExpandidos, setTagsExpandidos] = useState(false);
    const inicioXArrastreRef = useRef(0);
    const scrollInicialRef = useRef(0);
    const listaTagsRef = useRef<HTMLDivElement | null>(null);
    const sentinelaRef = useRef<HTMLDivElement | null>(null);

    /* Virtualización: rango visible de samples para optimizar DOM */
    const [indiceInicio, setIndiceInicio] = useState(0);
    const MAX_RENDERIZADOS = 50;
    const ALTURA_TARJETA = 72;

    /* Cache por tipo de ordenamiento para evitar re-fetch innecesarios */
    const cacheFeedRef = useRef<Record<string, SampleResumen[]>>({});

    const { navegar } = useNavigationStore();
    const { abrir: abrirCrear } = useCrearModalStore();
    const { busqueda, ordenamiento, periodoDestacados, setOrdenamiento, setPeriodoDestacados } = useFiltrosStore();
    const { setTabs } = useTabsTopBarStore();
    const menu = useMenuContextualSample();

    /* Registrar tab "Inicio" en TopBar */
    useEffect(() => {
        setTabs([{ id: 'inicio', etiqueta: 'Inicio' }], 'inicio');
        return () => { setTabs([]); };
    }, [setTabs]);

    /* Cargar samples según el ordenamiento activo — con cache y paginación */
    const cargarSamples = useCallback(async (pagina: number, esNuevo: boolean) => {
        const claveCache = `${ordenamiento}_${busqueda || ''}_${periodoDestacados}_p${pagina}`;

        if (esNuevo) {
            setCargando(true);
            setIndiceInicio(0);
        } else {
            setCargandoMas(true);
        }

        let resultado: SampleResumen[] = [];

        /* Si hay cache para esta página, usarla */
        if (cacheFeedRef.current[claveCache]) {
            resultado = cacheFeedRef.current[claveCache];
        } else {
            if (ordenamiento === 'recientes') {
                const resp = await obtenerFeed('recientes', pagina);
                if (resp.ok && resp.data) resultado = resp.data;
            } else if (ordenamiento === 'destacados') {
                const resp = await obtenerFeed('trending', pagina);
                if (resp.ok && resp.data) resultado = resp.data;
            } else {
                const resp = await listarSamples({
                    page: pagina,
                    perPage: 30,
                    busqueda: busqueda || undefined,
                });
                if (resp.ok && resp.data) resultado = resp.data.data ?? [];
            }
            cacheFeedRef.current[claveCache] = resultado;
        }

        /* Si devolvió 0 resultados, no hay más páginas */
        if (resultado.length === 0) {
            setHayMasPaginas(false);
        }

        if (esNuevo) {
            setSamples(resultado);
            setCargando(false);
        } else {
            /* Deduplicar por id para evitar repetidos en el feed */
            setSamples((prev) => {
                const idsExistentes = new Set(prev.map((s) => s.id));
                const nuevos = resultado.filter((s) => !idsExistentes.has(s.id));
                return [...prev, ...nuevos];
            });
            setCargandoMas(false);
        }
    }, [ordenamiento, busqueda, periodoDestacados]);

    /* Carga inicial y al cambiar filtros */
    useEffect(() => {
        setPaginaActual(1);
        setHayMasPaginas(true);
        cargarSamples(1, true);
    }, [cargarSamples]);

    /* Infinite scroll: IntersectionObserver en el centinela al final de la lista */
    useEffect(() => {
        const sentinela = sentinelaRef.current;
        if (!sentinela) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && !cargandoMas && hayMasPaginas && !cargando) {
                    const nuevaPagina = paginaActual + 1;
                    setPaginaActual(nuevaPagina);
                    cargarSamples(nuevaPagina, false);
                }
            },
            { rootMargin: '200px' }
        );

        observer.observe(sentinela);
        return () => observer.disconnect();
    }, [cargandoMas, hayMasPaginas, cargando, paginaActual, cargarSamples]);

    /* Virtualización: al hacer scroll, ajustar el rango visible de samples */
    useEffect(() => {
        const contenedor = document.getElementById('seccionInicio');
        if (!contenedor) return;

        const manejarScroll = () => {
            const scrollTop = contenedor.scrollTop || window.scrollY;
            const nuevoInicio = Math.max(0, Math.floor(scrollTop / ALTURA_TARJETA) - 10);
            setIndiceInicio(nuevoInicio);
        };

        window.addEventListener('scroll', manejarScroll, { passive: true });
        return () => window.removeEventListener('scroll', manejarScroll);
    }, []);

    /* Tags dinámicos ordenados por frecuencia de aparición */
    const todosLosTags = useMemo(() => {
        const conteoTags = new Map<string, number>();
        samples.forEach((s) => s.tags?.forEach((t) => {
            conteoTags.set(t, (conteoTags.get(t) ?? 0) + 1);
        }));
        /* Ordenar por frecuencia descendente */
        return Array.from(conteoTags.entries())
            .sort((a, b) => b[1] - a[1])
            .map(([tag]) => tag);
    }, [samples]);

    /* Cantidad visible dinámica según ancho de pantalla */
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

    /* Tags agrupados por categoría para la vista expandida */
    const tagsAgrupados = useMemo(() => {
        if (!tagsExpandidos) return null;
        return agruparTagsPorCategoria(todosLosTags);
    }, [tagsExpandidos, todosLosTags]);

    const ETIQUETAS_CATEGORIA: Record<CategoriaTag, string> = {
        tipo: 'Tipo',
        genero: 'Género',
        instrumento: 'Instrumento',
        sentimiento: 'Sentimiento',
        otro: 'Tags',
    };

    /* Orden de categorías para la vista expandida */
    const ORDEN_CATEGORIAS: CategoriaTag[] = ['tipo', 'genero', 'instrumento', 'sentimiento', 'otro'];

    /* Filtrar por tags incluidos/excluidos */
    const samplesFiltrados = useMemo(() => {
        if (tagsIncluidos.length === 0 && tagsExcluidos.length === 0) return samples;
        return samples.filter((sample) => {
            const tagsSample = sample.tags ?? [];
            const cumpleIncluidos = tagsIncluidos.every((tag) => tagsSample.includes(tag));
            const cumpleExcluidos = tagsExcluidos.every((tag) => !tagsSample.includes(tag));
            return cumpleIncluidos && cumpleExcluidos;
        });
    }, [samples, tagsIncluidos, tagsExcluidos]);

    const manejarIncluirTag = useCallback((tag: string) => {
        setTagsExcluidos((prev) => prev.filter((item) => item !== tag));
        setTagsIncluidos((prev) =>
            prev.includes(tag) ? prev.filter((item) => item !== tag) : [...prev, tag]
        );
    }, []);

    const manejarExcluirTag = useCallback((tag: string) => {
        setTagsIncluidos((prev) => prev.filter((item) => item !== tag));
        setTagsExcluidos((prev) =>
            prev.includes(tag) ? prev.filter((item) => item !== tag) : [...prev, tag]
        );
    }, []);

    const iniciarArrastreTags = useCallback((clientX: number) => {
        if (!listaTagsRef.current) return;
        setArrastrandoTags(true);
        inicioXArrastreRef.current = clientX;
        scrollInicialRef.current = listaTagsRef.current.scrollLeft;
    }, []);

    const moverArrastreTags = useCallback((clientX: number) => {
        if (!arrastrandoTags || !listaTagsRef.current) return;
        const delta = clientX - inicioXArrastreRef.current;
        listaTagsRef.current.scrollLeft = scrollInicialRef.current - delta;
    }, [arrastrandoTags]);

    const finalizarArrastreTags = useCallback(() => {
        setArrastrandoTags(false);
    }, []);

    /* Like con optimistic UI — usa callback de setState para evitar stale closure */
    const manejarLike = useCallback(async (sampleId: number) => {
        let estabaLiked = false;
        setSamples((prev) =>
            prev.map((s) => {
                if (s.id === sampleId) {
                    estabaLiked = s.liked ?? false;
                    return { ...s, liked: !s.liked, totalLikes: s.totalLikes + (s.liked ? -1 : 1) };
                }
                return s;
            })
        );
        /* Invalidar cache para que re-fetch futuro refleje el cambio */
        cacheFeedRef.current = {};
        if (estabaLiked) {
            await quitarLike('sample', sampleId);
        } else {
            await darLike('sample', sampleId);
        }
    }, []);

    /* Obtener la etiqueta del ordenamiento actual (incluyendo periodo para destacados) */
    const obtenerEtiquetaOrden = useCallback((): string => {
        if (ordenamiento === 'destacados') {
            return periodoDestacados === 'mes' ? 'Top Mensual' : 'Top Semanal';
        }
        return ordenamiento === 'recientes' ? 'Recientes' : 'Inteligente';
    }, [ordenamiento, periodoDestacados]);

    if (cargando) {
        return (
            <div className="inicioContenedor" id="seccionInicio">
                <div className="inicioVacio">
                    <Music size={40} className="inicioVacioIcono" />
                    <p>Cargando samples…</p>
                </div>
            </div>
        );
    }

    return (
        <div className="inicioContenedor" id="seccionInicio">
            {/* Barra de ordenamientos + filtros */}
            <div className="inicioBarraControl">
                <div className="inicioControlesIzquierda">
                    <span className="inicioTagsContador">{samplesFiltrados.length} samples</span>
                </div>

                <div className="inicioControlesDerecha">
                    {/* Dropdown de ordenamiento unificado */}
                    <div className="inicioOrdenWrapper">
                        <button
                            className="inicioOrdenBtn inicioOrdenBtnActivo"
                            onClick={() => setMenuOrdenamiento((prev) => !prev)}
                            type="button"
                        >
                            <ArrowDownWideNarrow size={14} />
                            {obtenerEtiquetaOrden()}
                            <ChevronDown size={12} />
                        </button>

                        {menuOrdenamiento && (
                            <div className="inicioOrdenamientoMenu">
                                <button
                                    className={ordenamiento === 'inteligente' ? 'inicioOrdenamientoActivo' : ''}
                                    onClick={() => { setOrdenamiento('inteligente'); setMenuOrdenamiento(false); }}
                                    type="button"
                                >
                                    Inteligente
                                </button>
                                <button
                                    className={ordenamiento === 'recientes' ? 'inicioOrdenamientoActivo' : ''}
                                    onClick={() => { setOrdenamiento('recientes'); setMenuOrdenamiento(false); }}
                                    type="button"
                                >
                                    Recientes
                                </button>
                                <button
                                    className={ordenamiento === 'destacados' && periodoDestacados === 'semana' ? 'inicioOrdenamientoActivo' : ''}
                                    onClick={() => { setOrdenamiento('destacados'); setPeriodoDestacados('semana'); setMenuOrdenamiento(false); }}
                                    type="button"
                                >
                                    Top Semanal
                                </button>
                                <button
                                    className={ordenamiento === 'destacados' && periodoDestacados === 'mes' ? 'inicioOrdenamientoActivo' : ''}
                                    onClick={() => { setOrdenamiento('destacados'); setPeriodoDestacados('mes'); setMenuOrdenamiento(false); }}
                                    type="button"
                                >
                                    Top Mensual
                                </button>
                            </div>
                        )}
                    </div>

                    <button
                        className="inicioFiltrosBtn"
                        onClick={() => setFiltrosAbierto(true)}
                        type="button"
                        aria-label="Filtros"
                    >
                        <SlidersHorizontal size={16} />
                    </button>
                </div>
            </div>

            {/* Tags dinámicos con expansión */}
            <div className="inicioTags">
                {tagsExpandidos && tagsAgrupados ? (
                    /* Vista expandida: tags agrupados por categoría */
                    <div className="inicioTagsAgrupados">
                        {ORDEN_CATEGORIAS.map((categoria) => {
                            const tagsCategoria = tagsAgrupados[categoria];
                            if (tagsCategoria.length === 0) return null;
                            return (
                                <div key={categoria} className="inicioTagGrupo">
                                    <span className="inicioTagGrupoTitulo">{ETIQUETAS_CATEGORIA[categoria]}</span>
                                    <div className="inicioTagGrupoLista">
                                        {tagsCategoria.map((tag) => (
                                            <div
                                                key={tag}
                                                className={`inicioTagItem ${tagsIncluidos.includes(tag) ? 'inicioTagItemIncluido' : ''} ${tagsExcluidos.includes(tag) ? 'inicioTagItemExcluido' : ''}`}
                                            >
                                                <button type="button" className="inicioTagBoton inicioTagBotonRestar"
                                                    aria-label={`Excluir tag ${tag}`}
                                                    onClick={(e) => { e.stopPropagation(); manejarExcluirTag(tag); }}
                                                >
                                                    <Minus size={10} />
                                                </button>
                                                <button type="button" className="inicioTagTexto"
                                                    aria-label={`Incluir tag ${tag}`}
                                                    onClick={(e) => { e.stopPropagation(); manejarIncluirTag(tag); }}
                                                >
                                                    {tag}
                                                </button>
                                                <button type="button" className="inicioTagBoton inicioTagBotonSumar"
                                                    aria-label={`Incluir tag ${tag}`}
                                                    onClick={(e) => { e.stopPropagation(); manejarIncluirTag(tag); }}
                                                >
                                                    <Plus size={10} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                        <button
                            type="button"
                            className="inicioTagExpandirBtn"
                            onClick={() => setTagsExpandidos(false)}
                            aria-label="Ver menos tags"
                        >
                            <ChevronRight size={12} className="inicioTagExpandirIconoRotado" />
                            Menos
                        </button>
                    </div>
                ) : (
                    /* Vista colapsada: fila horizontal con scroll */
                    <div
                        ref={listaTagsRef}
                        className={`inicioTagsLista ${arrastrandoTags ? 'inicioTagsListaArrastrando' : ''}`}
                        onMouseDown={(e) => iniciarArrastreTags(e.clientX)}
                        onMouseMove={(e) => moverArrastreTags(e.clientX)}
                        onMouseUp={finalizarArrastreTags}
                        onMouseLeave={finalizarArrastreTags}
                        onTouchStart={(e) => iniciarArrastreTags(e.touches[0].clientX)}
                        onTouchMove={(e) => moverArrastreTags(e.touches[0].clientX)}
                        onTouchEnd={finalizarArrastreTags}
                    >
                        {tagsVisibles.map((tag) => (
                            <div
                                key={tag}
                                className={`inicioTagItem ${tagsIncluidos.includes(tag) ? 'inicioTagItemIncluido' : ''} ${tagsExcluidos.includes(tag) ? 'inicioTagItemExcluido' : ''}`}
                            >
                                <button type="button" className="inicioTagBoton inicioTagBotonRestar"
                                    aria-label={`Excluir tag ${tag}`}
                                    onMouseDown={(e) => e.stopPropagation()}
                                    onClick={(e) => { e.stopPropagation(); manejarExcluirTag(tag); }}
                                >
                                    <Minus size={10} />
                                </button>
                                <button type="button" className="inicioTagTexto"
                                    aria-label={`Incluir tag ${tag}`}
                                    onMouseDown={(e) => e.stopPropagation()}
                                    onClick={(e) => { e.stopPropagation(); manejarIncluirTag(tag); }}
                                >
                                    {tag}
                                </button>
                                <button type="button" className="inicioTagBoton inicioTagBotonSumar"
                                    aria-label={`Incluir tag ${tag}`}
                                    onMouseDown={(e) => e.stopPropagation()}
                                    onClick={(e) => { e.stopPropagation(); manejarIncluirTag(tag); }}
                                >
                                    <Plus size={10} />
                                </button>
                            </div>
                        ))}

                        {/* Botón expandir tags */}
                        {hayMasTags && (
                            <button
                                type="button"
                                className="inicioTagExpandirBtn"
                                onClick={() => setTagsExpandidos(true)}
                                aria-label="Ver más tags"
                            >
                                <ChevronRight size={12} />
                                +{todosLosTags.length - TAGS_COLAPSADOS}
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Lista de samples con virtualización */}
            {samplesFiltrados.length === 0 ? (
                <div className="inicioVacio">
                    <Music size={48} className="inicioVacioIcono" />
                    <p>No se encontraron samples.</p>
                    <BotonBase variante="primario" onClick={abrirCrear}>
                        Sube el primero
                    </BotonBase>
                </div>
            ) : (
                <div className="inicioLista">
                    {/* Espaciador superior: compensa las tarjetas removidas del DOM */}
                    {indiceInicio > 0 && (
                        <div style={{ height: indiceInicio * ALTURA_TARJETA }} aria-hidden="true" />
                    )}

                    {samplesFiltrados
                        .slice(indiceInicio, indiceInicio + MAX_RENDERIZADOS)
                        .map((s) => (
                            <TarjetaSample
                                key={s.id}
                                sample={s}
                                onLike={manejarLike}
                                onMenu={menu.abrirMenu}
                                onClickCreador={(u) => navegar(`/perfil/${u}`)}
                            />
                        ))}

                    {/* Espaciador inferior: compensa las tarjetas no renderizadas abajo */}
                    {indiceInicio + MAX_RENDERIZADOS < samplesFiltrados.length && (
                        <div
                            style={{ height: (samplesFiltrados.length - indiceInicio - MAX_RENDERIZADOS) * ALTURA_TARJETA }}
                            aria-hidden="true"
                        />
                    )}
                </div>
            )}

            {/* Centinela de scroll infinito: carga más samples al llegar al final */}
            <div ref={sentinelaRef} className="inicioSentinela" aria-hidden="true">
                {cargandoMas && <p className="inicioCargandoMas">Cargando más samples…</p>}
            </div>

            <MenuContextual
                abierto={menu.estado.abierto}
                onCerrar={menu.cerrarMenu}
                items={menu.items}
                x={menu.estado.x}
                y={menu.estado.y}
            />

            <ModalFiltros
                abierto={filtrosAbierto}
                onCerrar={() => setFiltrosAbierto(false)}
            />
        </div>
    );
};

export default InicioIsland;
