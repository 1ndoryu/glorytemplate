/*
 * PanelEjecucion
 * Componente que renderiza el panel de ejecución (tareas)
 * Responsabilidad única: renderizar la lista de tareas con sus controles
 * Nota: En móvil el header del panel se oculta via CSS (Fase 10.8.3)
 */

import {useState, useMemo, useCallback} from 'react';
import {ArrowUpDown, Plus, Settings, Maximize2, Columns, X} from 'lucide-react';
import {SeccionEncabezado, ListaTareas} from '../dashboard';
import {SelectorBadge, OverlayEnfoque, SelectorGrupo} from '../shared';
import {Boton} from '../ui';
import type {Tarea, Proyecto, Participante, DatosEdicionTarea, Habito} from '../../types/dashboard';
import {useGruposEjecucionStore} from '../../stores/gruposEjecucionStore';
import {useHabitosStore} from '../../stores/habitosStore';
import {useGruposEjecucion} from '../../hooks/useGruposEjecucion';

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
    /* ID del panel para persistir grupo activo */
    panelId?: string;
    modoOrden: string;
    valorFiltroActual: string;
    opcionesFiltro: OpcionFiltro[];
    opcionesOrdenTareas: Array<{id: string; etiqueta: string; descripcion: string}>;
    esOrdenManual: boolean;
    onAbrirModalNuevaTarea: (valoresIniciales?: {grupoEjecucion?: string | null}) => void;
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
    /* [217A-2] Subhábitos: acciones independientes */
    onPosponerSubHabitoConTiempo?: (habitoPadreId: number, subHabitoId: number, hasta: string | null) => void;
    onActualizarSubHabito?: (habitoPadreId: number, subHabitoId: number, datos: Partial<Habito>) => void;
    onConfigurarSubHabito?: (habitoPadreId: number, subHabitoId: number) => void;
    modoCompacto?: boolean;
    onConfigurarTarea?: (tarea: Tarea) => void;
    /* [218A-2] Callback para actualizar orden de hábitos desde drag */
    onReordenarHabitos?: (ordenes: Map<number, number>) => void;
    onDividirPanel?: () => void;
    onCerrarPanel?: () => void;
}

