/*
 * FavoritosIsland — Kamples (C140)
 * Página independiente /favoritos: muestra favoritos del usuario + sugerencias.
 * Tabs: "Mis Favoritos" y "Más Ideas" (sugerencias basadas en gustos).
 */

import { useEffect, useCallback } from 'react';
import { Heart, Music, ArrowLeft } from 'lucide-react';
import { FeedSamples } from '@app/components/feed/FeedSamples';
import { TarjetaSample } from '@app/components/ui/TarjetaSample';
import { MenuContextual } from '@app/components/ui/MenuContextual';
import { useFavoritosPagina } from '@app/hooks/useFavoritosPagina';
import { useTabsTopBarStore } from '@app/stores/tabsTopBarStore';
import { usePanelLateralStore } from '@app/stores/panelLateralStore';
import { useNavigationStore } from '@/core/router';
import { useMenuContextualSample } from '@app/hooks/useMenuContextualSample';
import { conAutenticacion } from '@app/components/auth/ConAutenticacion';
import '../../styles/componentes/descargasFavoritos.css';

const TABS_FAVORITOS = [
    { id: 'favoritos', etiqueta: 'Mis Favoritos' },
    { id: 'ideas', etiqueta: 'Más Ideas' },
];

const FavoritosBase = (): JSX.Element => {
    const { samples, totalFavoritos, cargando, proveedorSugerencias, manejarLike } = useFavoritosPagina();
    const { navegar } = useNavigationStore();
    const { activa: tabActiva, setTabs } = useTabsTopBarStore();
    const { habilitar: habilitarPanel, deshabilitar: deshabilitarPanel, abrirDetalle, abrirComentarios } = usePanelLateralStore();
    const menu = useMenuContextualSample();

    /* Registrar tabs en TopBar al montar */
    useEffect(() => {
        setTabs(TABS_FAVORITOS, 'favoritos');
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
        <div className="descargasFavoritosContenedor" id="seccionFavoritos">
            {/* Botón volver */}
            <button className="descargasFavoritosVolver" onClick={() => navegar('/libreria/')} type="button">
                <ArrowLeft size={18} />
                <span>Librería</span>
            </button>

            {/* Header */}
            <div className="descargasFavoritosHeader">
                <div className="descargasFavoritosHeaderIcono favoritosIcono">
                    <Heart size={28} />
                </div>
                <div className="descargasFavoritosHeaderInfo">
                    <h1 className="descargasFavoritosTitulo">Mis Favoritos</h1>
                    <p className="descargasFavoritosSubtitulo">
                        {totalFavoritos} sample{totalFavoritos !== 1 ? 's' : ''} guardado{totalFavoritos !== 1 ? 's' : ''}
                    </p>
                </div>
            </div>

            {/* Contenido según tab activa */}
            {cargando ? (
                <div className="descargasFavoritosVacio">
                    <Music size={32} className="descargasFavoritosVacioIcono" />
                    <p>Cargando favoritos...</p>
                </div>
            ) : tabActiva === 'favoritos' ? (
                samples.length === 0 ? (
                    <div className="descargasFavoritosVacio">
                        <Heart size={32} />
                        <h3 className="descargasFavoritosVacioTitulo">Sin favoritos</h3>
                        <p className="descargasFavoritosVacioTexto">
                            Dale like a un sample para guardarlo aquí.
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
