/*
 * PanelProyectos
 * Componente que renderiza el panel de proyectos
 * Responsabilidad única: renderizar la lista de proyectos con sus controles
 */

import {Folder, ArrowUpDown, Plus, Settings} from 'lucide-react';
import {SeccionEncabezado, ListaProyectos} from '../dashboard';
import {SelectorBadge} from '../shared/SelectorBadge';
import type {Proyecto, Tarea} from '../../types/dashboard';
import type {ConfiguracionProyectos} from '../../hooks/useConfiguracionProyectos';

interface PanelProyectosProps {
    proyectos: Proyecto[];
    tareas: Tarea[];
    configuracion: ConfiguracionProyectos;
    opcionesOrdenProyectos: Array<{id: string; etiqueta: string; descripcion: string}>;
    onAbrirModalCrearProyecto: () => void;
    onAbrirModalEditarProyecto: (proyecto: Proyecto) => void;
    onAbrirModalConfigProyectos: () => void;
    onEliminarProyecto: (id: number) => void;
    onCambiarEstadoProyecto: (id: number, estado: 'activo' | 'completado' | 'pausado') => void;
    onCambiarOrdenProyectos: (orden: any) => void;
    onCompartirProyecto: (proyecto: Proyecto) => void;
    estaCompartido: (id: number) => boolean;
    onToggleTarea: (id: number) => void;
    onCrearTarea: (datos: any) => void;
    onEditarTarea: (id: number, datos: any) => void;
    onEliminarTarea: (id: number) => void;
    onReordenarTareas: (tareas: Tarea[]) => void;
    handleArrastre: JSX.Element;
}

export function PanelProyectos({proyectos, tareas, configuracion, opcionesOrdenProyectos, onAbrirModalCrearProyecto, onAbrirModalEditarProyecto, onAbrirModalConfigProyectos, onEliminarProyecto, onCambiarEstadoProyecto, onCambiarOrdenProyectos, onCompartirProyecto, estaCompartido, onToggleTarea, onCrearTarea, onEditarTarea, onEliminarTarea, onReordenarTareas, handleArrastre}: PanelProyectosProps): JSX.Element {
    return (
        <div className="panelDashboard">
            <SeccionEncabezado
                titulo="Proyectos"
                icono={<Folder size={12} />}
                acciones={
                    <>
                        {handleArrastre}
                        <SelectorBadge opciones={opcionesOrdenProyectos} valorActual={configuracion.ordenDefecto} onChange={valor => onCambiarOrdenProyectos(valor as any)} icono={<ArrowUpDown size={10} />} titulo="Ordenar proyectos" />
                        <button className="selectorBadgeBoton" onClick={onAbrirModalCrearProyecto} title="Nuevo Proyecto">
                            <span className="selectorBadgeIcono">
                                <Plus size={10} />
                            </span>
                        </button>
                        <button className="selectorBadgeBoton" onClick={onAbrirModalConfigProyectos} title="Configuración">
                            <span className="selectorBadgeIcono">
                                <Settings size={10} />
                            </span>
                        </button>
                    </>
                }
            />
            <ListaProyectos proyectos={proyectos} tareas={tareas} onCrearProyecto={onAbrirModalCrearProyecto} onSeleccionarProyecto={() => {}} onEditarProyecto={onAbrirModalEditarProyecto} onEliminarProyecto={onEliminarProyecto} onCambiarEstadoProyecto={onCambiarEstadoProyecto} onCompartirProyecto={onCompartirProyecto} estaCompartido={estaCompartido} onToggleTarea={onToggleTarea} onCrearTarea={onCrearTarea} onEditarTarea={onEditarTarea} onEliminarTarea={onEliminarTarea} onReordenarTareas={onReordenarTareas} ocultarCompletados={configuracion.ocultarCompletados} ordenDefecto={configuracion.ordenDefecto} mostrarProgreso={configuracion.mostrarProgreso} />
        </div>
    );
}
