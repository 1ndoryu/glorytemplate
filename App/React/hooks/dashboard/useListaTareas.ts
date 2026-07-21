/*
 * useListaTareas
 * Hook wrapper que encapsula TODA la lógica de ListaTareas
 * Internamente orquesta useListaTareasLogica, useTareaOrdenamiento,
 * stores de selección múltiple y grupos, y mensajes no leídos
 */

import {useMemo, useCallback, useEffect} from 'react';
import type {Tarea, DatosEdicionTarea} from '../../types/dashboard';
import {esTareaHabito} from '../../types/dashboard';
import {useSeleccionMultipleStore} from '../../stores/seleccionMultipleStore';
import {useGruposTareasStore, useSeccionesActivas} from '../../stores/gruposTareasStore';
import {useShallow} from 'zustand/react/shallow';
import {useMensajesNoLeidos} from '../useMensajesNoLeidos';
import {useListaTareasLogica} from './useListaTareasLogica';
import {useTareaOrdenamiento} from './useTareaOrdenamiento';

export interface UseListaTareasParams {
    tareas: Tarea[];
    proyectoId?: number;
    onEditarTarea?: (id: number, datos: DatosEdicionTarea) => void;
    onCrearTarea?: (datos: DatosEdicionTarea) => void;
    onEliminarTarea?: (id: number) => void;
    onReordenarTareas?: (tareas: Tarea[]) => void;
    onConfigurarTarea?: (tarea: Tarea) => void;
    onToggleTarea?: (id: number) => void;
    ocultarSubtareasAutomaticamente?: boolean;
    /* [218A-2] Callback para actualizar orden de hábitos desde drag en panel de ejecución */
    onReordenarHabitos?: (ordenes: Map<number, number>) => void;
}

