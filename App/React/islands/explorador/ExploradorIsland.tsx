/*
 * ExploradorIsland — Kamples (C281 + C349)
 * Página /explorador: vista tipo file-manager real para samples coleccionados.
 * Raíz muestra carpetas + archivos sueltos. Click en carpeta entra al nivel inferior.
 * Sidebar colapsable oculto por defecto. Barra de herramientas con breadcrumbs.
 * Lógica en useExploradorIsland, carpetas en ArbolCarpetas, modal en ModalMoverCarpeta.
 */

import { useCallback } from 'react';
import { FolderOpen, GripVertical } from 'lucide-react';
import { TarjetaSample } from '@app/components/ui/TarjetaSample';
import { TarjetaSampleCuadricula } from '@app/components/ui/TarjetaSampleCuadricula';
import { MenuContextual } from '@app/components/ui/MenuContextual';
import { SyncBadge } from '@app/components/ui/SyncBadge';
import { CampoTexto } from '@app/components/ui/CampoTexto';
import { SkeletonFeed } from '@app/components/skeletons';
import { conAutenticacion } from '@app/components/auth/ConAutenticacion';
import { useExploradorIsland } from '@app/hooks/useExploradorIsland';
import { ArbolCarpetas } from '@app/components/explorador/ArbolCarpetas';
import { TarjetaCarpeta } from '@app/components/explorador/TarjetaCarpeta';
import { BarraHerramientasExplorador } from '@app/components/explorador/BarraHerramientasExplorador';
import { ModalMoverCarpeta } from '@app/components/explorador/ModalMoverCarpeta';
import { EstadoVacio } from '@app/components/ui/EstadoVacio';
import { useFiltrosStore } from '@app/stores/filtrosStore';
import '../../styles/componentes/explorador.css';
import '../../styles/componentes/exploradorDragModal.css';

