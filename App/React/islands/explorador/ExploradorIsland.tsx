/*
 * ExploradorIsland — Kamples (C281)
 * Página /explorador: vista tipo file-explorer para samples coleccionados.
 * Muestra un árbol de carpetas (basado en metadata IA C282) a la izquierda
 * y la lista de samples a la derecha. Descargados + subidos = "coleccionados".
 * Navegación 100% client-side sin recargas (filtrado local).
 */

import { useEffect, useCallback, useState, useMemo, useRef } from 'react';
import { FolderOpen, ArrowLeft, Folder, FolderClosed, LayoutGrid, List, ChevronDown, ChevronRight, ChevronLeft, FolderPlus, GripVertical } from 'lucide-react';
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
        carpetasLocales,
        seleccionarCarpeta,
        seleccionarSubcarpeta,
        toggleDesplegada,
        manejarLike,
        moverSample,
        crearCarpeta,
        sampleArrastrado,
        setSampleArrastrado,
    } = useExploradorPagina();
    const navegar = useNavigationStore(s => s.navegar);
    const habilitarPanel = usePanelLateralStore(s => s.habilitar);
    const deshabilitarPanel = usePanelLateralStore(s => s.deshabilitar);
    const abrirDetalle = usePanelLateralStore(s => s.abrirDetalle);
    const abrirComentarios = usePanelLateralStore(s => s.abrirComentarios);
    const menu = useMenuContextualSample();

    const [vistaActiva, setVistaActiva] = useState<'lista' | 'cuadricula'>('lista');
    /* C338: Dialogo crear carpeta */
    const [crearCarpetaAbierto, setCrearCarpetaAbierto] = useState(false);
    const [nuevaCarpetaNombre, setNuevaCarpetaNombre] = useState('');
    /* C338: Modal "Mover a" */
    const [moverModalAbierto, setMoverModalAbierto] = useState(false);
    const [sampleParaMover, setSampleParaMover] = useState<number | null>(null);
    /* C338: Drop feedback */
    const [carpetaDragOver, setCarpetaDragOver] = useState<string | null>(null);
    const inputCrearRef = useRef<HTMLInputElement>(null);

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

    /* C338: Drag start — marcar sample siendo arrastrado */
    const manejarDragStart = useCallback((sampleId: number) => {
        setSampleArrastrado(sampleId);
    }, [setSampleArrastrado]);

    /* C338: Drag end — limpiar estado */
    const manejarDragEnd = useCallback(() => {
        setSampleArrastrado(null);
        setCarpetaDragOver(null);
    }, [setSampleArrastrado]);

    /* C338: Drop sobre carpeta — mover sample */
    const manejarDropEnCarpeta = useCallback(async (
        e: React.DragEvent,
        primaria: string,
        subcarpeta = ''
    ) => {
        e.preventDefault();
        setCarpetaDragOver(null);
        const sampleId = sampleArrastrado ?? parseInt(e.dataTransfer.getData('sampleId'), 10);
        if (!sampleId || isNaN(sampleId)) return;
        setSampleArrastrado(null);
        await moverSample(sampleId, primaria, subcarpeta);
    }, [sampleArrastrado, moverSample, setSampleArrastrado]);

    /* C338: Drag over para feedback visual */
    const manejarDragOver = useCallback((e: React.DragEvent, carpetaId: string) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setCarpetaDragOver(carpetaId);
    }, []);

    const manejarDragLeave = useCallback(() => {
        setCarpetaDragOver(null);
    }, []);

    /* C338: Crear carpeta */
    const manejarCrearCarpeta = useCallback(() => {
        if (!nuevaCarpetaNombre.trim()) return;
        /* Si hay carpeta activa, crear como subcarpeta */
        crearCarpeta(nuevaCarpetaNombre.trim(), carpetaActiva || undefined);
        setNuevaCarpetaNombre('');
        setCrearCarpetaAbierto(false);
    }, [nuevaCarpetaNombre, carpetaActiva, crearCarpeta]);

    /* C338: Abrir modal mover (desde menú contextual o atajo) */
    const abrirMoverModal = useCallback((sampleId: number) => {
        setSampleParaMover(sampleId);
        setMoverModalAbierto(true);
    }, []);

    /* C338: Mover desde modal */
    const manejarMoverDesdeModal = useCallback(async (primaria: string, subcarpeta = '') => {
        if (!sampleParaMover) return;
        await moverSample(sampleParaMover, primaria, subcarpeta);
        setMoverModalAbierto(false);
        setSampleParaMover(null);
    }, [sampleParaMover, moverSample]);

    /* Focus input crear carpeta al abrirse */
    useEffect(() => {
        if (crearCarpetaAbierto && inputCrearRef.current) {
            inputCrearRef.current.focus();
        }
    }, [crearCarpetaAbierto]);

    /* C338: Combinar carpetas del servidor + carpetas locales */
    const todasCarpetas = useMemo(() => {
        const nombres = new Set(carpetas.map(c => c.primaria));
        const localesFiltradas = carpetasLocales.filter(c => !nombres.has(c.primaria));
        return [...carpetas, ...localesFiltradas];
    }, [carpetas, carpetasLocales]);

    /* Carpeta activa con su info completa (para subcarpetas en el area principal) */
    const carpetaActivaInfo = useMemo(() => {
        if (!carpetaActiva) return null;
        return todasCarpetas.find(c => c.primaria === carpetaActiva) ?? null;
    }, [todasCarpetas, carpetaActiva]);

    /* Subcarpetas visibles en el area principal (cuando hay carpeta activa sin subcarpeta seleccionada) */
    const mostrarSubcarpetasEnArea = carpetaActiva && !subcarpetaActiva && carpetaActivaInfo && carpetaActivaInfo.subcarpetas.length > 0;

    /* C338: Items extendidos del menu contextual con opcion "Mover a carpeta" */
    const menuItemsExtendidos = useMemo(() => {
        if (!menu.estado.sample) return menu.items;
        const itemMover = {
            id: 'moverACarpeta',
            etiqueta: 'Mover a carpeta...',
            onClick: () => {
                if (menu.estado.sample) {
                    abrirMoverModal(menu.estado.sample.id);
                    menu.cerrarMenu();
                }
            },
        };
        /* Insertar despues de "coleccion" si existe, si no al final */
        const idx = menu.items.findIndex(i => i.id === 'coleccion');
        if (idx >= 0) {
            const copia = [...menu.items];
            copia.splice(idx + 1, 0, itemMover);
            return copia;
        }
        return [...menu.items, itemMover];
    }, [menu.items, menu.estado.sample, menu.cerrarMenu, abrirMoverModal]);

    if (cargando && samples.length === 0) {
        return (
            <div className="explorador" id="seccionExplorador">
                <div className="exploradorCargando">Cargando explorador...</div>
            </div>
        );
    }

    const totalGeneral = todasCarpetas.reduce((acc, c) => acc + c.total, 0);

    return (
        <div className="explorador" id="seccionExplorador">
            {/* Boton volver a libreria */}
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

            {/* Breadcrumbs de navegacion: Todas > Carpeta > Subcarpeta */}
            {carpetaActiva && (
                <div className="exploradorBreadcrumbs">
                    <button
                        className="exploradorBreadcrumbItem"
                        onClick={() => seleccionarCarpeta('')}
                        type="button"
                    >
                        <ChevronLeft size={14} />
                        <span>Todas</span>
                    </button>
                    <span className="exploradorBreadcrumbSeparador">/</span>
                    <button
                        className={`exploradorBreadcrumbItem ${!subcarpetaActiva ? 'exploradorBreadcrumbActivo' : ''}`}
                        onClick={() => seleccionarCarpeta(carpetaActiva)}
                        type="button"
                    >
                        <span>{carpetaActiva}</span>
                    </button>
                    {subcarpetaActiva && (
                        <>
                            <span className="exploradorBreadcrumbSeparador">/</span>
                            <span className="exploradorBreadcrumbItem exploradorBreadcrumbActivo">
                                {subcarpetaActiva}
                            </span>
                        </>
                    )}
                </div>
            )}

            {/* Contenido: carpetas + samples */}
            <div className="exploradorContenido">
                {/* Panel lateral de carpetas (arbol) */}
                <div className="exploradorCarpetas">
                    <div className="exploradorCarpetaCabecera">
                        <h3 className="exploradorCarpetaTitulo">Carpetas</h3>
                        <button
                            className="exploradorCrearCarpetaBtn"
                            onClick={() => setCrearCarpetaAbierto(prev => !prev)}
                            type="button"
                            title="Crear carpeta"
                        >
                            <FolderPlus size={16} />
                        </button>
                    </div>

                    {/* Dialogo crear carpeta inline */}
                    {crearCarpetaAbierto && (
                        <div className="exploradorCrearCarpetaDialog">
                            <input
                                ref={inputCrearRef}
                                className="exploradorCrearCarpetaInput"
                                type="text"
                                placeholder={carpetaActiva ? 'Nombre subcarpeta...' : 'Nombre carpeta...'}
                                value={nuevaCarpetaNombre}
                                onChange={(e) => setNuevaCarpetaNombre(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') manejarCrearCarpeta();
                                    if (e.key === 'Escape') setCrearCarpetaAbierto(false);
                                }}
                                maxLength={100}
                            />
                            <button
                                className="exploradorCrearCarpetaConfirmar"
                                onClick={manejarCrearCarpeta}
                                type="button"
                                disabled={!nuevaCarpetaNombre.trim()}
                            >
                                Crear
                            </button>
                        </div>
                    )}

                    {/* Boton "Todas" */}
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

                    {/* Carpetas primarias con subcarpetas y drop zones */}
                    {todasCarpetas.map((carpeta) => {
                        const estaDesplegada = carpetasDesplegadas.has(carpeta.primaria);
                        const tieneSubcarpetas = carpeta.subcarpetas.length > 0;
                        const esDragOver = carpetaDragOver === carpeta.primaria;

                        return (
                            <div key={carpeta.primaria}>
                                <div
                                    className={`exploradorCarpetaFila ${esDragOver ? 'exploradorCarpetaDragOver' : ''}`}
                                    onDragOver={(e) => manejarDragOver(e, carpeta.primaria)}
                                    onDragLeave={manejarDragLeave}
                                    onDrop={(e) => manejarDropEnCarpeta(e, carpeta.primaria)}
                                >
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

                                {/* Subcarpetas visibles cuando esta desplegada */}
                                {estaDesplegada && tieneSubcarpetas && (
                                    <div className="exploradorSubcarpetas">
                                        {carpeta.subcarpetas.map((sub) => {
                                            const subDragOver = carpetaDragOver === `${carpeta.primaria}/${sub.nombre}`;
                                            return (
                                                <button
                                                    key={sub.nombre}
                                                    className={`exploradorSubcarpetaItem ${carpetaActiva === carpeta.primaria && subcarpetaActiva === sub.nombre ? 'subcarpetaActiva' : ''} ${subDragOver ? 'exploradorCarpetaDragOver' : ''}`}
                                                    onClick={() => seleccionarSubcarpeta(carpeta.primaria, sub.nombre)}
                                                    onDragOver={(e) => manejarDragOver(e, `${carpeta.primaria}/${sub.nombre}`)}
                                                    onDragLeave={manejarDragLeave}
                                                    onDrop={(e) => manejarDropEnCarpeta(e, carpeta.primaria, sub.nombre)}
                                                    type="button"
                                                    title={sub.nombre}
                                                >
                                                    <Folder size={12} />
                                                    <span>{sub.nombre}</span>
                                                    <span className="exploradorCarpetaConteo">{sub.total}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    {todasCarpetas.length === 0 && !cargando && (
                        <div className="exploradorCarpetaVacia">
                            Sin carpetas aún. Descarga o sube samples para empezar.
                        </div>
                    )}
                </div>

                {/* Panel de samples */}
                <div className="exploradorSamples">
                    {/* Subcarpetas como tarjetas navegables en el area principal */}
                    {mostrarSubcarpetasEnArea && (
                        <div className="exploradorSubcarpetasArea">
                            {carpetaActivaInfo.subcarpetas.map((sub) => (
                                <button
                                    key={sub.nombre}
                                    className="exploradorSubcarpetaTarjeta"
                                    onClick={() => seleccionarSubcarpeta(carpetaActiva, sub.nombre)}
                                    type="button"
                                >
                                    <Folder size={20} />
                                    <span className="exploradorSubcarpetaTarjetaNombre">{sub.nombre}</span>
                                    <span className="exploradorSubcarpetaTarjetaConteo">
                                        {sub.total} sample{sub.total !== 1 ? 's' : ''}
                                    </span>
                                </button>
                            ))}
                        </div>
                    )}

                    {samples.length === 0 && !mostrarSubcarpetasEnArea ? (
                        <div className="exploradorVacio">
                            <FolderOpen size={32} />
                            <p>
                                {carpetaActiva
                                    ? `No hay samples en "${subcarpetaActiva || carpetaActiva}".`
                                    : 'Descarga o sube samples para verlos aquí. Se organizarán automáticamente por carpetas.'
                                }
                            </p>
                        </div>
                    ) : vistaActiva === 'cuadricula' ? (
                        <div className="cuadriculaDeSamples">
                            {samples.map((sample) => (
                                <div
                                    key={sample.id}
                                    className="exploradorSampleDraggable"
                                    draggable
                                    onDragStart={(e) => {
                                        e.dataTransfer.setData('sampleId', String(sample.id));
                                        manejarDragStart(sample.id);
                                    }}
                                    onDragEnd={manejarDragEnd}
                                >
                                    <TarjetaSampleCuadricula
                                        sample={sample}
                                        onClickTitulo={manejarClickTitulo}
                                        onMenu={menu.abrirMenu}
                                    />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="listaDeSamples">
                            {samples.map((sample) => (
                                <div
                                    key={sample.id}
                                    className={`exploradorSampleDraggable ${sampleArrastrado === sample.id ? 'exploradorSampleArrastrado' : ''}`}
                                    draggable
                                    onDragStart={(e) => {
                                        e.dataTransfer.setData('sampleId', String(sample.id));
                                        manejarDragStart(sample.id);
                                    }}
                                    onDragEnd={manejarDragEnd}
                                >
                                    <span className="exploradorDragHandle" title="Arrastrar a carpeta">
                                        <GripVertical size={14} />
                                    </span>
                                    <TarjetaSample
                                        sample={sample}
                                        onLike={manejarLike}
                                        onMenu={menu.abrirMenu}
                                        onClickCreador={(u) => navegar(`/perfil/${u}`)}
                                        onClickTitulo={manejarClickTitulo}
                                        onComentar={manejarComentar}
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* C338: Modal "Mover a" para seleccionar carpeta destino */}
            {moverModalAbierto && (
                <div className="exploradorModalOverlay" onClick={() => setMoverModalAbierto(false)}>
                    <div className="exploradorModalContenido" onClick={(e) => e.stopPropagation()}>
                        <h3 className="exploradorModalTitulo">Mover a carpeta</h3>
                        <div className="exploradorModalLista">
                            {todasCarpetas.map((c) => (
                                <div key={c.primaria}>
                                    <button
                                        className="exploradorModalItem"
                                        onClick={() => manejarMoverDesdeModal(c.primaria)}
                                        type="button"
                                    >
                                        <Folder size={16} />
                                        <span>{c.primaria}</span>
                                    </button>
                                    {c.subcarpetas.map((sub) => (
                                        <button
                                            key={sub.nombre}
                                            className="exploradorModalItem exploradorModalSubItem"
                                            onClick={() => manejarMoverDesdeModal(c.primaria, sub.nombre)}
                                            type="button"
                                        >
                                            <Folder size={12} />
                                            <span>{sub.nombre}</span>
                                        </button>
                                    ))}
                                </div>
                            ))}
                        </div>
                        <button
                            className="exploradorModalCerrar"
                            onClick={() => setMoverModalAbierto(false)}
                            type="button"
                        >
                            Cancelar
                        </button>
                    </div>
                </div>
            )}

            {/* Menu contextual global */}
            <MenuContextual
                abierto={menu.estado.abierto}
                onCerrar={menu.cerrarMenu}
                items={menuItemsExtendidos}
                x={menu.estado.x}
                y={menu.estado.y}
            />
        </div>
    );
};

export const ExploradorIsland = conAutenticacion(ExploradorBase as React.ComponentType<Record<string, unknown>>);
export default ExploradorIsland;