export function useListaTareas({
    tareas,
    proyectoId,
    onEditarTarea,
    onCrearTarea,
    onEliminarTarea: _onEliminarTarea,
    onReordenarTareas,
    onConfigurarTarea,
    onToggleTarea: _onToggleTarea,
    ocultarSubtareasAutomaticamente = false,
    onReordenarHabitos
}: UseListaTareasParams) {
    /* Filtros básicos */
    /* [2303A-41] Excluir tareas pospuestas cuyo pospuestoHasta aún no llegó */
    const pendientes = useMemo(() => tareas.filter(t => {
        if (t.completado) return false;
        if (t.pospuestoHasta && new Date(t.pospuestoHasta) > new Date()) return false;
        return true;
    }), [tareas]);
    const completadas = useMemo(() => tareas.filter(t => t.completado), [tareas]);

    /* Selección múltiple de tareas */
    const {
        tareasSeleccionadas, toggleSeleccion, estaSeleccionada,
        limpiarSeleccion, menuPosicion, mostrarMenu, ocultarMenu,
        modoSeleccionActivo
    } = useSeleccionMultipleStore(useShallow(s => ({
        tareasSeleccionadas: s.tareasSeleccionadas,
        toggleSeleccion: s.toggleSeleccion,
        estaSeleccionada: s.estaSeleccionada,
        limpiarSeleccion: s.limpiarSeleccion,
        menuPosicion: s.menuPosicion,
        mostrarMenu: s.mostrarMenu,
        ocultarMenu: s.ocultarMenu,
        modoSeleccionActivo: s.modoSeleccionActivo
    })));

    /* Handler para Ctrl+Click en tareas */
    const manejarSeleccionMultiple = useCallback(
        (tarea: Tarea, _evento: React.MouseEvent) => {
            toggleSeleccion({
                id: tarea.id,
                texto: tarea.texto,
                proyectoId: tarea.proyectoId,
                prioridad: tarea.prioridad,
                esHabito: esTareaHabito(tarea),
                urgencia: tarea.urgencia
            });
        },
        [toggleSeleccion]
    );

    /* Handler para click derecho cuando hay selección múltiple */
    const manejarClickDerechoLista = useCallback(
        (evento: React.MouseEvent) => {
            if (modoSeleccionActivo && tareasSeleccionadas.size > 0) {
                evento.preventDefault();
                mostrarMenu(evento.clientX, evento.clientY);
            }
        },
        [modoSeleccionActivo, tareasSeleccionadas.size, mostrarMenu]
    );

    /* Efecto para limpiar selección al hacer click fuera de las tareas */
    useEffect(() => {
        if (!modoSeleccionActivo) return;

        const manejarClickGlobal = (evento: MouseEvent) => {
            const target = evento.target as HTMLElement;
            if (
                evento.ctrlKey || evento.metaKey || evento.shiftKey ||
                target.closest('.tareaItem') ||
                target.closest('#menu-contextual') ||
                target.closest('.tareaNuevoInline') ||
                target.closest('.grupoTareasHeader')
            ) {
                return;
            }
            limpiarSeleccion();
        };

        document.addEventListener('mousedown', manejarClickGlobal);
        return () => document.removeEventListener('mousedown', manejarClickGlobal);
    }, [modoSeleccionActivo, limpiarSeleccion]);

    /* Sistema de grupos/secciones */
    const seccionesActivas = useSeccionesActivas();
    const {crearGrupo, obtenerGruposProyecto, ordenarGrupos, grupos} = useGruposTareasStore(useShallow(s => ({
        crearGrupo: s.crearGrupo,
        obtenerGruposProyecto: s.obtenerGruposProyecto,
        ordenarGrupos: s.ordenarGrupos,
        grupos: s.grupos
    })));

    /* Obtener grupos del proyecto actual y organizar tareas */
    const gruposOrdenados = useMemo(() => {
        if (!seccionesActivas) return [];
        const gruposDelProyecto = obtenerGruposProyecto(proyectoId);
        if (gruposDelProyecto.length === 0) return [];

        const tareasPorGrupo = new Map<number, Tarea[]>();
        gruposDelProyecto.forEach(g => {
            const tareasDelGrupo = tareas.filter(t => t.grupoId === g.id && !t.completado && !t.parentId);
            tareasPorGrupo.set(g.id, tareasDelGrupo);
        });

        return ordenarGrupos(gruposDelProyecto, tareasPorGrupo);
    }, [seccionesActivas, obtenerGruposProyecto, ordenarGrupos, proyectoId, tareas, grupos]);

    /* Handler para agrupar tareas seleccionadas */
    const manejarAgrupar = useCallback(
        (ids: number[]) => {
            if (ids.length === 0) return;
            const grupo = crearGrupo('Nuevo grupo', proyectoId);
            ids.forEach(id => {
                onEditarTarea?.(id, {grupoId: grupo.id});
            });
            limpiarSeleccion();
        },
        [crearGrupo, proyectoId, onEditarTarea, limpiarSeleccion]
    );

    /* Lógica Principal y Estado (hooks existentes) */
    const {
        tareasExpandidas, setTareasExpandidas,
        tareaConfigurando, setTareaConfigurando,
        tareaMoviendo, setTareaMoviendo,
        toggleColapsar, abrirConfiguracion, guardarConfiguracion,
        handleIndent, handleOutdent, handleCrearNueva,
        handleMoverProyecto, obtenerSubtareasVisibles
    } = useListaTareasLogica({
        tareas,
        proyectoId,
        onEditarTarea,
        onCrearTarea,
        onConfigurarTarea,
        pendientes,
        ocultarSubtareasAutomaticamente
    });

    /* Lógica de Ordenamiento (Drag & Drop) */
    const {
        tareaArrastrandoId, esGestoSubtarea, setEsGestoSubtarea,
        dragStartXRef, dragCurrentXRef,
        handleDragStart, handleDragEnd, handleReorder,
        UMBRAL_INDENT, seArrastroRef
    } = useTareaOrdenamiento({
        tareas,
        pendientes,
        completadas,
        onReordenarTareas,
        onEditarTarea,
        setTareasExpandidas,
        onReordenarHabitos
    });

    /* Datos calculados */
    /* [044A-1] tareasPrincipalesPendientes incluye hábitos en el Reorder.Group
     * para que aparezcan en la lista, pero dragListener=false los hace
     * no arrastrables (044A-12). Así se ven pero no contaminan el reorder. */
    const tareasPrincipalesPendientes = useMemo(
        () => pendientes.filter(t => !t.parentId),
        [pendientes]
    );
    const tareasHabitoPendientes = useMemo(
        () => pendientes.filter(t => esTareaHabito(t)),
        [pendientes]
    );

    /* Separar tareas en grupos y sin grupo (cuando secciones está activo) */
    const {tareasSinGrupo, tareasPorGrupo} = useMemo(() => {
        if (!seccionesActivas || gruposOrdenados.length === 0) {
            return {tareasSinGrupo: tareasPrincipalesPendientes, tareasPorGrupo: new Map<number, Tarea[]>()};
        }

        const sinGrupo: Tarea[] = [];
        const porGrupo = new Map<number, Tarea[]>();

        gruposOrdenados.forEach(g => porGrupo.set(g.id, []));

        tareasPrincipalesPendientes.forEach(tarea => {
            if (tarea.grupoId && porGrupo.has(tarea.grupoId)) {
                porGrupo.get(tarea.grupoId)!.push(tarea);
            } else {
                sinGrupo.push(tarea);
            }
        });

        return {tareasSinGrupo: sinGrupo, tareasPorGrupo: porGrupo};
    }, [seccionesActivas, gruposOrdenados, tareasPrincipalesPendientes]);

    /* Mensajes no leídos */
    const tareasIdsReales = useMemo(
        () => tareas.filter(t => t.id > 0).map(t => t.id),
        [tareas]
    );
    const {noLeidos: mensajesNoLeidosPorTarea} = useMensajesNoLeidos('tarea', tareasIdsReales);

    /* Wrapper para crear tarea con proyecto */
    const crearTareaConProyecto = useCallback(
        (datos: DatosEdicionTarea) => {
            onCrearTarea?.({...datos, proyectoId});
        },
        [onCrearTarea, proyectoId]
    );

    return {
        /* Filtros */
        pendientes, completadas,
        /* Selección múltiple */
        estaSeleccionada, manejarSeleccionMultiple, manejarClickDerechoLista,
        modoSeleccionActivo, menuPosicion, ocultarMenu, limpiarSeleccion,
        /* Grupos */
        seccionesActivas, gruposOrdenados, manejarAgrupar,
        /* Lógica principal */
        tareasExpandidas, tareaConfigurando, setTareaConfigurando,
        tareaMoviendo, setTareaMoviendo,
        toggleColapsar, abrirConfiguracion, guardarConfiguracion,
        handleIndent, handleOutdent, handleCrearNueva,
        handleMoverProyecto, obtenerSubtareasVisibles,
        /* Ordenamiento */
        tareaArrastrandoId, esGestoSubtarea, setEsGestoSubtarea,
        dragStartXRef, dragCurrentXRef,
        handleDragStart, handleDragEnd, handleReorder,
        UMBRAL_INDENT, seArrastroRef,
        /* Datos calculados */
        tareasPrincipalesPendientes, tareasHabitoPendientes,
        tareasSinGrupo, tareasPorGrupo,
        mensajesNoLeidosPorTarea,
        crearTareaConProyecto
    };
}
