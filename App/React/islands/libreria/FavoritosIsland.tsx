/*
 * FavoritosIsland — Kamples (C140+C175)
 * Página independiente /favoritos con diseño idéntico a ColeccionDetalleIsland.
 * Header con imagen + info. Tabs: "Mis Favoritos" y "Más Ideas".
 */

import { useEffect, useCallback, useState } from 'react';
import { Heart, ArrowLeft } from 'lucide-react';
import { FeedSamples } from '@app/components/feed/FeedSamples';
import { BarraControlFeed, OPCIONES_ORDEN_PERSONAL } from '@app/components/feed/BarraControlFeed';
import type { TipoOrdenFeed } from '@app/components/feed/BarraControlFeed';
import { FiltroTags } from '@app/components/feed/FiltroTags';
import { TarjetaSample } from '@app/components/ui/TarjetaSample';
import { MenuContextual } from '@app/components/ui/MenuContextual';
import { useFavoritosPagina } from '@app/hooks/useFavoritosPagina';
import { useFeedFiltros } from '@app/hooks/useFeedFiltros';
import { useTabsTopBarStore } from '@app/stores/tabsTopBarStore';
import { useFiltrosStore } from '@app/stores/filtrosStore';
import { useTabsIsla } from '@app/hooks/useTabsIsla';
import { usePanelLateralStore } from '@app/stores/panelLateralStore';
import { useNavigationStore } from '@/core/router';
import { useMenuContextualSample } from '@app/hooks/useMenuContextualSample';
import { useIslaActiva } from '@app/hooks/useIslaActiva';
import { useValorCongelado } from '@app/hooks/useValorCongelado';
import { conAutenticacion } from '@app/components/auth/ConAutenticacion';
import { SkeletonFeed } from '@app/components/skeletons';
import { obtenerImagenColor } from '@app/services/imagenesColor';
import { useT } from '@app/utils/i18n';
import '../../styles/componentes/coleccionDetalle.css';
import { BotonBase } from '../../components/ui/BotonBase';

const TABS_FAVORITOS = [
    { id: 'favoritos', etiqueta: 'favoritos.tabs.misFavoritos' },
    { id: 'ideas', etiqueta: 'descargas.tabs.masIdeas' },
];

