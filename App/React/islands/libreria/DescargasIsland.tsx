/*
 * DescargasIsland — Kamples (C140+C175+C281.2)
 * Página independiente /descargas ("Coleccionados") con diseño idéntico a ColeccionDetalleIsland.
 * Header con imagen + info + acciones. Tabs: "Mis Coleccionados" y "Más Ideas".
 */

import { useEffect, useCallback, useState, useMemo, useRef } from 'react';
import { ArrowLeft, ShoppingBag } from 'lucide-react';
import { FeedSamples } from '@app/components/feed/FeedSamples';
import { BarraControlFeed, OPCIONES_ORDEN_PERSONAL } from '@app/components/feed/BarraControlFeed';
import { TarjetaSample } from '@app/components/ui/TarjetaSample';
import { MenuContextual } from '@app/components/ui/MenuContextual';
import { useDescargasPagina } from '@app/hooks/useDescargasPagina';
import { useTabsTopBarStore } from '@app/stores/tabsTopBarStore';
import { useTabsIsla } from '@app/hooks/useTabsIsla';
import { usePanelLateralStore } from '@app/stores/panelLateralStore';
import { useNavigationStore } from '@/core/router';
import { useMenuContextualSample } from '@app/hooks/useMenuContextualSample';
import { useIslaActiva } from '@app/hooks/useIslaActiva';
import { useValorCongelado } from '@app/hooks/useValorCongelado';
import { conAutenticacion } from '@app/components/auth/ConAutenticacion';
import { obtenerImagenColor } from '@app/services/imagenesColor';
import { useFiltrosStore } from '@app/stores/filtrosStore';
import '../../styles/componentes/coleccionDetalle.css';
import { BotonBase } from '../../components/ui/BotonBase';
import { SkeletonColeccionDetalle } from '@app/components/skeletons';
import { ModalFiltros } from '@app/components/ui/ModalFiltros';
import { useFiltrosContenido } from '@app/hooks/useFiltrosContenido';
import { SlidersHorizontal, Heart } from 'lucide-react';
import { useT } from '@app/utils/i18n';

/* TO-DO: Extraer lógica de vista (infoHeader, totalHeader, tabs, panel lateral)
 * a un hook useDescargasIsland.ts para cumplir SRP estricto. Pre-existente. */
const TABS_DESCARGAS = [
    { id: 'descargas', etiqueta: 'descargas.tabs.misColeccionados' },
    { id: 'favoritos', etiqueta: 'descargas.tabs.meGustas' },
    { id: 'comprados', etiqueta: 'descargas.tabs.comprados' },
    { id: 'ideas', etiqueta: 'descargas.tabs.masIdeas' },
];

