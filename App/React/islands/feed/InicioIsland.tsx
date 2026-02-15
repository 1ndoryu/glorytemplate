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
    const [tagsIncluidos, setTagsIncluidos] = useState<string[]>([]);
    const [tagsExcluidos, setTagsExcluidos] = useState<string[]>([]);
    const [filtrosAbierto, setFiltrosAbierto] = useState(false);
    const [menuDestacados, setMenuDestacados] = useState(false);
    const [menuOrdenamiento, setMenuOrdenamiento] = useState(false);
    const [arrastrandoTags, setArrastrandoTags] = useState(false);
    const [tagsExpandidos, setTagsExpandidos] = useState(false);
    const inicioXArrastreRef = useRef(0);
    const scrollInicialRef = useRef(0);
    const listaTagsRef = useRef<HTMLDivElement | null>(null);

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

    /* Cargar samples según el ordenamiento activo — con cache por tipo */
    useEffect(() => {
        const claveCache = `${ordenamiento}_${busqueda || ''}_${periodoDestacados}`;

        /* Si ya tenemos datos en cache para esta combinación, usarlos instantáneo */
        if (cacheFeedRef.current[claveCache]) {
            setSamples(cacheFeedRef.current[claveCache]);
            setCargando(false);
            return;
        }

        const cargar = async () => {
            setCargando(true);

            let resultado: SampleResumen[] = [];

            if (ordenamiento === 'recientes') {
                const resp = await obtenerFeed('recientes');
                if (resp.ok && resp.data) resultado = resp.data;
            } else if (ordenamiento === 'destacados') {
                const resp = await obtenerFeed('trending');
                if (resp.ok && resp.data) resultado = resp.data;
            } else {
                /* Inteligente: usa listarSamples con búsqueda */
                const resp = await listarSamples({
                    page: 1,
                    perPage: 30,
                    busqueda: busqueda || undefined,
                });
                if (resp.ok && resp.data) resultado = resp.data.data ?? [];
            }

            /* Guardar en cache y actualizar estado */
            cacheFeedRef.current[claveCache] = resultado;
            setSamples(resultado);
            setCargando(false);
        };
        cargar();
    }, [ordenamiento, busqueda, periodoDestacados]);

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

    /* Manejar selección de periodo en submenu Destacados */
    const manejarPeriodo = useCallback((periodo: PeriodoDestacados) => {
        setPeriodoDestacados(periodo);
        setMenuDestacados(false);
    }, [setPeriodoDestacados]);

    const etiquetasOrden: Record<TipoOrdenamiento, string> = {
        inteligente: 'Inteligente',
        recientes: 'Recientes',
        destacados: 'Destacados',
    };

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
                            {etiquetasOrden[ordenamiento]}
                            <ChevronDown size={12} />
                        </button>

                        {menuOrdenamiento && (
                            <div className="inicioOrdenamientoMenu">
                                {(['inteligente', 'recientes', 'destacados'] as TipoOrdenamiento[]).map((tipo) => (
                                    <button
                                        key={tipo}
                                        className={`${ordenamiento === tipo ? 'inicioOrdenamientoActivo' : ''}`}
                                        onClick={() => {
                                            setOrdenamiento(tipo);
                                            setMenuOrdenamiento(false);
                                            /* Si es destacados, abrir submenú de periodo */
                                            if (tipo === 'destacados') {
                                                setMenuDestacados(true);
                                            } else {
                                                setMenuDestacados(false);
                                            }
                                        }}
                                        type="button"
                                    >
                                        {etiquetasOrden[tipo]}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Submenu de periodos para Destacados */}
                        {ordenamiento === 'destacados' && menuDestacados && (
                            <div className="inicioDestacadosMenu">
                                <button onClick={() => manejarPeriodo('semana')} type="button"
                                    className={periodoDestacados === 'semana' ? 'inicioDestacadosActivo' : ''}>
                                    Esta semana
                                </button>
                                <button onClick={() => manejarPeriodo('mes')} type="button"
                                    className={periodoDestacados === 'mes' ? 'inicioDestacadosActivo' : ''}>
                                    Este mes
                                </button>
                                <button onClick={() => manejarPeriodo('anio')} type="button"
                                    className={periodoDestacados === 'anio' ? 'inicioDestacadosActivo' : ''}>
                                    Este año
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

            {/* Lista de samples */}
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
                    {samplesFiltrados.map((s) => (
                        <TarjetaSample
                            key={s.id}
                            sample={s}
                            onLike={manejarLike}
                            onMenu={menu.abrirMenu}
                            onClickCreador={(u) => navegar(`/perfil/${u}`)}
                        />
                    ))}
                </div>
            )}

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
