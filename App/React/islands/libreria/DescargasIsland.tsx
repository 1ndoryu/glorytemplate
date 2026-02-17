/*
 * DescargasIsland — Kamples (C140+C175)
 * Página independiente /descargas con diseño idéntico a ColeccionDetalleIsland.
 * Header con imagen + info + acciones. Tabs: "Mis Descargas" y "Más Ideas".
 */

import { useEffect, useCallback } from 'react';
import { Download, ArrowLeft } from 'lucide-react';
import { FeedSamples } from '@app/components/feed/FeedSamples';
import { TarjetaSample } from '@app/components/ui/TarjetaSample';
import { MenuContextual } from '@app/components/ui/MenuContextual';
import { useDescargasPagina } from '@app/hooks/useDescargasPagina';
import { useTabsTopBarStore } from '@app/stores/tabsTopBarStore';
import { useTabsIsla } from '@app/hooks/useTabsIsla';
import { usePanelLateralStore } from '@app/stores/panelLateralStore';
import { useNavigationStore } from '@/core/router';
import { useMenuContextualSample } from '@app/hooks/useMenuContextualSample';
import { conAutenticacion } from '@app/components/auth/ConAutenticacion';
import { obtenerImagenColor } from '@app/services/imagenesColor';
import '../../styles/componentes/coleccionDetalle.css';

const TABS_DESCARGAS = [
    { id: 'descargas', etiqueta: 'Mis Descargas' },
    { id: 'ideas', etiqueta: 'Más Ideas' },
];

const DescargasBase = (): JSX.Element => {
    const { samples, cargando, proveedorSugerencias, manejarLike } = useDescargasPagina();
    const { navegar } = useNavigationStore();
    const { activa: tabActiva } = useTabsTopBarStore();
    const { habilitar: habilitarPanel, deshabilitar: deshabilitarPanel, abrirDetalle, abrirComentarios } = usePanelLateralStore();
    const menu = useMenuContextualSample();

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
                <div className="coleccionCargando">Cargando descargas...</div>
            </div>
        );
    }

    return (
        <div className="coleccionDetalle" id="seccionDescargas">
            {/* Botón volver — misma clase que ColeccionDetalle */}
            <button className="coleccionVolver" onClick={() => navegar('/libreria/')} type="button">
                <ArrowLeft size={18} />
                <span>Librería</span>
            </button>

            {/* Header idéntico a ColeccionDetalle */}
            <div className="coleccionHeader">
                <img
                    className="coleccionHeaderImg"
                    src={obtenerImagenColor(1001)}
                    alt="Mis Descargas"
                />
                <div className="coleccionHeaderInfo">
                    <h1 className="coleccionNombre">Mis Descargas</h1>
                    <div className="coleccionMeta">
                        <span className="coleccionStats">
                            {samples.length} sample{samples.length !== 1 ? 's' : ''}
                        </span>
                    </div>
                </div>
            </div>

            {/* Contenido según tab activa — key distinta fuerza desmontaje (C46) */}
            {tabActiva === 'descargas' ? (
                samples.length === 0 ? (
                    <div className="coleccionVacia" style={{ flexDirection: 'column', gap: 'var(--espacioMd)' }}>
                        <Download size={32} />
                        <p>Los samples que descargues aparecerán aquí.</p>
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
