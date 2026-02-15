/*
 * InicioIsland — Kamples
 * Feed principal unificado: Todos, Trending, Recientes, Para ti.
 * Las tabs se renderizan en el TopBar via tabsTopBarStore.
 * La búsqueda se conecta al filtrosStore (escrita desde TopBar).
 * Los tags dinámicos reemplazan la zona de filtros anterior.
 * Si el usuario no está autenticado, muestra LandingPublica.
 */

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { Music, SlidersHorizontal, Plus, Minus } from 'lucide-react';
import { BotonBase } from '@app/components/ui';
import { TarjetaSample } from '@app/components/ui/TarjetaSample';
import { MenuContextual } from '@app/components/ui/MenuContextual';
import { LandingPublica } from '@app/components/social/LandingPublica';
import { obtenerFeed, listarSamples } from '@app/services/apiSamples';
import { darLike, quitarLike } from '@app/services/apiSocial';
import { useCrearModalStore } from '@app/stores/crearModalStore';
import { useAuthStore } from '@app/stores/authStore';
import { useTabsTopBarStore } from '@app/stores/tabsTopBarStore';
import { useFiltrosStore } from '@app/stores/filtrosStore';
import { useNavigationStore } from '@/core/router';
import { useMenuContextualSample } from '@app/hooks/useMenuContextualSample';
import { ModalFiltros } from '@app/components/ui/ModalFiltros';
import type { SampleResumen } from '@app/types';
import '../../styles/componentes/inicio.css';

const TABS_INICIO = [
    { id: 'todos', etiqueta: 'Todos' },
    { id: 'trending', etiqueta: 'Trending' },
    { id: 'recientes', etiqueta: 'Recientes' },
    { id: 'parati', etiqueta: 'Para ti' },
];

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

/* Feed unificado: una sola lista controlada por la tab activa y la búsqueda */
const FeedUnificado = (): JSX.Element => {
    const [samples, setSamples] = useState<SampleResumen[]>([]);
    const [cargando, setCargando] = useState(true);
    const [tagsIncluidos, setTagsIncluidos] = useState<string[]>([]);
    const [tagsExcluidos, setTagsExcluidos] = useState<string[]>([]);
    const [filtrosAbierto, setFiltrosAbierto] = useState(false);
    const [arrastrandoTags, setArrastrandoTags] = useState(false);
    const inicioXArrastreRef = useRef(0);
    const scrollInicialRef = useRef(0);
    const listaTagsRef = useRef<HTMLDivElement | null>(null);

    const { navegar } = useNavigationStore();
    const { abrir: abrirCrear } = useCrearModalStore();
    const { activa: tabActiva, setTabs } = useTabsTopBarStore();
    const { busqueda } = useFiltrosStore();
    const menu = useMenuContextualSample();

    /* Registrar tabs en el TopBar al montar */
    useEffect(() => {
        setTabs(TABS_INICIO, 'todos');
        return () => { setTabs([]); };
    }, [setTabs]);

    /* Cargar samples según la tab activa */
    useEffect(() => {
        const cargar = async () => {
            setCargando(true);

            if (tabActiva === 'todos' || !tabActiva) {
                const resp = await listarSamples({
                    page: 1,
                    perPage: 30,
                    busqueda: busqueda || undefined,
                });
                if (resp.ok && resp.data) {
                    setSamples(resp.data.data ?? []);
                }
            } else {
                const tipo = tabActiva === 'parati' ? 'descubrir' : tabActiva as 'trending' | 'recientes';
                const resp = await obtenerFeed(tipo);
                if (resp.ok && resp.data) {
                    setSamples(resp.data);
                }
            }

            setCargando(false);
        };

        cargar();
    }, [tabActiva, busqueda]);

    /* Tags dinámicos extraídos de todos los samples cargados */
    const todosLosTags = useMemo(() => {
        const tagSet = new Set<string>();
        samples.forEach((s) => s.tags?.forEach((t) => tagSet.add(t)));
        return Array.from(tagSet).slice(0, 28);
    }, [samples]);

    /* Filtrar por lógica de suma/resta de tags:
     * - incluidos: el sample debe contener TODOS
     * - excluidos: el sample no debe contener NINGUNO
     */
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

    /* Like con optimistic UI */
    const manejarLike = useCallback(async (sampleId: number) => {
        setSamples((prev) =>
            prev.map((s) =>
                s.id === sampleId
                    ? { ...s, liked: !s.liked, totalLikes: s.totalLikes + (s.liked ? -1 : 1) }
                    : s
            )
        );
        const sample = samples.find((s) => s.id === sampleId);
        if (sample?.liked) {
            await quitarLike('sample', sampleId);
        } else {
            await darLike('sample', sampleId);
        }
    }, [samples]);

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
            {/* Tags dinámicos + botón filtros avanzados */}
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
                            <button
                                type="button"
                                className="inicioTagBoton inicioTagBotonRestar"
                                aria-label={`Excluir tag ${tag}`}
                                onMouseDown={(e) => e.stopPropagation()}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    manejarExcluirTag(tag);
                                }}
                            >
                                <Minus size={10} />
                            </button>

                            <button
                                type="button"
                                className="inicioTagTexto"
                                aria-label={`Incluir tag ${tag}`}
                                onMouseDown={(e) => e.stopPropagation()}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    manejarIncluirTag(tag);
                                }}
                            >
                                {tag}
                            </button>

                            <button
                                type="button"
                                className="inicioTagBoton inicioTagBotonSumar"
                                aria-label={`Incluir tag ${tag}`}
                                onMouseDown={(e) => e.stopPropagation()}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    manejarIncluirTag(tag);
                                }}
                            >
                                <Plus size={10} />
                            </button>
                        </div>
                    ))}
                </div>

                <div className="inicioTagsPie">
                    <span className="inicioTagsContador">{samplesFiltrados.length} samples</span>
                <button
                    className="inicioFiltrosBtn"
                    onClick={() => setFiltrosAbierto(true)}
                    type="button"
                    aria-label="Filtros avanzados"
                >
                    <SlidersHorizontal size={16} />
                </button>
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

            {/* Menú contextual de sample */}
            <MenuContextual
                abierto={menu.estado.abierto}
                onCerrar={menu.cerrarMenu}
                items={menu.items}
                x={menu.estado.x}
                y={menu.estado.y}
            />

            {/* Modal de filtros avanzados */}
            <ModalFiltros
                abierto={filtrosAbierto}
                onCerrar={() => setFiltrosAbierto(false)}
            />
        </div>
    );
};

export default InicioIsland;
