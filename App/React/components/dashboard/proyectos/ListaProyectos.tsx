/*
 * ListaProyectos
 * Componente para mostrar y gestionar la lista de proyectos
 * Cuando un proyecto está seleccionado, muestra sus tareas debajo
 */

import {Folder, Plus, ChevronDown, ChevronRight, Settings, Trash2} from 'lucide-react';
import {DashboardPanel} from '../../shared/DashboardPanel';
import {SeccionEncabezado} from '../SeccionEncabezado';
import {ListaTareas} from '../ListaTareas';
import type {Proyecto, Tarea, DatosEdicionTarea} from '../../../types/dashboard';

interface ListaProyectosProps {
    proyectos: Proyecto[];
    tareas: Tarea[];
    onCrearProyecto: () => void;
    onSeleccionarProyecto?: (id: number | null) => void;
    proyectoSeleccionadoId?: number | null;
    onEditarProyecto?: (proyecto: Proyecto) => void;
    onEliminarProyecto?: (id: number) => void;
    onToggleTarea: (id: number) => void;
    onCrearTarea: (datos: DatosEdicionTarea) => void;
    onEditarTarea: (id: number, datos: DatosEdicionTarea) => void;
    onEliminarTarea: (id: number) => void;
    onReordenarTareas: (tareas: Tarea[]) => void;
}

interface ProyectoItemProps {
    proyecto: Proyecto;
    activo: boolean;
    tareasProyecto: Tarea[];
    onToggle: () => void;
    onEditar?: () => void;
    onEliminar?: () => void;
    onToggleTarea: (id: number) => void;
    onCrearTarea: (datos: DatosEdicionTarea) => void;
    onEditarTarea: (id: number, datos: DatosEdicionTarea) => void;
    onEliminarTarea: (id: number) => void;
    onReordenarTareas: (tareas: Tarea[]) => void;
}

function ProyectoItem({proyecto, activo, tareasProyecto, onToggle, onEditar, onEliminar, onToggleTarea, onCrearTarea, onEditarTarea, onEliminarTarea, onReordenarTareas}: ProyectoItemProps): JSX.Element {
    const tareasCompletadas = tareasProyecto.filter(t => t.completado).length;
    const totalTareas = tareasProyecto.length;

    return (
        <div className={`proyectoItemWrapper ${activo ? 'proyectoItemWrapperActivo' : ''}`}>
            <div className={`proyectoItem ${activo ? 'proyectoItemActivo' : ''}`} onClick={onToggle}>
                <div className="proyectoItemChevron">{activo ? <ChevronDown size={14} /> : <ChevronRight size={14} />}</div>

                <div className="proyectoItemContenido">
                    <span className="proyectoNombre">{proyecto.nombre}</span>
                    <div className="proyectoMeta">
                        <span className={`etiquetaPrioridad etiqueta${proyecto.prioridad.charAt(0).toUpperCase() + proyecto.prioridad.slice(1)}`}>{proyecto.prioridad.toUpperCase()}</span>
                        <span>•</span>
                        <span>{totalTareas > 0 ? `${tareasCompletadas}/${totalTareas}` : 'Sin tareas'}</span>
                    </div>
                </div>

                <div className="proyectoProgreso" data-estado={proyecto.estado}>
                    <div className="barraProgresoFondo">
                        <div className="barraProgresoRelleno" style={{width: totalTareas > 0 ? `${(tareasCompletadas / totalTareas) * 100}%` : '0%'}} />
                    </div>
                </div>

                {/* Acciones que solo aparecen cuando está activo */}
                {activo && (
                    <div className="proyectoAcciones" onClick={e => e.stopPropagation()}>
                        <button className="botonIcono" onClick={onEditar} title="Editar proyecto">
                            <Settings size={12} />
                        </button>
                        <button className="botonIcono botonPeligro" onClick={onEliminar} title="Eliminar proyecto">
                            <Trash2 size={12} />
                        </button>
                    </div>
                )}
            </div>

            {/* Tareas del proyecto (solo cuando está activo) */}
            {activo && (
                <div className="proyectoTareas">
                    <ListaTareas tareas={tareasProyecto} proyectoId={proyecto.id} onToggleTarea={onToggleTarea} onCrearTarea={onCrearTarea} onEditarTarea={onEditarTarea} onEliminarTarea={onEliminarTarea} onReordenarTareas={onReordenarTareas} />
                </div>
            )}
        </div>
    );
}

export function ListaProyectos({proyectos, tareas, onCrearProyecto, onSeleccionarProyecto, proyectoSeleccionadoId, onEditarProyecto, onEliminarProyecto, onToggleTarea, onCrearTarea, onEditarTarea, onEliminarTarea, onReordenarTareas}: ListaProyectosProps): JSX.Element {
    /* Toggle: si ya está seleccionado, deseleccionar */
    const toggleProyecto = (id: number) => {
        if (proyectoSeleccionadoId === id) {
            onSeleccionarProyecto?.(null);
        } else {
            onSeleccionarProyecto?.(id);
        }
    };

    return (
        <>
            <SeccionEncabezado
                titulo="Proyectos"
                icono={<Folder size={12} />}
                acciones={
                    <button className="botonIcono" onClick={onCrearProyecto} title="Nuevo Proyecto">
                        <Plus size={14} />
                    </button>
                }
            />
            <DashboardPanel>
                <div className="listaProyectos">
                    {proyectos.map(proyecto => {
                        const tareasProyecto = tareas.filter(t => t.proyectoId === proyecto.id);
                        return <ProyectoItem key={proyecto.id} proyecto={proyecto} activo={proyecto.id === proyectoSeleccionadoId} tareasProyecto={tareasProyecto} onToggle={() => toggleProyecto(proyecto.id)} onEditar={() => onEditarProyecto?.(proyecto)} onEliminar={() => onEliminarProyecto?.(proyecto.id)} onToggleTarea={onToggleTarea} onCrearTarea={onCrearTarea} onEditarTarea={onEditarTarea} onEliminarTarea={onEliminarTarea} onReordenarTareas={onReordenarTareas} />;
                    })}

                    {proyectos.length === 0 && (
                        <div className="estadoVacio">
                            <span>No hay proyectos activos</span>
                            <button className="botonTexto" onClick={onCrearProyecto}>
                                + Crear primer proyecto
                            </button>
                        </div>
                    )}
                </div>
            </DashboardPanel>
        </>
    );
}
