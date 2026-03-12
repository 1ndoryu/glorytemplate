/*
 * DescargasIsland — Kamples (C140+C175+C281.2)
 * Página independiente /descargas ("Coleccionados") con diseño idéntico a ColeccionDetalleIsland.
 * Header con imagen + info + acciones. Tabs: "Mis Coleccionados" y "Más Ideas".
 */

import { useEffect, useCallback } from 'react';
import { Download, ArrowLeft, ShoppingBag } from 'lucide-react';
import { FeedSamples } from '@app/components/feed/FeedSamples';
import { FiltroTags } from '@app/components/feed/FiltroTags';
import { TarjetaSample } from '@app/components/ui/TarjetaSample';
import { MenuContextual } from '@app/components/ui/MenuContextual';
import { useDescargasPagina } from '@app/hooks/useDescargasPagina';
import { useFeedFiltros } from '@app/hooks/useFeedFiltros';
import { useTabsTopBarStore } from '@app/stores/tabsTopBarStore';
import { useTabsIsla } from '@app/hooks/useTabsIsla';
import { usePanelLateralStore } from '@app/stores/panelLateralStore';
import { useNavigationStore } from '@/core/router';
import { useMenuContextualSample } from '@app/hooks/useMenuContextualSample';
import { useIslaActiva } from '@app/hooks/useIslaActiva';
import { useValorCongelado } from '@app/hooks/useValorCongelado';
import { conAutenticacion } from '@app/components/auth/ConAutenticacion';
import { obtenerImagenColor } from '@app/services/imagenesColor';
import '../../styles/componentes/coleccionDetalle.css';
import { BotonBase } from '../../components/ui/BotonBase';
import { SkeletonColeccionDetalle } from '@app/components/skeletons';

const TABS_DESCARGAS = [
    { id: 'descargas', etiqueta: 'Mis Coleccionados' },
    { id: 'comprados', etiqueta: 'Comprados' },
    { id: 'ideas', etiqueta: 'Más Ideas' },
];

const DescargasBase = (): JSX.Element => {
    const { samples, comprados, cargando, cargandoComprados, proveedorSugerencias, manejarLike } = useDescargasPagina();
    const navegar = useNavigationStore(s => s.navegar);
    const tabActivaGlobal = useTabsTopBarStore(s => s.activa);
    const habilitarPanel = usePanelLateralStore(s => s.habilitar);
    const deshabilitarPanel = usePanelLateralStore(s => s.deshabilitar);
    const abrirDetalle = usePanelLateralStore(s => s.abrirDetalle);
    const abrirComentarios = usePanelLateralStore(s => s.abrirComentarios);
    const menu = useMenuContextualSample();

    /* Keep-alive: congelar tabActiva cuando la isla está oculta */
    const activa = useIslaActiva('DescargasIsland');
    const tabActiva = useValorCongelado(tabActivaGlobal, !activa);

    /* Filtrado client-side por tags/BPM para la lista principal */
    const filtros = useFeedFiltros({ samples });

    /* C174: Re-registrar tabs al volver a esta isla (keep-alive) */
    useTabsIsla('DescargasIsland', TABS_DESCARGAS, 'descargas');

    const islaActual = useNavigationStore(s => s.islaActual);
    useEffect(() => {
        if (islaActual === 'DescargasIsland') habilitarPanel();
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
            <div className="coleccionDetalle" id="seccionDescargas">
                <SkeletonColeccionDetalle cantidadSamples={4} />
            </div>
        );
    }

    return (
        <div className="coleccionDetalle" id="seccionDescargas">
            {/* Botón volver — misma clase que ColeccionDetalle */}
            <BotonBase variante="ghost" className="coleccionVolver" onClick={() => navegar('/libreria/')} type="button">
                <ArrowLeft size={18} />
                <span>Librería</span>
            </BotonBase>

            {/* Header idéntico a ColeccionDetalle */}
            <div className="coleccionHeader">
                <img
                    className="coleccionHeaderImg"
                    src={obtenerImagenColor(1001)}
                    alt="Mis Coleccionados"
                />
                <div className="coleccionHeaderInfo">
                    <h1 className="coleccionNombre">Mis Coleccionados</h1>
                    <div className="coleccionMeta">
                        <span className="coleccionStats">
                            {samples.length} sample{samples.length !== 1 ? 's' : ''}
                        </span>
                    </div>
                </div>
            </div>

            {/* Contenido según tab activa — key distinta fuerza desmontaje (C46) */}
            {tabActiva === 'descargas' && (
                samples.length === 0 ? (
                    <div className="coleccionVacia" style={{ flexDirection: 'column', gap: 'var(--espacioMd)' }}>
                        <Download size={32} />
                        <p>Los samples que colecciones aparecerán aquí.</p>
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
                                    contexto={filtros.samplesFiltrados}
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
            )}

            {tabActiva === 'comprados' && (
                cargandoComprados ? (
                    <SkeletonColeccionDetalle cantidadSamples={3} />
                ) : comprados.length === 0 ? (
                    <div className="coleccionVacia" style={{ flexDirection: 'column', gap: 'var(--espacioMd)' }}>
                        <ShoppingBag size={32} />
                        <p>Los samples que compres aparecerán aquí.</p>
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
                                onClickTitulo={manejarClickTitulo}
                                onComentar={manejarComentar}
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
                    mensajeVacio="Descarga algunos samples para recibir sugerencias personalizadas."
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

export const DescargasIsland = conAutenticacion(DescargasBase as React.ComponentType<Record<string, unknown>>);
export default DescargasIsland;
