/*
 * PanelEjecucion
 * Componente que renderiza el panel de ejecución (tareas)
 * Responsabilidad única: renderizar la lista de tareas con sus controles
 */

import {Terminal, ArrowUpDown, Plus, Settings} from 'lucide-react';
import {SeccionEncabezado, ListaTareas} from '../dashboard';
import {SelectorBadge} from '../shared/SelectorBadge';
import type {Tarea, Proyecto, Participante} from '../../types/dashboard';

interface OpcionFiltro {
    id: string;
    etiqueta: string;
    icono?: JSX.Element;
    descripcion: string;
}

interface PanelEjecucionProps {
    tareas: Tarea[];
    proyectos: Proyecto[];
    proyectoIdActual?: number;
    ocultarCompletadas: boolean;
    ocultarBadgeProyecto: boolean;
    modoOrden: string;
    valorFiltroActual: string;
    opcionesFiltro: OpcionFiltro[];
    opcionesOrdenTareas: Array<{id: string; etiqueta: string; descripcion: string}>;
    esOrdenManual: boolean;
    onAbrirModalNuevaTarea: () => void;
    onAbrirModalConfigTareas: () => void;
    onToggleTarea: (id: number) => void;
    onCrearTarea: (datos: any) => void;
    onEditarTarea: (id: number, datos: any) => void;
    onEliminarTarea: (id: number) => void;
    onReordenarTareas?: (tareas: Tarea[]) => void;
    onCambiarFiltro: (valor: string) => void;
    onCambiarModoOrden: (modo: any) => void;
    onCompartirTarea: (tarea: Tarea) => void;
    estaCompartida: (id: number) => boolean;
    obtenerParticipantes: (tarea: Tarea) => Participante[];
    handleArrastre: JSX.Element;
    handleMinimizar: JSX.Element;
    /* Callbacks para editar/eliminar habitos desde tareas-habito (Fase 7.6.1) */
    onEditarHabito?: (habitoId: number) => void;
    onEliminarHabito?: (habitoId: number) => void;
    onPosponerHabito?: (habitoId: number) => void;
}

export function PanelEjecucion({tareas, proyectos, proyectoIdActual, ocultarCompletadas, ocultarBadgeProyecto, modoOrden, valorFiltroActual, opcionesFiltro, opcionesOrdenTareas, esOrdenManual, onAbrirModalNuevaTarea, onAbrirModalConfigTareas, onToggleTarea, onCrearTarea, onEditarTarea, onEliminarTarea, onReordenarTareas, onCambiarFiltro, onCambiarModoOrden, onCompartirTarea, estaCompartida, obtenerParticipantes, handleArrastre, handleMinimizar, onEditarHabito, onEliminarHabito, onPosponerHabito}: PanelEjecucionProps): JSX.Element {
    return (
        <>
            <SeccionEncabezado
                icono={<Terminal size={12} />}
                titulo="Ejecucion"
                acciones={
                    <>
                        {handleArrastre}
                        <SelectorBadge opciones={opcionesFiltro} valorActual={valorFiltroActual} onChange={onCambiarFiltro} titulo="Filtrar tareas" />
                        <SelectorBadge opciones={opcionesOrdenTareas} valorActual={modoOrden} onChange={valor => onCambiarModoOrden(valor as any)} icono={<ArrowUpDown size={10} />} titulo="Ordenar tareas" />
                        <button className="selectorBadgeBoton" onClick={onAbrirModalNuevaTarea} title="Nueva Tarea">
                            <span className="selectorBadgeIcono">
                                <Plus size={10} />
                            </span>
                        </button>
                        <button className="selectorBadgeBoton" onClick={onAbrirModalConfigTareas} title="Configuración">
                            <span className="selectorBadgeIcono">
                                <Settings size={10} />
                            </span>
                        </button>
                        {handleMinimizar}
                    </>
                }
            />
            <ListaTareas tareas={tareas} proyectoId={proyectoIdActual} proyectos={proyectos} ocultarCompletadas={ocultarCompletadas} ocultarBadgeProyecto={ocultarBadgeProyecto} onToggleTarea={onToggleTarea} onCrearTarea={onCrearTarea} onEditarTarea={onEditarTarea} onEliminarTarea={onEliminarTarea} onReordenarTareas={esOrdenManual ? onReordenarTareas : undefined} habilitarDrag={esOrdenManual} onCompartirTarea={onCompartirTarea} estaCompartida={estaCompartida} obtenerParticipantes={obtenerParticipantes} onEditarHabito={onEditarHabito} onEliminarHabito={onEliminarHabito} onPosponerHabito={onPosponerHabito} />
        </>
    );
}
