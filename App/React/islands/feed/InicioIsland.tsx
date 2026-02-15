/*
 * InicioIsland — Kamples
 * Feed principal con ordenamientos (Inteligente/Recientes/Destacados).
 * Sin tabs: los ordenamientos están al lado del botón de filtros.
 * La búsqueda se conecta al filtrosStore (escrita desde TopBar).
 * Los tags dinámicos permiten filtrar por inclusión/exclusión.
 * Si el usuario no está autenticado, muestra LandingPublica.
 */

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { Music, SlidersHorizontal, Plus, Minus, ChevronDown } from 'lucide-react';
import { BotonBase } from '@app/components/ui';
import { TarjetaSample } from '@app/components/ui/TarjetaSample';
import { MenuContextual } from '@app/components/ui/MenuContextual';
import { LandingPublica } from '@app/components/social/LandingPublica';
import { obtenerFeed, listarSamples } from '@app/services/apiSamples';
import { darLike, quitarLike } from '@app/services/apiSocial';
import { useCrearModalStore } from '@app/stores/crearModalStore';
import { useAuthStore } from '@app/stores/authStore';
import { useFiltrosStore } from '@app/stores/filtrosStore';
import { useNavigationStore } from '@/core/router';
import { useMenuContextualSample } from '@app/hooks/useMenuContextualSample';
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
    const [arrastrandoTags, setArrastrandoTags] = useState(false);
    const inicioXArrastreRef = useRef(0);
    const scrollInicialRef = useRef(0);
    const listaTagsRef = useRef<HTMLDivElement | null>(null);

    const { navegar } = useNavigationStore();
    const { abrir: abrirCrear } = useCrearModalStore();
    const { busqueda, ordenamiento, periodoDestacados, setOrdenamiento, setPeriodoDestacados } = useFiltrosStore();
    const menu = useMenuContextualSample();

    /* Cargar samples según el ordenamiento activo */
    useEffect(() => {
        const cargar = async () => {
            setCargando(true);

            if (ordenamiento === 'recientes') {
                const resp = await obtenerFeed('recientes');
                if (resp.ok && resp.data) setSamples(resp.data);
            } else if (ordenamiento === 'destacados') {
                const resp = await obtenerFeed('trending');
                if (resp.ok && resp.data) setSamples(resp.data);
            } else {
                /* Inteligente: usa listarSamples con búsqueda */
                const resp = await listarSamples({
                    page: 1,
                    perPage: 30,
                    busqueda: busqueda || undefined,
                });
                if (resp.ok && resp.data) setSamples(resp.data.data ?? []);
            }

            setCargando(false);
        };
        cargar();
    }, [ordenamiento, busqueda, periodoDestacados]);

    /* Tags dinámicos extraídos de todos los samples cargados */
    const todosLosTags = useMemo(() => {
        const tagSet = new Set<string>();
        samples.forEach((s) => s.tags?.forEach((t) => tagSet.add(t)));
        return Array.from(tagSet).slice(0, 28);
    }, [samples]);

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
                <div className="inicioOrdenamientos">
                    {(['inteligente', 'recientes', 'destacados'] as TipoOrdenamiento[]).map((tipo) => (
                        <div key={tipo} className="inicioOrdenWrapper">
                            <button
                                className={`inicioOrdenBtn ${ordenamiento === tipo ? 'inicioOrdenBtnActivo' : ''}`}
                                onClick={() => {
                                    if (tipo === 'destacados' && ordenamiento === 'destacados') {
                                        setMenuDestacados((prev) => !prev);
                                    } else {
                                        setOrdenamiento(tipo);
                                        setMenuDestacados(false);
                                    }
                                }}
                                type="button"
                            >
                                {etiquetasOrden[tipo]}
                                {tipo === 'destacados' && <ChevronDown size={12} />}
                            </button>

                            {/* Submenu de periodos para Destacados */}
                            {tipo === 'destacados' && menuDestacados && (
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
                    ))}
                </div>

                <div className="inicioControlesDerecha">
                    <span className="inicioTagsContador">{samplesFiltrados.length} samples</span>
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

            {/* Tags dinámicos */}
            <div className="inicioTags">
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
                    {todosLosTags.map((tag) => (
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
                </div>
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