const DescargasBase = (): JSX.Element => {
    const { t } = useT();
    /* QL94: Busqueda global con debounce */
    const busqueda = useFiltrosStore(s => s.busqueda);
    const [busquedaDebounced, setBusquedaDebounced] = useState('');
    const timerBusquedaRef = useRef<ReturnType<typeof setTimeout>>();
    useEffect(() => {
        timerBusquedaRef.current = setTimeout(() => setBusquedaDebounced(busqueda), 350);
        return () => clearTimeout(timerBusquedaRef.current);
    }, [busqueda]);

    /* QL87: Filtros por tab (independientes) */
    const [filtrosAbierto, setFiltrosAbierto] = useState(false);
    const filtrosDescargas = useFiltrosContenido({ disponibles: ['soloWav', 'soloMeEncanta', 'ocultarColeccionados'] });
    const filtrosFavoritos = useFiltrosContenido({ disponibles: ['soloWav', 'soloMeEncanta', 'ocultarDescargados', 'ocultarColeccionados'] });

    const {
        comprados, cargando, cargandoComprados,
        proveedorColeccionados, proveedorFavoritos, proveedorSugerencias,
        ordenColeccionados, setOrdenColeccionados,
        ordenFavoritos, setOrdenFavoritos,
        manejarLike,
    } = useDescargasPagina(
        busquedaDebounced,
        filtrosDescargas.modoCorazon,
        filtrosFavoritos.modoCorazon
    );
    const navegar = useNavigationStore(s => s.navegar);
    const tabActivaGlobal = useTabsTopBarStore(s => s.activa);
    const habilitarPanel = usePanelLateralStore(s => s.habilitar);
    const deshabilitarPanel = usePanelLateralStore(s => s.deshabilitar);
    const abrirComentarios = usePanelLateralStore(s => s.abrirComentarios);
    const menu = useMenuContextualSample();

    /* QL15: Contador de coleccionados via FeedSamples */
    const [totalColeccionados, setTotalColeccionados] = useState(0);
    const [totalFavoritos, setTotalFavoritos] = useState(0);

    /* Keep-alive: congelar tabActiva cuando la isla está oculta */
    const activa = useIslaActiva('DescargasIsland');
    const tabActiva = useValorCongelado(tabActivaGlobal, !activa);

    const filtrosActivos = tabActiva === 'favoritos' ? filtrosFavoritos : filtrosDescargas;

    /* QL41: Header dinámico según tab activa */
    const infoHeader = useMemo(() => {
        const configs: Record<string, { titulo: string; imagenId: number }> = {
            descargas: { titulo: t('descargas.tabs.misColeccionados'), imagenId: 1001 },
            favoritos: { titulo: t('descargas.tabs.meGustas'), imagenId: 1002 },
            comprados: { titulo: t('descargas.tabs.comprados'), imagenId: 1003 },
            ideas: { titulo: t('descargas.tabs.masIdeas'), imagenId: 1004 },
        };
        return configs[tabActiva] ?? configs.descargas;
    }, [tabActiva, t]);

    const totalHeader = useMemo(() => {
        if (tabActiva === 'descargas') return totalColeccionados;
        if (tabActiva === 'favoritos') return totalFavoritos;
        if (tabActiva === 'comprados') return comprados.length;
        return 0;
    }, [tabActiva, totalColeccionados, totalFavoritos, comprados.length]);

    /* C174: Re-registrar tabs al volver a esta isla (keep-alive) */
    useTabsIsla('DescargasIsland', TABS_DESCARGAS, 'descargas');

    const islaActual = useNavigationStore(s => s.islaActual);
    useEffect(() => {
        if (islaActual === 'DescargasIsland') habilitarPanel();
    }, [islaActual, habilitarPanel]);
    useEffect(() => {
        return () => deshabilitarPanel();
    }, [deshabilitarPanel]);

    const manejarComentar = useCallback((sampleId: number) => {
        const sample = comprados.find((s) => s.id === sampleId);
        if (sample) abrirComentarios(sample);
    }, [comprados, abrirComentarios]);

    /* [193A-30] Búsqueda por tag en comprados */
    const manejarBuscarTag = useCallback((tag: string) => {
        useFiltrosStore.getState().setBusqueda(tag);
    }, []);

    if (cargando) {
        return (
            <div className="coleccionDetalle" id="seccionDescargas">
                <SkeletonColeccionDetalle cantidadSamples={4} />
            </div>
        );
    }

    return (
        <div className="coleccionDetalle" id="seccionDescargas">
            {/* Botón volver — misma clase que ColeccionDetalle */}
            <BotonBase variante="ghost" className="botonVolver" onClick={() => navegar('/libreria/')} type="button">
                <ArrowLeft size={18} />
                <span>{t('topbar.libreria')}</span>
            </BotonBase>

            {/* QL41: Header dinámico según tab activa */}
            <div className="coleccionHeader">
                <img
                    className="coleccionHeaderImg"
                    src={obtenerImagenColor(infoHeader.imagenId)}
                    alt={infoHeader.titulo}
                />
                <div className="coleccionHeaderInfo">
                    <h1 className="coleccionNombre">{infoHeader.titulo}</h1>
                    <div className="coleccionMeta">
                        <span className="coleccionStats">
                            {tabActiva === 'ideas'
                                ? t('feed.sugerenciasPersonalizadas')
                                : totalHeader > 0
                                    ? `${totalHeader} ${t(totalHeader === 1 ? 'feed.sample' : 'feed.samples')}`
                                    : t('common.cargando')
                            }
                        </span>
                    </div>
                </div>
            </div>

            {/* Contenido según tab activa — key distinta fuerza desmontaje (C46) */}
            {/* QL15: Coleccionados con scroll infinito via FeedSamples */}
            {tabActiva === 'descargas' && (
                <>
                    <BarraControlFeed
                        opciones={OPCIONES_ORDEN_PERSONAL}
                        ordenActual={ordenColeccionados}
                        onOrdenCambiar={setOrdenColeccionados}
                    >
                        {/* [223A-5] Ciclo corazón: off → like → encanta → off */}
                        <BotonBase
                            variante="ghost"
                            tamano="ninguno"
                            onClick={filtrosDescargas.ciclarCorazon}
                            type="button"
                            aria-label={t('feed.soloMeEncanta')}
                            className={filtrosDescargas.modoCorazon !== 'off' ? 'filtroEncantaActivo' : ''}
                        >
                            <Heart size={16} fill={filtrosDescargas.modoCorazon === 'encanta' ? 'currentColor' : 'none'} strokeWidth={filtrosDescargas.modoCorazon === 'like' ? 3 : 2} />
                        </BotonBase>
                        <BotonBase variante="ghost" tamano="ninguno" onClick={() => setFiltrosAbierto(true)} type="button" aria-label={t('feed.filtros')}>
                            <SlidersHorizontal size={16} />
                        </BotonBase>
                    </BarraControlFeed>
                    <FeedSamples
                        key={`descargas-coleccionados-${ordenColeccionados}-${busquedaDebounced}-${filtrosDescargas.modoCorazon}`}
                        proveedor={proveedorColeccionados}
                        claveCache={`coleccionados_${ordenColeccionados}_${busquedaDebounced}_${filtrosDescargas.modoCorazon}`}
                        mostrarTags
                        infiniteScroll
                        virtualizar={false}
                        mensajeVacio={t('descargas.mensajeVacio.coleccionados')}
                        onConteoChange={setTotalColeccionados}
                        filtroAdicional={filtrosDescargas.aplicar}
                    />
                </>
            )}

            {tabActiva === 'favoritos' && (
                <>
                    <BarraControlFeed
                        opciones={OPCIONES_ORDEN_PERSONAL}
                        ordenActual={ordenFavoritos}
                        onOrdenCambiar={setOrdenFavoritos}
                    >
                        {/* [223A-5] Ciclo corazón: off → like → encanta → off */}
                        <BotonBase
                            variante="ghost"
                            tamano="ninguno"
                            onClick={filtrosFavoritos.ciclarCorazon}
                            type="button"
                            aria-label={t('feed.soloMeEncanta')}
                            className={filtrosFavoritos.modoCorazon !== 'off' ? 'filtroEncantaActivo' : ''}
                        >
                            <Heart size={16} fill={filtrosFavoritos.modoCorazon === 'encanta' ? 'currentColor' : 'none'} strokeWidth={filtrosFavoritos.modoCorazon === 'like' ? 3 : 2} />
                        </BotonBase>
                        <BotonBase variante="ghost" tamano="ninguno" onClick={() => setFiltrosAbierto(true)} type="button" aria-label={t('feed.filtros')}>
                            <SlidersHorizontal size={16} />
                        </BotonBase>
                    </BarraControlFeed>
                    <FeedSamples
                        key={`descargas-favoritos-${ordenFavoritos}-${busquedaDebounced}-${filtrosFavoritos.modoCorazon}`}
                        proveedor={proveedorFavoritos}
                        claveCache={`favoritos_descargas_${ordenFavoritos}_${busquedaDebounced}_${filtrosFavoritos.modoCorazon}`}
                        mostrarTags
                        infiniteScroll
                        virtualizar={false}
                        mensajeVacio={t('descargas.mensajeVacio.favoritos')}
                        onConteoChange={setTotalFavoritos}
                        filtroAdicional={filtrosFavoritos.aplicar}
                    />
                </>
            )}

            {tabActiva === 'comprados' && (
                cargandoComprados ? (
                    <SkeletonColeccionDetalle cantidadSamples={3} />
                ) : comprados.length === 0 ? (
                    <div className="coleccionVacia" style={{ flexDirection: 'column', gap: 'var(--espacioMd)' }}>
                        <ShoppingBag size={32} />
                        <p>{t('descargas.mensajeVacio.comprados')}</p>
                    </div>
                ) : (
                    <div className="listaDeSamples">
                        {comprados.map((sample) => (
                            <TarjetaSample
                                key={sample.id}
                                sample={sample}
                                contexto={comprados}
                                onLike={manejarLike}
                                onMenu={menu.abrirMenu}
                                onClickCreador={(u) => navegar(`/perfil/${u}`)}
                                onComentar={manejarComentar}
                                onFiltrarMeta={manejarBuscarTag}
                            />
                        ))}
                    </div>
                )
            )}

            {tabActiva === 'ideas' && (
                <FeedSamples
                    key="descargas-ideas"
                    proveedor={proveedorSugerencias}
                    claveCache="sugerencias_descargas"
                    mostrarTags
                    infiniteScroll
                    virtualizar={false}
                    mensajeVacio={t('descargas.mensajeVacio.ideas')}
                />
            )}

            <ModalFiltros
                abierto={filtrosAbierto}
                onCerrar={() => setFiltrosAbierto(false)}
                filtrosContenido={filtrosActivos.filtros}
                estaActivo={filtrosActivos.estaActivo}
                onToggleFiltro={filtrosActivos.toggle}
                hayFiltrosContenidoActivos={filtrosActivos.hayActivos}
                onResetContenido={filtrosActivos.resetear}
                mostrarPrecio={false}
            />

            <MenuContextual
                abierto={menu.estado.abierto}
                onCerrar={menu.cerrarMenu}
                items={menu.items}
                x={menu.estado.x}
                y={menu.estado.y}
            />
        </div>
    );
};

export const DescargasIsland = conAutenticacion(DescargasBase as React.ComponentType<Record<string, unknown>>);
export default DescargasIsland;
