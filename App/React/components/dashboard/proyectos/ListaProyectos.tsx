/*
 * ListaProyectos
 * Componente para mostrar y gestionar la lista de proyectos
 * Cuando un proyecto está seleccionado, muestra sus tareas debajo
 */

import {useState, useCallback} from 'react';
import {Folder, Plus, ChevronDown, ChevronRight, Calendar, Edit, Trash2, PlayCircle, PauseCircle, CheckCircle, Share2, Users} from 'lucide-react';
import {DashboardPanel} from '../../shared/DashboardPanel';
import {SeccionEncabezado} from '../SeccionEncabezado';
import {ListaTareas} from '../ListaTareas';
import {MenuContextual} from '../../shared/MenuContextual';
import {BadgeInfo, BadgeGroup} from '../../shared/BadgeInfo';
import {AccionesItem} from '../../shared/AccionesItem';
import type {Proyecto, Tarea, DatosEdicionTarea} from '../../../types/dashboard';
import type {OpcionMenu} from '../../shared/MenuContextual';
import {obtenerTextoFechaLimite, obtenerVarianteFechaLimite, formatearFechaCorta} from '../../../utils/fecha';

interface MenuContextoProyecto {
    visible: boolean;
    x: number;
    y: number;
    proyectoId: number | null;
}

interface ListaProyectosProps {
    proyectos: Proyecto[];
    tareas: Tarea[];
    onCrearProyecto: () => void;
    onSeleccionarProyecto?: (id: number | null) => void;
    proyectoSeleccionadoId?: number | null;
    onEditarProyecto?: (proyecto: Proyecto) => void;
    onEliminarProyecto?: (id: number) => void;
    onCambiarEstadoProyecto?: (id: number, estado: 'activo' | 'completado' | 'pausado') => void;
    onCompartirProyecto?: (proyecto: Proyecto) => void;
    estaCompartido?: (proyectoId: number) => boolean;
    onToggleTarea: (id: number) => void;
    onCrearTarea: (datos: DatosEdicionTarea) => void;
    onEditarTarea: (id: number, datos: DatosEdicionTarea) => void;
    onEliminarTarea: (id: number) => void;
    onReordenarTareas: (tareas: Tarea[]) => void;
    ocultarCompletados?: boolean;
    ordenDefecto?: 'nombre' | 'fecha' | 'prioridad';
    mostrarProgreso?: boolean;
}

interface ProyectoItemProps {
    proyecto: Proyecto;
    activo: boolean;
    tareasProyecto: Tarea[];
    estaCompartido?: boolean;
    onToggle: () => void;
    onEditar?: () => void;
    onEliminar?: () => void;
    onContextMenu?: (e: React.MouseEvent) => void;
    onToggleTarea: (id: number) => void;
    onCrearTarea: (datos: DatosEdicionTarea) => void;
    onEditarTarea: (id: number, datos: DatosEdicionTarea) => void;
    onEliminarTarea: (id: number) => void;
    onReordenarTareas: (tareas: Tarea[]) => void;
    mostrarProgreso?: boolean;
}

