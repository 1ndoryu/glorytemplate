/*
 * DescargasIsland — Kamples (C140+C175)
 * Página independiente /descargas con diseño idéntico a ColeccionDetalleIsland.
 * Header con imagen + info + acciones. Tabs: "Mis Descargas" y "Más Ideas".
 */

import { useEffect, useCallback } from 'react';
import { Download, ArrowLeft, Crown } from 'lucide-react';
import { FeedSamples } from '@app/components/feed/FeedSamples';
import { TarjetaSample } from '@app/components/ui/TarjetaSample';
import { Badge } from '@app/components/ui/Badge';
import { MenuContextual } from '@app/components/ui/MenuContextual';
import { useDescargasPagina } from '@app/hooks/useDescargasPagina';
import { useTabsTopBarStore } from '@app/stores/tabsTopBarStore';
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
    const { samples, limites, cargando, proveedorSugerencias, manejarLike } = useDescargasPagina();
    const { navegar } = useNavigationStore();
    const { activa: tabActiva, setTabs } = useTabsTopBarStore();
    const { habilitar: habilitarPanel, deshabilitar: deshabilitarPanel, abrirDetalle, abrirComentarios } = usePanelLateralStore();
    const menu = useMenuContextualSample();

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

    if (cargando) {
        return (
            <div className="coleccionDetalle" id="seccionDescargas">
                <div className="coleccionCargando">Cargando descargas...</div>
            </div>
        );
    }

    /* Texto de límites para mostrar en el header */
    const textoLimites = limites
        ? limites.ilimitado
            ? 'Descargas ilimitadas'
            : `${limites.usadas}/${limites.limite} usadas hoy`
        : '';

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
                    <div className="coleccionHeaderTipo">
                        {limites && (
                            <Badge variante={limites.plan === 'free' ? 'neutro' : 'acento'}>
                                {limites.plan === 'free' ? 'Free' : <><Crown size={12} /> {limites.plan.charAt(0).toUpperCase() + limites.plan.slice(1)}</>}
                            </Badge>
                        )}
                    </div>
                    <h1 className="coleccionNombre">Mis Descargas</h1>
                    <div className="coleccionMeta">
                        <span className="coleccionStats">
                            {samples.length} sample{samples.length !== 1 ? 's' : ''}
                        </span>
                        {textoLimites && (
                            <span className="coleccionStats">
                                <Download size={12} /> {textoLimites}
                            </span>
                        )}
                        {limites && (
                            <span className="coleccionStats">
                                {limites.calidad.toUpperCase()}
                            </span>
                        )}
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
