/*
 * PanelEjecucion
 * Componente que renderiza el panel de ejecución (tareas)
 * Responsabilidad única: renderizar la lista de tareas con sus controles
 * Nota: En móvil el header del panel se oculta via CSS (Fase 10.8.3)
 */

import {useState} from 'react';
import {ArrowUpDown, Plus, Settings, Maximize2} from 'lucide-react';
import {SeccionEncabezado, ListaTareas} from '../dashboard';
import {SelectorBadge, OverlayEnfoque} from '../shared';
import {Boton} from '../ui';
import type {Tarea, Proyecto, Participante, DatosEdicionTarea, Habito} from '../../types/dashboard';

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
    /* Ocultar subtareas automáticamente (colapsadas por defecto) */
    ocultarSubtareasAutomaticamente?: boolean;
    modoOrden: string;
    valorFiltroActual: string;
    opcionesFiltro: OpcionFiltro[];
    opcionesOrdenTareas: Array<{id: string; etiqueta: string; descripcion: string}>;
    esOrdenManual: boolean;
    onAbrirModalNuevaTarea: () => void;
    /* [207A-4] Callback para abrir modal de creación de hábito */
    onAbrirModalCrearHabito?: () => void;
    onAbrirModalConfigTareas: () => void;
    onToggleTarea: (id: number) => void;
    onCrearTarea: (datos: DatosEdicionTarea) => void;
    onEditarTarea: (id: number, datos: DatosEdicionTarea) => void;
    onEliminarTarea: (id: number) => void;
    onReordenarTareas?: (tareas: Tarea[]) => void;
    onCambiarFiltro: (valor: string) => void;
    onCambiarModoOrden: (modo: string) => void;
    onCompartirTarea: (tarea: Tarea) => void;
    estaCompartida: (id: number) => boolean;
    obtenerParticipantes: (tarea: Tarea) => Participante[];
    renderHandleArrastre: (titulo?: string) => JSX.Element;
    handleMinimizar: JSX.Element;
    /* Callbacks para hábitos - Sincronizado con TablaHabitos (Fase UI/UX) */
    onEditarHabito?: (habitoId: number) => void;
    onEliminarHabito?: (habitoId: number) => void;
    onToggleHabito?: (habitoId: number) => void;
    onPosponerHabito?: (habitoId: number) => void;
    onPosponerHabitoConTiempo?: (habitoId: number, hasta: string | null) => void;
    onPausarHabito?: (habitoId: number) => void;
    onActualizarHabito?: (habitoId: number, datos: Partial<Habito>) => void;
    /* [207A-3] Callbacks para subhábitos */
    onToggleSubHabito?: (habitoPadreId: number, subHabitoId: number) => void;
    onEliminarSubHabito?: (habitoPadreId: number, subHabitoId: number) => void;
    modoCompacto?: boolean;
    onConfigurarTarea?: (tarea: Tarea) => void;
}