function ProyectoItem({proyecto, activo, tareasProyecto, estaCompartido = false, onToggle, onEditar, onEliminar, onContextMenu, onToggleTarea, onCrearTarea, onEditarTarea, onEliminarTarea, onReordenarTareas, mostrarProgreso = true}: ProyectoItemProps): JSX.Element {
    const [mostrarAcciones, setMostrarAcciones] = useState(false);
    const tareasCompletadas = tareasProyecto.filter(t => t.completado).length;
    const totalTareas = tareasProyecto.length;

    /* Usar funciones centralizadas para fecha */
    const textoFecha = obtenerTextoFechaLimite(proyecto.fechaLimite);
    const varianteFecha = obtenerVarianteFechaLimite(proyecto.fechaLimite);

    return (
        <div className={`proyectoItemWrapper ${activo ? 'proyectoItemWrapperActivo' : ''}`}>
            <div className={`proyectoItem ${activo ? 'proyectoItemActivo' : ''}`} onClick={onToggle} onContextMenu={onContextMenu} onMouseEnter={() => setMostrarAcciones(true)} onMouseLeave={() => setMostrarAcciones(false)}>
                <div className="proyectoItemChevron">{activo ? <ChevronDown size={14} /> : <ChevronRight size={14} />}</div>

                <div className="proyectoItemContenido">
                    <span className="proyectoNombre">{proyecto.nombre}</span>
                    <div className="proyectoMeta">
                        <span className={`etiquetaPrioridad etiqueta${proyecto.prioridad.charAt(0).toUpperCase() + proyecto.prioridad.slice(1)}`}>{proyecto.prioridad.toUpperCase()}</span>
                        <span>•</span>
                        <span>{totalTareas > 0 ? `${tareasCompletadas}/${totalTareas}` : 'Sin tareas'}</span>

                        {/* Badge de compartido o propietario */}
                        {proyecto.esCompartido && proyecto.propietarioNombre ? (
                            <>
                                <span>•</span>
                                <span className="badgePropietario" title={`De: ${proyecto.propietarioNombre}`}>
                                    {proyecto.propietarioAvatar && <img src={proyecto.propietarioAvatar} alt={proyecto.propietarioNombre} className="badgePropietarioAvatar" />}
                                    <span className="badgePropietarioNombre">{proyecto.propietarioNombre}</span>
                                </span>
                            </>
                        ) : (
                            estaCompartido && (
                                <>
                                    <span>•</span>
                                    <span className="badgeCompartido" title="Proyecto compartido">
                                        <Users size={10} />
                                    </span>
                                </>
                            )
                        )}

                        {/* Badge de fecha limite con urgencia */}
                        {proyecto.fechaLimite && (
                            <>
                                <span>•</span>
                                <BadgeGroup>
                                    <BadgeInfo tipo="fecha" icono={<Calendar size={10} />} texto={textoFecha} variante={varianteFecha} titulo={`Fecha limite: ${proyecto.fechaLimite ? formatearFechaCorta(proyecto.fechaLimite) : ''}`} />
                                </BadgeGroup>
                            </>
                        )}
                    </div>
                </div>

                {mostrarProgreso && (
                    <div className="proyectoProgreso" data-estado={proyecto.estado}>
                        <div className="barraProgresoFondo">
                            <div className="barraProgresoRelleno" style={{width: totalTareas > 0 ? `${(tareasCompletadas / totalTareas) * 100}%` : '0%'}} />
                        </div>
                    </div>
                )}

                {/* Acciones inline usando componente reutilizable */}
                {mostrarAcciones && <AccionesItem mostrarConfigurar={true} mostrarEliminar={true} onConfigurar={onEditar} onEliminar={onEliminar} />}
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

export function ListaProyectos({proyectos, tareas, onCrearProyecto, onSeleccionarProyecto, proyectoSeleccionadoId, onEditarProyecto, onEliminarProyecto, onCambiarEstadoProyecto, onCompartirProyecto, estaCompartido, onToggleTarea, onCrearTarea, onEditarTarea, onEliminarTarea, onReordenarTareas, ocultarCompletados = false, ordenDefecto = 'fecha', mostrarProgreso = true}: ListaProyectosProps): JSX.Element {
    const [menuContexto, setMenuContexto] = useState<MenuContextoProyecto>({visible: false, x: 0, y: 0, proyectoId: null});

    /* Toggle: si ya está seleccionado, deseleccionar */
    const toggleProyecto = (id: number) => {
        if (proyectoSeleccionadoId === id) {
            onSeleccionarProyecto?.(null);
        } else {
            onSeleccionarProyecto?.(id);
        }
    };

    /* Manejar click derecho en proyecto */
    const manejarContextMenu = useCallback((e: React.MouseEvent, proyectoId: number) => {
        e.preventDefault();
        e.stopPropagation();
        setMenuContexto({visible: true, x: e.clientX, y: e.clientY, proyectoId});
    }, []);

    /* Cerrar menu contextual */
    const cerrarMenuContexto = useCallback(() => {
        setMenuContexto(prev => ({...prev, visible: false, proyectoId: null}));
    }, []);

    /* Construir opciones del menu contextual */
    const obtenerOpcionesMenu = useCallback((): OpcionMenu[] => {
        if (!menuContexto.proyectoId) return [];
        const proyecto = proyectos.find(p => p.id === menuContexto.proyectoId);
        if (!proyecto) return [];

        const opciones: OpcionMenu[] = [
            {id: 'editar', etiqueta: 'Editar proyecto', icono: <Edit size={14} />},
            {id: 'compartir', etiqueta: 'Compartir proyecto', icono: <Share2 size={14} />, separadorDespues: true}
        ];

        /* Opciones de estado segun el estado actual */
        if (proyecto.estado !== 'activo') {
            opciones.push({id: 'estado-activo', etiqueta: 'Marcar como activo', icono: <PlayCircle size={14} />});
        }
        if (proyecto.estado !== 'pausado') {
            opciones.push({id: 'estado-pausado', etiqueta: 'Pausar proyecto', icono: <PauseCircle size={14} />});
        }
        if (proyecto.estado !== 'completado') {
            opciones.push({id: 'estado-completado', etiqueta: 'Marcar como completado', icono: <CheckCircle size={14} />, separadorDespues: true});
        } else {
            opciones[opciones.length - 1].separadorDespues = true;
        }

        opciones.push({id: 'eliminar', etiqueta: 'Eliminar proyecto', icono: <Trash2 size={14} />, peligroso: true});

        return opciones;
    }, [menuContexto.proyectoId, proyectos]);

    /* Manejar seleccion del menu contextual */
    const manejarSeleccionMenu = useCallback(
        (opcionId: string) => {
            if (!menuContexto.proyectoId) return;
            const proyecto = proyectos.find(p => p.id === menuContexto.proyectoId);
            if (!proyecto) return;

            switch (opcionId) {
                case 'editar':
                    onEditarProyecto?.(proyecto);
                    break;
                case 'compartir':
                    onCompartirProyecto?.(proyecto);
                    break;
                case 'eliminar':
                    onEliminarProyecto?.(proyecto.id);
                    break;
                case 'estado-activo':
                    onCambiarEstadoProyecto?.(proyecto.id, 'activo');
                    break;
                case 'estado-pausado':
                    onCambiarEstadoProyecto?.(proyecto.id, 'pausado');
                    break;
                case 'estado-completado':
                    onCambiarEstadoProyecto?.(proyecto.id, 'completado');
                    break;
            }
            cerrarMenuContexto();
        },
        [menuContexto.proyectoId, proyectos, onEditarProyecto, onEliminarProyecto, onCambiarEstadoProyecto, onCompartirProyecto, cerrarMenuContexto]
    );

    return (
        <>
            <DashboardPanel>
                <div className="listaProyectos">
                    {proyectos
                        .filter(p => !ocultarCompletados || p.estado !== 'completado')
                        .sort((a, b) => {
                            if (ordenDefecto === 'nombre') return a.nombre.localeCompare(b.nombre);
                            if (ordenDefecto === 'fecha') {
                                if (!a.fechaLimite) return 1;
                                if (!b.fechaLimite) return -1;
                                return new Date(a.fechaLimite).getTime() - new Date(b.fechaLimite).getTime();
                            }
                            if (ordenDefecto === 'prioridad') {
                                const map: Record<string, number> = {alta: 1, media: 2, baja: 3};
                                return (map[a.prioridad] || 99) - (map[b.prioridad] || 99);
                            }
                            return 0;
                        })
                        .map(proyecto => {
                            const tareasProyecto = tareas.filter(t => t.proyectoId === proyecto.id);
                            const proyectoCompartido = estaCompartido?.(proyecto.id) ?? false;
                            return <ProyectoItem key={proyecto.id} proyecto={proyecto} activo={proyecto.id === proyectoSeleccionadoId} tareasProyecto={tareasProyecto} estaCompartido={proyectoCompartido} onToggle={() => toggleProyecto(proyecto.id)} onEditar={() => onEditarProyecto?.(proyecto)} onEliminar={() => onEliminarProyecto?.(proyecto.id)} onContextMenu={e => manejarContextMenu(e, proyecto.id)} onToggleTarea={onToggleTarea} onCrearTarea={onCrearTarea} onEditarTarea={onEditarTarea} onEliminarTarea={onEliminarTarea} onReordenarTareas={onReordenarTareas} mostrarProgreso={mostrarProgreso} />;
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

            {/* Menu contextual */}
            {menuContexto.visible && <MenuContextual opciones={obtenerOpcionesMenu()} posicionX={menuContexto.x} posicionY={menuContexto.y} onSeleccionar={manejarSeleccionMenu} onCerrar={cerrarMenuContexto} />}
        </>
    );
}