export function PanelEjecucion({tareas, proyectos, proyectoIdActual, ocultarCompletadas, ocultarBadgeProyecto, ocultarSubtareasAutomaticamente = false, panelId, modoOrden, valorFiltroActual, opcionesFiltro, opcionesOrdenTareas, esOrdenManual, onAbrirModalNuevaTarea, onAbrirModalCrearHabito, onAbrirModalConfigTareas, onToggleTarea, onCrearTarea, onEditarTarea, onEliminarTarea, onReordenarTareas, onCambiarFiltro, onCambiarModoOrden, onCompartirTarea, estaCompartida, obtenerParticipantes, renderHandleArrastre, handleMinimizar, onEditarHabito, onEliminarHabito, onToggleHabito, onPosponerHabito, onPosponerHabitoConTiempo, onPausarHabito, onActualizarHabito, onToggleSubHabito, onEliminarSubHabito, onPosponerSubHabitoConTiempo, onActualizarSubHabito, onConfigurarSubHabito, modoCompacto = false, onConfigurarTarea, onReordenarHabitos, onDividirPanel, onCerrarPanel}: PanelEjecucionProps): JSX.Element {
    const [modoEnfoque, setModoEnfoque] = useState(false);

    /* Gestión de grupos de ejecución */
    const grupoActivo = useGruposEjecucionStore(s => (panelId ? s.grupoPorPanel[panelId] : null));
    const setGrupoPanel = useGruposEjecucionStore(s => s.setGrupoPanel);

    const cambiarGrupo = useCallback((nuevoGrupo: string | null) => {
        if (!panelId) return;
        setGrupoPanel(panelId, nuevoGrupo);
    }, [panelId, setGrupoPanel]);

    const habitos = useHabitosStore(state => state.habitos);

    const gruposDisponibles = useGruposEjecucion(tareas, habitos);

    const tareasFiltradas = useMemo(() => {
        if (!grupoActivo) return tareas.filter(t => !t.grupoEjecucion);
        return tareas.filter(t => t.grupoEjecucion === grupoActivo);
    }, [tareas, grupoActivo]);

    const crearTareaConGrupo = useCallback((datos: DatosEdicionTarea) => {
        if (grupoActivo) {
            onCrearTarea({...datos, grupoEjecucion: grupoActivo});
        } else {
            onCrearTarea(datos);
        }
    }, [onCrearTarea, grupoActivo]);


    const listaTareasComun = (
        <ListaTareas
            tareas={tareasFiltradas}
            proyectoId={proyectoIdActual}
            proyectos={proyectos}
            ocultarCompletadas={ocultarCompletadas}
            ocultarBadgeProyecto={ocultarBadgeProyecto}
            ocultarSubtareasAutomaticamente={ocultarSubtareasAutomaticamente}
            onToggleTarea={onToggleTarea}
            onCrearTarea={crearTareaConGrupo}
            onEditarTarea={onEditarTarea}
            onEliminarTarea={onEliminarTarea}
            onReordenarTareas={esOrdenManual ? onReordenarTareas : undefined}
            habilitarDrag={esOrdenManual}
            onCompartirTarea={onCompartirTarea}
            estaCompartida={estaCompartida}
            obtenerParticipantes={obtenerParticipantes}
            onEditarHabito={onEditarHabito}
            onEliminarHabito={onEliminarHabito}
            onToggleHabito={onToggleHabito}
            onPosponerHabito={onPosponerHabito}
            onPosponerHabitoConTiempo={onPosponerHabitoConTiempo}
            onPausarHabito={onPausarHabito}
            onActualizarHabito={onActualizarHabito}
            onToggleSubHabito={onToggleSubHabito}
            onEliminarSubHabito={onEliminarSubHabito}
            onPosponerSubHabitoConTiempo={onPosponerSubHabitoConTiempo}
            onActualizarSubHabito={onActualizarSubHabito}
            onConfigurarSubHabito={onConfigurarSubHabito}
            modoCompacto={modoCompacto}
            onConfigurarTarea={onConfigurarTarea}
            onAbrirModalCrear={onAbrirModalNuevaTarea}
            onAbrirModalCrearHabito={onAbrirModalCrearHabito}
            onReordenarHabitos={esOrdenManual ? onReordenarHabitos : undefined}
        />
    );

    return (
        <>
            <SeccionEncabezado
                icono={null}
                titulo={renderHandleArrastre('Tareas')}
                variante="panelHeader"
                acciones={
                    <>
                        <SelectorGrupo
                            grupos={gruposDisponibles}
                            grupoActual={grupoActivo}
                            onChange={cambiarGrupo}
                            placeholder="Sin grupo"
                            titulo="Grupo de ejecución"
                            soloIcono={true}
                            variante="badge"
                        />
                        <SelectorBadge opciones={opcionesFiltro} valorActual={valorFiltroActual} onChange={onCambiarFiltro} titulo="Filtrar tareas" soloIcono={true} />
                        <SelectorBadge opciones={opcionesOrdenTareas} valorActual={modoOrden} onChange={valor => onCambiarModoOrden(valor)} icono={<ArrowUpDown size={12} />} titulo="Ordenar tareas" soloIcono={true} />
                        <Boton variante="badge" soloIcono onClick={() => onAbrirModalNuevaTarea({grupoEjecucion: grupoActivo})} icono={<Plus size={12} />} title="Nueva Tarea" />
                        <Boton variante="badge" soloIcono onClick={onAbrirModalConfigTareas} icono={<Settings size={12} />} title="Configuración" />
                        <Boton variante="badge" soloIcono onClick={() => setModoEnfoque(true)} icono={<Maximize2 size={12} />} title="Modo enfoque" />
                        {onDividirPanel && <Boton variante="badge" soloIcono onClick={onDividirPanel} icono={<Columns size={12} />} title="Dividir panel" />}
                        {onCerrarPanel && <Boton variante="badge" soloIcono onClick={onCerrarPanel} icono={<X size={12} />} title="Cerrar panel" />}
                        {handleMinimizar}
                    </>
                }
            />
            {listaTareasComun}

            <OverlayEnfoque estaActivo={modoEnfoque} onCerrar={() => setModoEnfoque(false)} titulo="Tareas">
                {listaTareasComun}
            </OverlayEnfoque>
        </>
    );
}