export function PanelEjecucion({tareas, proyectos, proyectoIdActual, ocultarCompletadas, ocultarBadgeProyecto, ocultarSubtareasAutomaticamente = false, modoOrden, valorFiltroActual, opcionesFiltro, opcionesOrdenTareas, esOrdenManual, onAbrirModalNuevaTarea, onAbrirModalCrearHabito, onAbrirModalConfigTareas, onToggleTarea, onCrearTarea, onEditarTarea, onEliminarTarea, onReordenarTareas, onCambiarFiltro, onCambiarModoOrden, onCompartirTarea, estaCompartida, obtenerParticipantes, renderHandleArrastre, handleMinimizar, onEditarHabito, onEliminarHabito, onToggleHabito, onPosponerHabito, onPosponerHabitoConTiempo, onPausarHabito, onActualizarHabito, onToggleSubHabito, onEliminarSubHabito, modoCompacto = false, onConfigurarTarea}: PanelEjecucionProps): JSX.Element {
    const [modoEnfoque, setModoEnfoque] = useState(false);

    return (
        <>
            <SeccionEncabezado
                icono={null}
                titulo={renderHandleArrastre('Tareas')}
                variante="panelHeader"
                acciones={
                    <>
                        <SelectorBadge opciones={opcionesFiltro} valorActual={valorFiltroActual} onChange={onCambiarFiltro} titulo="Filtrar tareas" soloIcono={true} />
                        <SelectorBadge opciones={opcionesOrdenTareas} valorActual={modoOrden} onChange={valor => onCambiarModoOrden(valor)} icono={<ArrowUpDown size={12} />} titulo="Ordenar tareas" soloIcono={true} />
                        <Boton variante="badge" soloIcono onClick={onAbrirModalNuevaTarea} icono={<Plus size={12} />} title="Nueva Tarea" />
                        <Boton variante="badge" soloIcono onClick={onAbrirModalConfigTareas} icono={<Settings size={12} />} title="Configuración" />
                        <Boton variante="badge" soloIcono onClick={() => setModoEnfoque(true)} icono={<Maximize2 size={12} />} title="Modo enfoque" />
                        {handleMinimizar}
                    </>
                }
            />
            <ListaTareas tareas={tareas} proyectoId={proyectoIdActual} proyectos={proyectos} ocultarCompletadas={ocultarCompletadas} ocultarBadgeProyecto={ocultarBadgeProyecto} ocultarSubtareasAutomaticamente={ocultarSubtareasAutomaticamente} onToggleTarea={onToggleTarea} onCrearTarea={onCrearTarea} onEditarTarea={onEditarTarea} onEliminarTarea={onEliminarTarea} onReordenarTareas={esOrdenManual ? onReordenarTareas : undefined} habilitarDrag={esOrdenManual} onCompartirTarea={onCompartirTarea} estaCompartida={estaCompartida} obtenerParticipantes={obtenerParticipantes} onEditarHabito={onEditarHabito} onEliminarHabito={onEliminarHabito} onToggleHabito={onToggleHabito} onPosponerHabito={onPosponerHabito} onPosponerHabitoConTiempo={onPosponerHabitoConTiempo} onPausarHabito={onPausarHabito} onActualizarHabito={onActualizarHabito} onToggleSubHabito={onToggleSubHabito} onEliminarSubHabito={onEliminarSubHabito} modoCompacto={modoCompacto} onConfigurarTarea={onConfigurarTarea} onAbrirModalCrear={onAbrirModalNuevaTarea} onAbrirModalCrearHabito={onAbrirModalCrearHabito} />

            <OverlayEnfoque estaActivo={modoEnfoque} onCerrar={() => setModoEnfoque(false)} titulo="Tareas">
                <ListaTareas tareas={tareas} proyectoId={proyectoIdActual} proyectos={proyectos} ocultarCompletadas={ocultarCompletadas} ocultarBadgeProyecto={ocultarBadgeProyecto} ocultarSubtareasAutomaticamente={ocultarSubtareasAutomaticamente} onToggleTarea={onToggleTarea} onCrearTarea={onCrearTarea} onEditarTarea={onEditarTarea} onEliminarTarea={onEliminarTarea} onReordenarTareas={esOrdenManual ? onReordenarTareas : undefined} habilitarDrag={esOrdenManual} onCompartirTarea={onCompartirTarea} estaCompartida={estaCompartida} obtenerParticipantes={obtenerParticipantes} onEditarHabito={onEditarHabito} onEliminarHabito={onEliminarHabito} onToggleHabito={onToggleHabito} onPosponerHabito={onPosponerHabito} onPosponerHabitoConTiempo={onPosponerHabitoConTiempo} onPausarHabito={onPausarHabito} onActualizarHabito={onActualizarHabito} onToggleSubHabito={onToggleSubHabito} onEliminarSubHabito={onEliminarSubHabito} modoCompacto={modoCompacto} onConfigurarTarea={onConfigurarTarea} onAbrirModalCrear={onAbrirModalNuevaTarea} onAbrirModalCrearHabito={onAbrirModalCrearHabito} />
            </OverlayEnfoque>
        </>
    );
}
