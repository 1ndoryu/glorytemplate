/*
 * ListaTareas
 * Componente para mostrar la lista de tareas pendientes
 * Responsabilidad única: renderizar tareas con checkbox, input de creación, edición inline y acciones
 * Lógica extraída a useListaTareas hook wrapper
 */

import {Reorder} from 'framer-motion';
import {CheckSquare} from 'lucide-react';
import type {Tarea, DatosEdicionTarea, DatosNuevoHabito, Proyecto, Participante, GrupoTareas} from '../../types/dashboard';
import {TareaItem} from './TareaItem';
import {InputNuevaTarea} from './InputNuevaTarea';
import {PanelConfiguracionTarea} from './PanelConfiguracionTarea';
import {ModalMoverTarea} from './ModalMoverTarea';
import {DashboardPanel} from '../shared/DashboardPanel';
import {EstadoVacio} from '../shared/EstadoVacio';
import {MenuAccionesMasivas} from './lista-tareas/MenuAccionesMasivas';
import {GrupoTareasHeader} from './lista-tareas/GrupoTareasHeader';
import {TareaConColapsador} from './lista-tareas/TareaConColapsador';
import {TareaReorderItem} from './lista-tareas/TareaReorderItem';
import {useListaTareas} from '../../hooks/dashboard/useListaTareas';

interface ListaTareasProps {
    tareas: Tarea[];
    proyectoId?: number;
    onToggleTarea?: (id: number) => void;
    onCrearTarea?: (datos: DatosEdicionTarea) => void;
    onEditarTarea?: (id: number, datos: DatosEdicionTarea) => void;
    onEliminarTarea?: (id: number) => void;
    onReordenarTareas?: (tareas: Tarea[]) => void;
    habilitarDrag?: boolean;
    proyectos?: Proyecto[];
    ocultarCompletadas?: boolean;
    ocultarBadgeProyecto?: boolean;
    /* Ocultar subtareas automáticamente (colapsadas por defecto) */
    ocultarSubtareasAutomaticamente?: boolean;
    onCompartirTarea?: (tarea: Tarea) => void;
    estaCompartida?: (tareaId: number) => boolean;
    obtenerParticipantes?: (tarea: Tarea) => Participante[];
    /* Callbacks para hábitos - Sincronizado con TablaHabitos (Fase UI/UX) */
    onEditarHabito?: (habitoId: number) => void;
    onEliminarHabito?: (habitoId: number) => void;
    onToggleHabito?: (habitoId: number) => void;
    onPosponerHabito?: (habitoId: number) => void;
    onPosponerHabitoConTiempo?: (habitoId: number, hasta: string | null) => void;
    onPausarHabito?: (habitoId: number) => void;
    onActualizarHabito?: (habitoId: number, datos: Partial<DatosNuevoHabito>) => void;
    /* [207A-3] Callbacks para subhábitos */
    onToggleSubHabito?: (habitoPadreId: number, subHabitoId: number) => void;
    onEliminarSubHabito?: (habitoPadreId: number, subHabitoId: number) => void;
    /* [217A-2] Subhábitos: acciones independientes */
    onPosponerSubHabitoConTiempo?: (habitoPadreId: number, subHabitoId: number, hasta: string | null) => void;
    onActualizarSubHabito?: (habitoPadreId: number, subHabitoId: number, datos: Partial<DatosNuevoHabito>) => void;
    onConfigurarSubHabito?: (habitoPadreId: number, subHabitoId: number) => void;
    modoCompacto?: boolean;
    onConfigurarTarea?: (tarea: Tarea) => void;
    /* Callback para abrir modal de creación rápida (usado en estado vacío y botón añadir) */
    onAbrirModalCrear?: () => void;
    /* [207A-4] Callback para abrir modal de creación de hábito desde areaNuevoInline */
    onAbrirModalCrearHabito?: () => void;
    /* Ocultar placeholder vacío completo (útil dentro de proyectos expandidos) */
    ocultarPlaceholderVacio?: boolean;
    /* [218A-2] Callback para actualizar orden de hábitos desde drag */
    onReordenarHabitos?: (ordenes: Map<number, number>) => void;
}

