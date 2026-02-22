/*
 * ExploradorIsland — Kamples (C281)
 * Página /explorador: vista tipo file-explorer para samples coleccionados.
 * Muestra un árbol de carpetas (basado en metadata IA C282) a la izquierda
 * y la lista de samples a la derecha. Descargados + subidos = "coleccionados".
 */

import { useEffect, useCallback, useState } from 'react';
import { FolderOpen, ArrowLeft, Folder, FolderClosed, LayoutGrid, List, ChevronDown, ChevronRight } from 'lucide-react';
import { TarjetaSample } from '@app/components/ui/TarjetaSample';
import { TarjetaSampleCuadricula } from '@app/components/ui/TarjetaSampleCuadricula';
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
        subcarpetaActiva,
        totalSamples,
        carpetasDesplegadas,
        seleccionarCarpeta,
        seleccionarSubcarpeta,
        toggleDesplegada,
        manejarLike,
    } = useExploradorPagina();
    const navegar = useNavigationStore(s => s.navegar);
    const habilitarPanel = usePanelLateralStore(s => s.habilitar);
    const deshabilitarPanel = usePanelLateralStore(s => s.deshabilitar);
    const abrirDetalle = usePanelLateralStore(s => s.abrirDetalle);
    const abrirComentarios = usePanelLateralStore(s => s.abrirComentarios);
    const menu = useMenuContextualSample();

    /* C291: Vista lista/cuadricula */
    const [vistaActiva, setVistaActiva] = useState<'lista' | 'cuadricula'>('lista');

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

                {/* C291: Toggle vista lista/cuadricula */}
                <div className="exploradorVistaToggle">
                    <button
                        className={`exploradorVistaBoton ${vistaActiva === 'lista' ? 'exploradorVistaActiva' : ''}`}
                        onClick={() => setVistaActiva('lista')}
                        type="button"
                        title="Vista lista"
                    >
                        <List size={18} />
                    </button>
                    <button
                        className={`exploradorVistaBoton ${vistaActiva === 'cuadricula' ? 'exploradorVistaActiva' : ''}`}
                        onClick={() => setVistaActiva('cuadricula')}
                        type="button"
                        title="Vista cuadrícula"
                    >
                        <LayoutGrid size={18} />
                    </button>
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
                    {carpetas.map((carpeta) => {
                        const estaDesplegada = carpetasDesplegadas.has(carpeta.primaria);
                        const tieneSubcarpetas = carpeta.subcarpetas.length > 0;

                        return (
                            <div key={carpeta.primaria}>
                                <div className="exploradorCarpetaFila">
                                    {/* Flecha de despliegue */}
                                    {tieneSubcarpetas ? (
                                        <button
                                            className="exploradorCarpetaChevron"
                                            onClick={() => toggleDesplegada(carpeta.primaria)}
                                            type="button"
                                            title={estaDesplegada ? 'Colapsar' : 'Expandir'}
                                        >
                                            {estaDesplegada
                                                ? <ChevronDown size={14} />
                                                : <ChevronRight size={14} />
                                            }
                                        </button>
                                    ) : (
                                        <span className="exploradorCarpetaChevronPlaceholder" />
                                    )}
                                    <button
                                        className={`exploradorCarpetaItem ${carpetaActiva === carpeta.primaria && !subcarpetaActiva ? 'carpetaActiva' : ''}`}
                                        onClick={() => seleccionarCarpeta(carpeta.primaria)}
                                        type="button"
                                    >
                                        {estaDesplegada
                                            ? <FolderOpen size={16} />
                                            : <FolderClosed size={16} />
                                        }
                                        <span className="exploradorCarpetaNombre">{carpeta.primaria}</span>
                                        <span className="exploradorCarpetaConteo">{carpeta.total}</span>
                                    </button>
                                </div>

                                {/* Subcarpetas visibles cuando está desplegada */}
                                {estaDesplegada && tieneSubcarpetas && (
                                    <div className="exploradorSubcarpetas">
                                        {carpeta.subcarpetas.map((sub) => (
                                            <button
                                                key={sub.nombre}
                                                className={`exploradorSubcarpetaItem ${carpetaActiva === carpeta.primaria && subcarpetaActiva === sub.nombre ? 'subcarpetaActiva' : ''}`}
                                                onClick={() => seleccionarSubcarpeta(carpeta.primaria, sub.nombre)}
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
                        );
                    })}

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
                    ) : vistaActiva === 'cuadricula' ? (
                        /* C291: Vista cuadrícula — solo portada y nombre */
                        <div className="cuadriculaDeSamples">
                            {samples.map((sample) => (
                                <TarjetaSampleCuadricula
                                    key={sample.id}
                                    sample={sample}
                                    onClickTitulo={manejarClickTitulo}
                                    onMenu={menu.abrirMenu}
                                />
                            ))}
                        </div>
                    ) : (
                        /* Vista lista — tarjeta completa */
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
