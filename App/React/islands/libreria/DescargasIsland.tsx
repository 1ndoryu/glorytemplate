/*
 * DescargasIsland — Kamples (C140)
 * Página independiente /descargas: muestra descargas del usuario + sugerencias.
 * Tabs: "Mis Descargas" y "Más Ideas" (sugerencias basadas en historial).
 * Header con indicador de límites de descarga.
 */

import { useEffect, useCallback } from 'react';
import { Download, Music, ArrowLeft } from 'lucide-react';
import { FeedSamples } from '@app/components/feed/FeedSamples';
import { TarjetaSample } from '@app/components/ui/TarjetaSample';
import { MenuContextual } from '@app/components/ui/MenuContextual';
import { IndicadorDescargas } from '@app/components/audio/IndicadorDescargas';
import { useDescargasPagina } from '@app/hooks/useDescargasPagina';
import { useTabsTopBarStore } from '@app/stores/tabsTopBarStore';
import { usePanelLateralStore } from '@app/stores/panelLateralStore';
import { useNavigationStore } from '@/core/router';
import { useMenuContextualSample } from '@app/hooks/useMenuContextualSample';
import { conAutenticacion } from '@app/components/auth/ConAutenticacion';
import '../../styles/componentes/descargasFavoritos.css';

const TABS_DESCARGAS = [
    { id: 'descargas', etiqueta: 'Mis Descargas' },
    { id: 'ideas', etiqueta: 'Más Ideas' },
];

const DescargasBase = (): JSX.Element => {
    const { samples, limites, cargando, proveedorSugerencias, manejarLike } = useDescargasPagina();
    const { navegar } = useNavigationStore();
    const { activa: tabActiva, setTabs } = useTabsTopBarStore();
    const { habilitar: habilitarPanel, deshabilitar: deshabilitarPanel, abrirDetalle, abrirComentarios } = usePanelLateralStore();
    const menu = useMenuContextualSample();

    /* Registrar tabs en TopBar al montar */
    useEffect(() => {
        setTabs(TABS_DESCARGAS, 'descargas');
        habilitarPanel();
        return () => {
            setTabs([]);
            deshabilitarPanel();
        };
    }, [setTabs, habilitarPanel, deshabilitarPanel]);

    const manejarClickTitulo = useCallback((sample: import('@app/types').SampleResumen) => {
        abrirDetalle(sample);
    }, [abrirDetalle]);

    const manejarComentar = useCallback((sampleId: number) => {
        const sample = samples.find((s) => s.id === sampleId);
        if (sample) abrirComentarios(sample);
    }, [samples, abrirComentarios]);

    return (
        <div className="descargasFavoritosContenedor" id="seccionDescargas">
            {/* Botón volver */}
            <button className="descargasFavoritosVolver" onClick={() => navegar('/libreria/')} type="button">
                <ArrowLeft size={18} />
                <span>Librería</span>
            </button>

            {/* Header con información de límites */}
            <div className="descargasFavoritosHeader">
                <div className="descargasFavoritosHeaderIcono descargasIcono">
                    <Download size={28} />
                </div>
                <div className="descargasFavoritosHeaderInfo">
                    <h1 className="descargasFavoritosTitulo">Mis Descargas</h1>
                    <p className="descargasFavoritosSubtitulo">
                        {samples.length} sample{samples.length !== 1 ? 's' : ''} descargado{samples.length !== 1 ? 's' : ''}
                    </p>
                </div>
                {/* Indicador de límites a la derecha */}
                {limites && (
                    <div className="descargasLimites">
                        <IndicadorDescargas limites={limites} />
                    </div>
                )}
            </div>

            {/* Contenido según tab activa */}
            {cargando ? (
                <div className="descargasFavoritosVacio">
                    <Music size={32} className="descargasFavoritosVacioIcono" />
                    <p>Cargando descargas...</p>
                </div>
            ) : tabActiva === 'descargas' ? (
                samples.length === 0 ? (
                    <div className="descargasFavoritosVacio">
                        <Download size={32} />
                        <h3 className="descargasFavoritosVacioTitulo">Sin descargas</h3>
                        <p className="descargasFavoritosVacioTexto">
                            Los samples que descargues aparecerán aquí.
                        </p>
                    </div>
                ) : (
                    <div className="listaDeSamples">
                        {samples.map((sample) => (
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
                )
            ) : (
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