export function ListaTareas({tareas, proyectoId, onToggleTarea, onCrearTarea, onEditarTarea, onEliminarTarea, onReordenarTareas, habilitarDrag = true, proyectos = [], ocultarCompletadas = false, ocultarBadgeProyecto = false, ocultarSubtareasAutomaticamente = false, onCompartirTarea, estaCompartida, obtenerParticipantes, onEditarHabito, onEliminarHabito, onToggleHabito, onPosponerHabito, onPosponerHabitoConTiempo, onPausarHabito, onActualizarHabito, onToggleSubHabito, onEliminarSubHabito, onPosponerSubHabitoConTiempo, onActualizarSubHabito, onConfigurarSubHabito, modoCompacto = false, onConfigurarTarea,    onAbrirModalCrear, onAbrirModalCrearHabito, ocultarPlaceholderVacio = false, onReordenarHabitos}: ListaTareasProps): JSX.Element {
    const {
        pendientes, completadas,
        estaSeleccionada, manejarSeleccionMultiple, manejarClickDerechoLista,
        modoSeleccionActivo, menuPosicion, ocultarMenu, limpiarSeleccion,
        seccionesActivas, gruposOrdenados, manejarAgrupar,
        tareasExpandidas, tareaConfigurando, setTareaConfigurando,
        tareaMoviendo, setTareaMoviendo,
        toggleColapsar, abrirConfiguracion, guardarConfiguracion,
        handleIndent, handleOutdent, handleCrearNueva,
        handleMoverProyecto, obtenerSubtareasVisibles,
        tareaArrastrandoId, esGestoSubtarea, setEsGestoSubtarea,
        dragStartXRef, dragCurrentXRef,
        handleDragStart, handleDragEnd, handleReorder,
        UMBRAL_INDENT, seArrastroRef,
        tareasPrincipalesPendientes,
        tareasSinGrupo, tareasPorGrupo,
        mensajesNoLeidosPorTarea,
        crearTareaConProyecto
    } = useListaTareas({
        tareas, proyectoId, onEditarTarea, onCrearTarea, onEliminarTarea,
        onReordenarTareas, onConfigurarTarea, onToggleTarea,
        ocultarSubtareasAutomaticamente, onReordenarHabitos
    });

    /* Renderizado de Tarea Individual (Wrapper común) */
    const renderTareaItem = (tarea: Tarea, esSubtarea: boolean) => (
        <TareaConColapsador
            key={`wrapper-${tarea.id}`}
            tarea={tarea}
            esSubtarea={esSubtarea}
            tareas={pendientes}
            tareasExpandidas={tareasExpandidas}
            onToggleExpandir={toggleColapsar}
            proyectos={proyectos}
            modoCompacto={modoCompacto}
            ocultarBadgeProyecto={ocultarBadgeProyecto}
            mensajesNoLeidos={mensajesNoLeidosPorTarea[tarea.id] || 0}
            estaCompartida={estaCompartida?.(tarea.id) ?? false}
            // Acciones
            onToggleTarea={onToggleTarea}
            onEditarTarea={onEditarTarea}
            onEliminarTarea={onEliminarTarea}
            onIndent={handleIndent}
            onOutdent={handleOutdent}
            onCrearNueva={handleCrearNueva}
            onConfigurar={abrirConfiguracion}
            onMoverProyecto={t => setTareaMoviendo(t)}
            onCompartir={onCompartirTarea}
            // Hábitos - Sincronizado con TablaHabitos
            onEditarHabito={onEditarHabito}
            onEliminarHabito={onEliminarHabito}
            onToggleHabito={onToggleHabito}
            onPosponerHabito={onPosponerHabito}
            onPosponerHabitoConTiempo={onPosponerHabitoConTiempo}
            onPausarHabito={onPausarHabito}
            onActualizarHabito={onActualizarHabito}
            /* [207A-3] Subhábitos */
            onToggleSubHabito={onToggleSubHabito}
            onEliminarSubHabito={onEliminarSubHabito}
            /* [217A-2] Subhábitos: acciones independientes */
            onPosponerSubHabitoConTiempo={onPosponerSubHabitoConTiempo}
            onActualizarSubHabito={onActualizarSubHabito}
            onConfigurarSubHabito={onConfigurarSubHabito}
            // Suprimir click tras drag - [218A-2]
            suprimirClickRef={seArrastroRef}
            // Selección múltiple - TAREA 3.1
            estaSeleccionada={estaSeleccionada(tarea.id)}
            onSeleccionMultiple={manejarSeleccionMultiple}
            modoSeleccionActivo={modoSeleccionActivo}
        />
    );

    /* Función auxiliar para renderizar tareas de un grupo con sus subtareas */
    const renderTareasGrupo = (tareasDelGrupo: Tarea[]) => (
        <>
            {tareasDelGrupo.map(tareaPadre => {
                const subtareasVisibles = obtenerSubtareasVisibles(tareaPadre.id);
                return (
                    <div key={tareaPadre.id} className="tareaPadreContenedor">
                        {renderTareaItem(tareaPadre, false)}
                        {subtareasVisibles.map(subtarea => (
                            <div key={subtarea.id} className="subtareaContenedor">
                                {renderTareaItem(subtarea, true)}
                            </div>
                        ))}
                    </div>
                );
            })}
        </>
    );

    return (
        <DashboardPanel id="lista-tareas" onContextMenu={manejarClickDerechoLista}>
            {/* Estado vacío cuando no hay tareas (ocultar en proyectos expandidos) */}
            {tareas.length === 0 && !ocultarPlaceholderVacio ? (
                <EstadoVacio icono={<CheckSquare size={32} />} mensaje="No hay tareas pendientes" descripcion="Crea tu primera tarea para empezar" textoBoton="+ Crear tarea" onAccion={onAbrirModalCrear ?? (() => onCrearTarea?.({texto: 'Nueva tarea'}))} />
            ) : tareas.length > 0 ? (
                <>
                    {/* Renderizar grupos cuando las secciones están activas */}
                    {seccionesActivas && gruposOrdenados.length > 0 && (
                        <div className="listaTareasGrupos">
                            {gruposOrdenados.map((grupo: GrupoTareas) => {
                                const tareasDelGrupo = tareasPorGrupo.get(grupo.id) || [];
                                return (
                                    <div key={grupo.id} className="grupoTareasContenedor">
                                        <GrupoTareasHeader grupo={grupo} cantidadTareas={tareasDelGrupo.length} />
                                        {!grupo.colapsado && tareasDelGrupo.length > 0 && <div className="grupoTareasListaInterna">{renderTareasGrupo(tareasDelGrupo)}</div>}
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Tareas sin grupo (o todas si secciones desactivadas) */}
                    {habilitarDrag ? (
                        <>                            <Reorder.Group axis="y" values={seccionesActivas ? tareasSinGrupo : tareasPrincipalesPendientes} onReorder={handleReorder} className="listaTareasPendientes" onContextMenu={manejarClickDerechoLista} as="div">
                                {(seccionesActivas ? tareasSinGrupo : tareasPrincipalesPendientes).map(tareaPadre => (
                                    <TareaReorderItem
                                        key={tareaPadre.id}
                                        tareaPadre={tareaPadre}
                                        subtareasVisibles={obtenerSubtareasVisibles(tareaPadre.id)}
                                        tareaArrastrandoId={tareaArrastrandoId}
                                        esGestoSubtarea={esGestoSubtarea}
                                        UMBRAL_INDENT={UMBRAL_INDENT}
                                        seArrastroRef={seArrastroRef}
                                        dragStartXRef={dragStartXRef}
                                        dragCurrentXRef={dragCurrentXRef}
                                        setEsGestoSubtarea={setEsGestoSubtarea}
                                        handleDragStart={handleDragStart}
                                        handleDragEnd={handleDragEnd}
                                        renderTareaItem={renderTareaItem}
                                    />
                                ))}
                            </Reorder.Group>

                            {/* [044A-1] Hábitos ahora se incluyen dentro del Reorder.Group
                             * via tareasPrincipalesPendientes. Ya no se renderizan por separado. */}
                        </>
                    ) : (
                        <div className="listaTareasPendientes">
                            {pendientes
                                .filter(t => !t.parentId)
                                .map(tareaPadre => {
                                    const subtareasVisibles = obtenerSubtareasVisibles(tareaPadre.id);
                                    return (
                                        <div key={tareaPadre.id} className="tareaPadreContenedor">
                                            {renderTareaItem(tareaPadre, false)}
                                            {subtareasVisibles.map(subtarea => (
                                                <div key={subtarea.id} className="subtareaContenedor">
                                                    {renderTareaItem(subtarea, true)}
                                                </div>
                                            ))}
                                        </div>
                                    );
                                })}
                        </div>
                    )}

                    {pendientes.length > 0 && completadas.length > 0 && !ocultarCompletadas && <div className="listaTareasSeparador" />}

                    {!ocultarCompletadas && completadas.map(tarea => <TareaItem key={tarea.id} tarea={tarea} esSubtarea={!!tarea.parentId} onToggle={() => onToggleTarea?.(tarea.id)} onEditar={datos => onEditarTarea?.(tarea.id, datos)} onEliminar={() => onEliminarTarea?.(tarea.id)} onConfigurar={() => abrirConfiguracion(tarea.id)} nombreProyecto={tarea.proyectoId ? proyectos?.find(p => p.id === tarea.proyectoId)?.nombre : undefined} soloIconoProyecto={ocultarBadgeProyecto} onMoverProyecto={() => setTareaMoviendo(tarea)} onCompartir={() => onCompartirTarea?.(tarea)} estaCompartida={estaCompartida?.(tarea.id) ?? false} mensajesNoLeidos={mensajesNoLeidosPorTarea[tarea.id] || 0} modoCompacto={modoCompacto} />)}

                    {onCrearTarea && <InputNuevaTarea onCrear={crearTareaConProyecto} onAbrirModalCrear={onAbrirModalCrear} onAbrirModalCrearHabito={onAbrirModalCrearHabito} />}
                </>
            ) : (
                /* Tareas vacías dentro de proyecto: solo mostrar botón añadir */
                onCrearTarea && <InputNuevaTarea onCrear={crearTareaConProyecto} onAbrirModalCrear={onAbrirModalCrear} onAbrirModalCrearHabito={onAbrirModalCrearHabito} />
            )}

            {tareaConfigurando && (
                <PanelConfiguracionTarea
                    tarea={tareaConfigurando}
                    estaAbierto={true}
                    onCerrar={() => setTareaConfigurando(null)}
                    onGuardar={guardarConfiguracion}
                    participantes={obtenerParticipantes ? obtenerParticipantes(tareaConfigurando) : []}
                    proyectos={proyectos}
                    onCambiarProyecto={nuevoProyectoId => {
                        if (onEditarTarea) {
                            onEditarTarea(tareaConfigurando.id, {proyectoId: nuevoProyectoId, parentId: undefined});
                        }
                    }}
                    onToggleCompletado={completado => {
                        if (completado !== tareaConfigurando.completado) {
                            onToggleTarea?.(tareaConfigurando.id);
                            setTareaConfigurando({...tareaConfigurando, completado});
                        }
                    }}
                />
            )}

            <ModalMoverTarea estaAbierto={!!tareaMoviendo} onCerrar={() => setTareaMoviendo(null)} onMover={handleMoverProyecto} proyectos={proyectos} proyectoActualId={tareaMoviendo?.proyectoId} />

            {/* Menú de acciones masivas - TAREA 3.1 */}
            {menuPosicion && (
                <MenuAccionesMasivas
                    posicionX={menuPosicion.x}
                    posicionY={menuPosicion.y}
                    onCerrar={ocultarMenu}
                    onEliminarTareas={ids => {
                        ids.forEach(id => onEliminarTarea?.(id));
                        limpiarSeleccion();
                    }}
                    onCambiarPrioridad={(ids, prioridad) => {
                        ids.forEach(id => onEditarTarea?.(id, {prioridad}));
                        limpiarSeleccion();
                    }}
                    onCambiarUrgencia={(ids, urgencia) => {
                        ids.forEach(id => onEditarTarea?.(id, {urgencia}));
                        limpiarSeleccion();
                    }}
                    onMoverProyecto={(ids, proyectoId) => {
                        ids.forEach(id => onEditarTarea?.(id, {proyectoId}));
                        limpiarSeleccion();
                    }}
                    onAgrupar={seccionesActivas ? manejarAgrupar : undefined}
                    proyectos={proyectos}
                />
            )}
        </DashboardPanel>
    );
}