const FavoritosBase = (): JSX.Element => {
    const { t } = useT();
    /* QL53: Estado de ordenamiento */
    const [ordenFavoritos, setOrdenFavoritos] = useState<TipoOrdenFeed>('recientes');
    const { samples, totalFavoritos, cargando, proveedorSugerencias, manejarLike } = useFavoritosPagina(ordenFavoritos);
    const navegar = useNavigationStore(s => s.navegar);
    const tabActivaGlobal = useTabsTopBarStore(s => s.activa);
    const habilitarPanel = usePanelLateralStore(s => s.habilitar);
    const deshabilitarPanel = usePanelLateralStore(s => s.deshabilitar);
    const abrirComentarios = usePanelLateralStore(s => s.abrirComentarios);
    const menu = useMenuContextualSample();

    /* Keep-alive: congelar tabActiva cuando la isla está oculta */
    const activa = useIslaActiva('FavoritosIsland');
    const tabActiva = useValorCongelado(tabActivaGlobal, !activa);

    /* Filtrado client-side por tags/BPM para la lista principal */
    const filtros = useFeedFiltros({ samples, busquedaClientSide: true });

    /* [193A-30] Búsqueda por tag: setBusqueda global, filtro local vía busquedaClientSide */
    const manejarBuscarTag = useCallback((tag: string) => {
        useFiltrosStore.getState().setBusqueda(tag);
    }, []);

    /* C174: Re-registrar tabs al volver a esta isla (keep-alive) */
    useTabsIsla('FavoritosIsland', TABS_FAVORITOS, 'favoritos');

    const islaActual = useNavigationStore(s => s.islaActual);
    useEffect(() => {
        if (islaActual === 'FavoritosIsland') habilitarPanel();
    }, [islaActual, habilitarPanel]);
    useEffect(() => {
        return () => deshabilitarPanel();
    }, [deshabilitarPanel]);

    const manejarComentar = useCallback((sampleId: number) => {
        const sample = samples.find((s) => s.id === sampleId);
        if (sample) abrirComentarios(sample);
    }, [samples, abrirComentarios]);

    if (cargando) {
        return (
            <div className="coleccionDetalle" id="seccionFavoritos">
                <SkeletonFeed cantidad={4} />
            </div>
        );
    }

    return (
        <div className="coleccionDetalle" id="seccionFavoritos">
            {/* Botón volver — misma clase que ColeccionDetalle */}
            <BotonBase variante="ghost" className="botonVolver" onClick={() => navegar('/libreria/')} type="button">
                <ArrowLeft size={18} />
                <span>{t('topbar.libreria')}</span>
            </BotonBase>

            {/* Header idéntico a ColeccionDetalle */}
            <div className="coleccionHeader">
                <img
                    className="coleccionHeaderImg"
                    src={obtenerImagenColor(1002)}
                    alt={t('favoritos.tabs.misFavoritos')}
                />
                <div className="coleccionHeaderInfo">
                    <h1 className="coleccionNombre">{t('favoritos.tabs.misFavoritos')}</h1>
                    <div className="coleccionMeta">
                        <span className="coleccionStats">
                            {totalFavoritos} {t(totalFavoritos === 1 ? 'feed.sample' : 'feed.samples')}
                        </span>
                    </div>
                </div>
            </div>

            {/* Contenido según tab activa — key distinta fuerza desmontaje (C46) */}
            {tabActiva === 'favoritos' ? (
                samples.length === 0 ? (
                    <div className="coleccionVacia" style={{ flexDirection: 'column', gap: 'var(--espacioMd)' }}>
                        <Heart size={32} />
                        <p>{t('descargas.mensajeVacio.favoritos')}</p>
                    </div>
                ) : (
                    <>
                        <BarraControlFeed
                            opciones={OPCIONES_ORDEN_PERSONAL}
                            ordenActual={ordenFavoritos}
                            onOrdenCambiar={setOrdenFavoritos}
                        />
                        <FiltroTags
                            tagsAgrupados={filtros.tagsAgrupados}
                            tagsSueltos={filtros.tagsSueltos}
                            tagsIncluidos={filtros.tagsIncluidos}
                            tagsExcluidos={filtros.tagsExcluidos}
                            bpmMin={filtros.bpmMin}
                            bpmMax={filtros.bpmMax}
                            onIncluirTag={filtros.manejarIncluirTag}
                            onExcluirTag={filtros.manejarExcluirTag}
                            onQuitarTag={filtros.quitarTag}
                            onCambiarBpm={filtros.setBpmRango}
                            onBuscarTag={manejarBuscarTag}
                        />
                        <div className="listaDeSamples">
                            {filtros.samplesFiltrados.map((sample) => (
                                <TarjetaSample
                                    key={sample.id}
                                    sample={sample}
                                    contexto={filtros.samplesFiltrados}
                                    onLike={manejarLike}
                                    onMenu={menu.abrirMenu}
                                    onClickCreador={(u) => navegar(`/perfil/${u}`)}
                                    onComentar={manejarComentar}
                                    onFiltrarMeta={manejarBuscarTag}
                                />
                            ))}
                        </div>
                    </>
                )
            ) : (
                <FeedSamples
                    key="favoritos-ideas"
                    proveedor={proveedorSugerencias}
                    claveCache="sugerencias_favoritos"
                    mostrarTags
                    infiniteScroll
                    virtualizar={false}
                    mensajeVacio={t('favoritos.mensajeVacio.ideas')}
                />
            )}

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

export const FavoritosIsland = conAutenticacion(FavoritosBase as React.ComponentType<Record<string, unknown>>);
export default FavoritosIsland;
