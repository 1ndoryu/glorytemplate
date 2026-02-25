/*
 * FavoritosIsland — Kamples (C140+C175)
 * Página independiente /favoritos con diseño idéntico a ColeccionDetalleIsland.
 * Header con imagen + info. Tabs: "Mis Favoritos" y "Más Ideas".
 */

import { useEffect, useCallback } from 'react';
import { Heart, ArrowLeft } from 'lucide-react';
import { FeedSamples } from '@app/components/feed/FeedSamples';
import { FiltroTags } from '@app/components/feed/FiltroTags';
import { TarjetaSample } from '@app/components/ui/TarjetaSample';
import { MenuContextual } from '@app/components/ui/MenuContextual';
import { useFavoritosPagina } from '@app/hooks/useFavoritosPagina';
import { useFeedFiltros } from '@app/hooks/useFeedFiltros';
import { useTabsTopBarStore } from '@app/stores/tabsTopBarStore';
import { useTabsIsla } from '@app/hooks/useTabsIsla';
import { usePanelLateralStore } from '@app/stores/panelLateralStore';
import { useNavigationStore } from '@/core/router';
import { useMenuContextualSample } from '@app/hooks/useMenuContextualSample';
import { conAutenticacion } from '@app/components/auth/ConAutenticacion';
import { obtenerImagenColor } from '@app/services/imagenesColor';
import '../../styles/componentes/coleccionDetalle.css';
import { BotonBase } from '../../components/ui/BotonBase';

const TABS_FAVORITOS = [
    { id: 'favoritos', etiqueta: 'Mis Favoritos' },
    { id: 'ideas', etiqueta: 'Más Ideas' },
];

const FavoritosBase = (): JSX.Element => {
    const { samples, totalFavoritos, cargando, proveedorSugerencias, manejarLike } = useFavoritosPagina();
    const navegar = useNavigationStore(s => s.navegar);
    const tabActiva = useTabsTopBarStore(s => s.activa);
    const habilitarPanel = usePanelLateralStore(s => s.habilitar);
    const deshabilitarPanel = usePanelLateralStore(s => s.deshabilitar);
    const abrirDetalle = usePanelLateralStore(s => s.abrirDetalle);
    const abrirComentarios = usePanelLateralStore(s => s.abrirComentarios);
    const menu = useMenuContextualSample();

    /* Filtrado client-side por tags/BPM para la lista principal */
    const filtros = useFeedFiltros({ samples });

    /* C174: Re-registrar tabs al volver a esta isla (keep-alive) */
    useTabsIsla('FavoritosIsland', TABS_FAVORITOS, 'favoritos');

    const islaActual = useNavigationStore(s => s.islaActual);
    useEffect(() => {
        if (islaActual === 'FavoritosIsland') habilitarPanel();
    }, [islaActual, habilitarPanel]);
    useEffect(() => {
        return () => deshabilitarPanel();
    }, [deshabilitarPanel]);

    const manejarClickTitulo = useCallback((sample: import('@app/types').SampleResumen) => {
        abrirDetalle(sample);
    }, [abrirDetalle]);

    const manejarComentar = useCallback((sampleId: number) => {
        const sample = samples.find((s) => s.id === sampleId);
        if (sample) abrirComentarios(sample);
    }, [samples, abrirComentarios]);

    if (cargando) {
        return (
            <div className="coleccionDetalle" id="seccionFavoritos">
                <div className="coleccionCargando">Cargando favoritos...</div>
            </div>
        );
    }

    return (
        <div className="coleccionDetalle" id="seccionFavoritos">
            {/* Botón volver — misma clase que ColeccionDetalle */}
            <BotonBase variante="ghost" className="coleccionVolver" onClick={() => navegar('/libreria/')} type="button">
                <ArrowLeft size={18} />
                <span>Librería</span>
            </BotonBase>

            {/* Header idéntico a ColeccionDetalle */}
            <div className="coleccionHeader">
                <img
                    className="coleccionHeaderImg"
                    src={obtenerImagenColor(1002)}
                    alt="Mis Favoritos"
                />
                <div className="coleccionHeaderInfo">
                    <h1 className="coleccionNombre">Mis Favoritos</h1>
                    <div className="coleccionMeta">
                        <span className="coleccionStats">
                            {totalFavoritos} sample{totalFavoritos !== 1 ? 's' : ''}
                        </span>
                    </div>
                </div>
            </div>

            {/* Contenido según tab activa — key distinta fuerza desmontaje (C46) */}
            {tabActiva === 'favoritos' ? (
                samples.length === 0 ? (
                    <div className="coleccionVacia" style={{ flexDirection: 'column', gap: 'var(--espacioMd)' }}>
                        <Heart size={32} />
                        <p>Dale like a un sample para guardarlo aquí.</p>
                    </div>
                ) : (
                    <>
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
                        />
                        <div className="listaDeSamples">
                            {filtros.samplesFiltrados.map((sample) => (
                                <TarjetaSample
                                    key={sample.id}
                                    sample={sample}
                                    onLike={manejarLike}
                                    onMenu={menu.abrirMenu}
                                    onClickCreador={(u) => navegar(`/perfil/${u}`)}
                                    onClickTitulo={manejarClickTitulo}
                                    onComentar={manejarComentar}
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
                    mensajeVacio="Da like a algunos samples para recibir sugerencias personalizadas."
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