const ExploradorBase = (): JSX.Element => {
    const {
        samples,
        cargando,
        carpetaActiva,
        subcarpetaActiva,
        carpetasDesplegadas,
        carpetaDragOver,
        sampleArrastrado,
        navegar,
        menu,
        vistaActiva,
        setVistaActiva,
        crearCarpetaAbierto,
        setCrearCarpetaAbierto,
        nuevaCarpetaNombre,
        setNuevaCarpetaNombre,
        moverModalAbierto,
        setMoverModalAbierto,
        sidebarAbierto,
        toggleSidebar,
        inputCrearRef,
        manejarComentar,
        manejarDragStart,
        manejarDragEnd,
        manejarDropEnCarpeta,
        manejarDragOver,
        manejarDragLeave,
        manejarCrearCarpeta,
        manejarMoverDesdeModal,
        manejarLike,
        manejarRestaurarTodos,
        todasCarpetas,
        carpetasVisibles,
        breadcrumbSegmentos,
        menuItemsExtendidos,
        totalGeneral,
        seleccionarCarpeta,
        seleccionarSubcarpeta,
        toggleDesplegada,
    } = useExploradorIsland();

    /* [193A-30] Búsqueda por tag en explorador */
    const manejarBuscarTag = useCallback((tag: string) => {
        useFiltrosStore.getState().setBusqueda(tag);
    }, []);

    if (cargando && samples.length === 0) {
        return (
            <div className="explorador" id="seccionExplorador">
                <SkeletonFeed cantidad={6} />
            </div>
        );
    }

    const tieneCarpetas = carpetasVisibles.length > 0;
    const tieneArchivos = samples.length > 0;

    return (
        <div className="explorador" id="seccionExplorador">
            {/* Barra de herramientas: sidebar toggle + breadcrumbs + controles */}
            <BarraHerramientasExplorador
                segmentos={breadcrumbSegmentos}
                vistaActiva={vistaActiva}
                onCambiarVista={setVistaActiva}
                onCrearCarpeta={() => setCrearCarpetaAbierto(prev => !prev)}
                onToggleSidebar={toggleSidebar}
                onRestaurarTodos={manejarRestaurarTodos}
                sidebarAbierto={sidebarAbierto}
            />

            <div className={`exploradorContenido ${sidebarAbierto ? 'exploradorConSidebar' : ''}`}>
                {/* Sidebar: árbol de carpetas, visible solo cuando sidebarAbierto es true */}
                {sidebarAbierto && (
                    <ArbolCarpetas
                        todasCarpetas={todasCarpetas}
                        carpetaActiva={carpetaActiva}
                        subcarpetaActiva={subcarpetaActiva}
                        carpetasDesplegadas={carpetasDesplegadas}
                        carpetaDragOver={carpetaDragOver}
                        cargando={cargando}
                        crearCarpetaAbierto={crearCarpetaAbierto}
                        nuevaCarpetaNombre={nuevaCarpetaNombre}
                        inputCrearRef={inputCrearRef}
                        totalGeneral={totalGeneral}
                        seleccionarCarpeta={seleccionarCarpeta}
                        seleccionarSubcarpeta={seleccionarSubcarpeta}
                        toggleDesplegada={toggleDesplegada}
                        setCrearCarpetaAbierto={setCrearCarpetaAbierto}
                        setNuevaCarpetaNombre={setNuevaCarpetaNombre}
                        manejarCrearCarpeta={manejarCrearCarpeta}
                        manejarDragOver={manejarDragOver}
                        manejarDragLeave={manejarDragLeave}
                        manejarDropEnCarpeta={manejarDropEnCarpeta}
                    />
                )}

                {/* Área principal: carpetas del nivel actual + samples */}
                <div className="exploradorSamples">
                    {/* Formulario crear carpeta inline (se muestra al pulsar FolderPlus en barra) */}
                    {crearCarpetaAbierto && !sidebarAbierto && (
                        <div className="exploradorCrearCarpetaDialog">
                            <CampoTexto
                                ref={inputCrearRef}
                                className="exploradorCrearCarpetaInput"
                                type="text"
                                placeholder={carpetaActiva ? 'Nombre subcarpeta...' : 'Nombre carpeta...'}
                                value={nuevaCarpetaNombre}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNuevaCarpetaNombre(e.target.value)}
                                onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                                    if (e.key === 'Enter') manejarCrearCarpeta();
                                    if (e.key === 'Escape') setCrearCarpetaAbierto(false);
                                }}
                                maxLength={100}
                            />
                        </div>
                    )}

                    {/* Grid de carpetas del nivel actual */}
                    {tieneCarpetas && (
                        <div className={`exploradorCarpetasGrilla ${carpetaActiva ? 'exploradorSubcarpetasAlineadas' : ''}`}>
                            {carpetasVisibles.map((c) => (
                                <TarjetaCarpeta
                                    key={c.nombre}
                                    nombre={c.nombre}
                                    totalItems={c.total}
                                    esDragOver={carpetaDragOver === (c.esSubcarpeta ? `${carpetaActiva}/${c.nombre}` : c.nombre)}
                                    onClick={() => {
                                        if (c.esSubcarpeta) {
                                            seleccionarSubcarpeta(carpetaActiva, c.nombre);
                                        } else {
                                            seleccionarCarpeta(c.nombre);
                                        }
                                    }}
                                    onDragOver={(e) => manejarDragOver(e, c.esSubcarpeta ? `${carpetaActiva}/${c.nombre}` : c.nombre)}
                                    onDragLeave={manejarDragLeave}
                                    onDrop={(e) => {
                                        if (c.esSubcarpeta) {
                                            manejarDropEnCarpeta(e, carpetaActiva, c.nombre);
                                        } else {
                                            manejarDropEnCarpeta(e, c.nombre);
                                        }
                                    }}
                                />
                            ))}
                        </div>
                    )}

                    {/* Lista/cuadrícula de samples del nivel actual */}
                    {!tieneArchivos && !tieneCarpetas ? (
                        <EstadoVacio
                            icono={<FolderOpen size={32} />}
                            mensaje={carpetaActiva
                                ? `No hay samples en "${subcarpetaActiva || carpetaActiva}".`
                                : 'Descarga o sube samples para verlos aquí. Se organizarán automáticamente por carpetas.'
                            }
                        />
                    ) : vistaActiva === 'cuadricula' ? (
                        <div className="cuadriculaDeSamples">
                            {samples.map((sample) => (
                                <div
                                    key={sample.id}
                                    className={`exploradorSampleDraggable exploradorCuadriculaDraggable ${sampleArrastrado === sample.id ? 'exploradorSampleArrastrado' : ''}`}
                                    draggable
                                    onDragStart={(e) => {
                                        e.dataTransfer.setData('sampleId', String(sample.id));
                                        manejarDragStart(sample.id);
                                    }}
                                    onDragEnd={manejarDragEnd}
                                >
                                    <span className="exploradorDragHandleCuadricula" title="Arrastrar a carpeta">
                                        <GripVertical size={12} />
                                    </span>
                                    <SyncBadge sampleId={sample.id} />
                                    <TarjetaSampleCuadricula
                                        sample={sample}
                                        onMenu={menu.abrirMenu}
                                    />
                                </div>
                            ))}
                        </div>
                    ) : tieneArchivos ? (
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
                                    <SyncBadge sampleId={sample.id} />
                                    <span className="exploradorDragHandle" title="Arrastrar a carpeta">
                                        <GripVertical size={14} />
                                    </span>
                                    <TarjetaSample
                                        sample={sample}
                                        contexto={samples}
                                        onLike={manejarLike}
                                        onMenu={menu.abrirMenu}
                                        onClickCreador={(u) => navegar(`/perfil/${u}`)}
                                        onComentar={manejarComentar}
                                        onFiltrarMeta={manejarBuscarTag}
                                    />
                                </div>
                            ))}
                        </div>
                    ) : null}
                </div>
            </div>

            {moverModalAbierto && (
                <ModalMoverCarpeta
                    todasCarpetas={todasCarpetas}
                    onMover={manejarMoverDesdeModal}
                    onCerrar={() => setMoverModalAbierto(false)}
                />
            )}

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