/*
 * ExploradorIsland — Kamples (C281)
 * Página /explorador: vista tipo file-explorer para samples coleccionados.
 * Muestra un árbol de carpetas (basado en metadata IA C282) a la izquierda
 * y la lista de samples a la derecha. Descargados + subidos = "coleccionados".
 */

import { useEffect, useCallback } from 'react';
import { FolderOpen, ArrowLeft, Folder, FolderClosed } from 'lucide-react';
import { TarjetaSample } from '@app/components/ui/TarjetaSample';
import { MenuContextual } from '@app/components/ui/MenuContextual';
import { useExploradorPagina } from '@app/hooks/useExploradorPagina';
import { usePanelLateralStore } from '@app/stores/panelLateralStore';
import { useNavigationStore } from '@/core/router';
import { useMenuContextualSample } from '@app/hooks/useMenuContextualSample';
import { conAutenticacion } from '@app/components/auth/ConAutenticacion';
import { obtenerImagenColor } from '@app/services/imagenesColor';
import '../../styles/componentes/explorador.css';

const ExploradorBase = (): JSX.Element => {
    const {
        carpetas,
        samples,
        cargando,
        carpetaActiva,
        totalSamples,
        seleccionarCarpeta,
        manejarLike,
    } = useExploradorPagina();
    const { navegar } = useNavigationStore();
    const { habilitar: habilitarPanel, deshabilitar: deshabilitarPanel, abrirDetalle, abrirComentarios } = usePanelLateralStore();
    const menu = useMenuContextualSample();

    const islaActual = useNavigationStore(s => s.islaActual);
    useEffect(() => {
        if (islaActual === 'ExploradorIsland') habilitarPanel();
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

    if (cargando && samples.length === 0) {
        return (
            <div className="explorador" id="seccionExplorador">
                <div className="exploradorCargando">Cargando explorador...</div>
            </div>
        );
    }

    /* Cuenta total sumando todas las carpetas */
    const totalGeneral = carpetas.reduce((acc, c) => acc + c.total, 0);

    return (
        <div className="explorador" id="seccionExplorador">
            {/* Botón volver */}
            <button className="coleccionVolver" onClick={() => navegar('/libreria/')} type="button">
                <ArrowLeft size={18} />
                <span>Librería</span>
            </button>

            {/* Header */}
            <div className="exploradorHeader">
                <img
                    className="exploradorHeaderImg"
                    src={obtenerImagenColor(2001)}
                    alt="Explorador"
                />
                <div className="exploradorHeaderInfo">
                    <h1 className="exploradorNombre">Explorador</h1>
                    <div className="exploradorMeta">
                        <span>{totalSamples} sample{totalSamples !== 1 ? 's' : ''} coleccionados</span>
                    </div>
                </div>
            </div>

            {/* Contenido: carpetas + samples */}
            <div className="exploradorContenido">
                {/* Panel de carpetas */}
                <div className="exploradorCarpetas">
                    <h3 className="exploradorCarpetaTitulo">Carpetas</h3>

                    {/* Botón "Todas" */}
                    <button
                        className={`exploradorCarpetaItem exploradorCarpetaTodas ${carpetaActiva === '' ? 'carpetaActiva' : ''}`}
                        onClick={() => seleccionarCarpeta('')}
                        type="button"
                    >
                        <FolderOpen size={16} />
                        <span className="exploradorCarpetaNombre">Todas</span>
                        <span className="exploradorCarpetaConteo">{totalGeneral}</span>
                    </button>

                    <div className="exploradorCarpetaSeparador" />

                    {/* Carpetas primarias con subcarpetas */}
                    {carpetas.map((carpeta) => (
                        <div key={carpeta.primaria}>
                            <button
                                className={`exploradorCarpetaItem ${carpetaActiva === carpeta.primaria ? 'carpetaActiva' : ''}`}
                                onClick={() => seleccionarCarpeta(carpeta.primaria)}
                                type="button"
                            >
                                {carpetaActiva === carpeta.primaria
                                    ? <FolderOpen size={16} />
                                    : <FolderClosed size={16} />
                                }
                                <span className="exploradorCarpetaNombre">{carpeta.primaria}</span>
                                <span className="exploradorCarpetaConteo">{carpeta.total}</span>
                            </button>

                            {/* Subcarpetas visibles cuando la primaria está activa */}
                            {carpetaActiva === carpeta.primaria && carpeta.subcarpetas.length > 0 && (
                                <div className="exploradorSubcarpetas">
                                    {carpeta.subcarpetas.map((sub) => (
                                        <button
                                            key={sub.nombre}
                                            className="exploradorSubcarpetaItem"
                                            type="button"
                                            title={sub.nombre}
                                        >
                                            <Folder size={12} />
                                            <span>{sub.nombre}</span>
                                            <span className="exploradorCarpetaConteo">{sub.total}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}

                    {carpetas.length === 0 && !cargando && (
                        <div style={{ padding: 'var(--espacioSm)', color: 'var(--textoBajo)', fontSize: 'var(--textoXs)' }}>
                            Sin carpetas aún. Descarga o sube samples para empezar.
                        </div>
                    )}
                </div>

                {/* Panel de samples */}
                <div className="exploradorSamples">
                    {samples.length === 0 ? (
                        <div className="exploradorVacio">
                            <FolderOpen size={32} />
                            <p>
                                {carpetaActiva
                                    ? `No hay samples en "${carpetaActiva}".`
                                    : 'Descarga o sube samples para verlos aquí. Se organizarán automáticamente por carpetas.'
                                }
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
                    )}
                </div>
            </div>

            {/* Menú contextual global */}
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

export const ExploradorIsland = conAutenticacion(ExploradorBase as React.ComponentType<Record<string, unknown>>);
export default ExploradorIsland;
