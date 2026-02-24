/*
 * ExploradorIsland — Kamples (C281)
 * Página /explorador: vista tipo file-explorer para samples coleccionados.
 * Lógica en useExploradorIsland, carpetas en ArbolCarpetas, modal en ModalMoverCarpeta.
 */

import { FolderOpen, ArrowLeft, Folder, LayoutGrid, List, ChevronLeft, GripVertical } from 'lucide-react';
import { BotonBase } from '@app/components/ui/BotonBase';
import { TarjetaSample } from '@app/components/ui/TarjetaSample';
import { TarjetaSampleCuadricula } from '@app/components/ui/TarjetaSampleCuadricula';
import { MenuContextual } from '@app/components/ui/MenuContextual';
import { SyncBadge } from '@app/components/ui/SyncBadge';
import { conAutenticacion } from '@app/components/auth/ConAutenticacion';
import { obtenerImagenColor } from '@app/services/imagenesColor';
import { useExploradorIsland } from '@app/hooks/useExploradorIsland';
import { ArbolCarpetas } from '@app/components/explorador/ArbolCarpetas';
import { ModalMoverCarpeta } from '@app/components/explorador/ModalMoverCarpeta';
import '../../styles/componentes/explorador.css';
import '../../styles/componentes/exploradorDragModal.css';

const ExploradorBase = (): JSX.Element => {
    const {
        samples,
        cargando,
        carpetaActiva,
        subcarpetaActiva,
        totalSamples,
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
        inputCrearRef,
        manejarClickTitulo,
        manejarComentar,
        manejarDragStart,
        manejarDragEnd,
        manejarDropEnCarpeta,
        manejarDragOver,
        manejarDragLeave,
        manejarCrearCarpeta,
        manejarMoverDesdeModal,
        manejarLike,
        todasCarpetas,
        carpetaActivaInfo,
        mostrarSubcarpetasEnArea,
        menuItemsExtendidos,
        totalGeneral,
        seleccionarCarpeta,
        seleccionarSubcarpeta,
        toggleDesplegada,
    } = useExploradorIsland();

    if (cargando && samples.length === 0) {
        return (
            <div className="explorador" id="seccionExplorador">
                <div className="exploradorCargando">Cargando explorador...</div>
            </div>
        );
    }

    return (
        <div className="explorador" id="seccionExplorador">
            <BotonBase variante="ghost" className="coleccionVolver" onClick={() => navegar('/libreria/')} type="button">
                <ArrowLeft size={18} />
                <span>Librería</span>
            </BotonBase>

            <div className="exploradorHeader">
                <img className="exploradorHeaderImg" src={obtenerImagenColor(2001)} alt="Explorador" />
                <div className="exploradorHeaderInfo">
                    <h1 className="exploradorNombre">Explorador</h1>
                    <div className="exploradorMeta">
                        <span>{totalSamples} sample{totalSamples !== 1 ? 's' : ''} coleccionados</span>
                    </div>
                </div>
                <div className="exploradorVistaToggle">
                    <BotonBase
                        variante="ghost"
                        soloIcono
                        className={`exploradorVistaBoton ${vistaActiva === 'lista' ? 'exploradorVistaActiva' : ''}`}
                        onClick={() => setVistaActiva('lista')}
                        type="button"
                        title="Vista lista"
                    >
                        <List size={18} />
                    </BotonBase>
                    <BotonBase
                        variante="ghost"
                        soloIcono
                        className={`exploradorVistaBoton ${vistaActiva === 'cuadricula' ? 'exploradorVistaActiva' : ''}`}
                        onClick={() => setVistaActiva('cuadricula')}
                        type="button"
                        title="Vista cuadrícula"
                    >
                        <LayoutGrid size={18} />
                    </BotonBase>
                </div>
            </div>

            {carpetaActiva && (
                <div className="exploradorBreadcrumbs">
                    <BotonBase variante="ghost" tamano="sm" className="exploradorBreadcrumbItem" onClick={() => seleccionarCarpeta('')} type="button">
                        <ChevronLeft size={14} />
                        <span>Todas</span>
                    </BotonBase>
                    <span className="exploradorBreadcrumbSeparador">/</span>
                    <BotonBase
                        variante="ghost"
                        tamano="sm"
                        className={`exploradorBreadcrumbItem ${!subcarpetaActiva ? 'exploradorBreadcrumbActivo' : ''}`}
                        onClick={() => seleccionarCarpeta(carpetaActiva)}
                        type="button"
                    >
                        <span>{carpetaActiva}</span>
                    </BotonBase>
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

            <div className="exploradorContenido">
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

                <div className="exploradorSamples">
                    {mostrarSubcarpetasEnArea && carpetaActivaInfo && (
                        <div className="exploradorSubcarpetasArea">
                            {carpetaActivaInfo.subcarpetas.map((sub) => (
                                <BotonBase
                                    key={sub.nombre}
                                    variante="ghost"
                                    className="exploradorSubcarpetaTarjeta"
                                    onClick={() => seleccionarSubcarpeta(carpetaActiva, sub.nombre)}
                                    type="button"
                                >
                                    <Folder size={20} />
                                    <span className="exploradorSubcarpetaTarjetaNombre">{sub.nombre}</span>
                                    <span className="exploradorSubcarpetaTarjetaConteo">
                                        {sub.total} sample{sub.total !== 1 ? 's' : ''}
                                    </span>
                                </BotonBase>
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
                                    <SyncBadge sampleId={sample.id} />
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
                                    <SyncBadge sampleId={sample.id} />
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