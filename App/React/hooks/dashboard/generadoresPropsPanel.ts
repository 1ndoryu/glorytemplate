/*
 * generadoresPropsPanel.ts
 * Funciones generadoras de props para cada tipo de panel del Dashboard
 *
 * Son funciones puras que reciben el contexto y parámetros de renderizado,
 * y devuelven el objeto de props para el componente del panel.
 * Extraídas de useDashboardGrid para respetar límite de líneas.
 */

import type {DashboardCompletoRetorno} from '../useDashboardCompleto';
import {usePluginsStore} from '../../stores/pluginsStore';
import {useHabitosStore} from '../../stores/habitosStore';
import type {DatosEdicionTarea, Tarea, Habito} from '../../types/dashboard';

/*
 * Props que se pasan a cada panel según su tipo
 * Centraliza la lógica de qué props necesita cada panel
 */
export interface PropsContextoPaneles {
    dashboard: DashboardCompletoRetorno['dashboard'];
    modales: DashboardCompletoRetorno['modales'];
    compartir: DashboardCompletoRetorno['compartir'];
    ordenHabitos: DashboardCompletoRetorno['ordenHabitos'];
    filtroTareas: DashboardCompletoRetorno['filtroTareas'];
    ordenTareas: DashboardCompletoRetorno['ordenTareas'];
    habitosComoTareas: DashboardCompletoRetorno['habitosComoTareas'];
    configTareas: DashboardCompletoRetorno['configTareas'];
    configHabitos: DashboardCompletoRetorno['configHabitos'];
    configProyectos: DashboardCompletoRetorno['configProyectos'];
    configScratchpad: DashboardCompletoRetorno['configScratchpad'];
    configActividad: DashboardCompletoRetorno['configActividad'];
    opciones: DashboardCompletoRetorno['opciones'];
    acciones: DashboardCompletoRetorno['acciones'];
    valorFiltroActual: DashboardCompletoRetorno['valorFiltroActual'];
    marcarDiaHabitoConSync: DashboardCompletoRetorno['marcarDiaHabitoConSync'];
    desmarcarDiaHabitoConSync: DashboardCompletoRetorno['desmarcarDiaHabitoConSync'];
    limites: DashboardCompletoRetorno['limites'];
}

export function generarPropsPanelBase(
    _ctx: PropsContextoPaneles,
    renderHandleArrastre: (titulo?: string) => JSX.Element,
    handleMinimizar: JSX.Element
) {
    return {renderHandleArrastre, handleMinimizar};
}

export function generarPropsPanelEjecucion(
    ctx: PropsContextoPaneles,
    renderHandleArrastre: (titulo?: string) => JSX.Element,
    handleMinimizar: JSX.Element,
    manejarToggleTarea: (id: number) => void,
    manejarEditarHabitoPorId: (habitoId: number) => void,
    esMovilActual: boolean
) {
    const {dashboard, modales, compartir, filtroTareas, ordenTareas, configTareas, opciones, acciones, valorFiltroActual, limites, habitosComoTareas} = ctx;

    const crearTareaConLimite = (datos: DatosEdicionTarea) => {
        const tareasActivas = dashboard.tareas.filter((t: Tarea) => !t.completado).length;
        if (!limites.verificarYMostrar('tareasActivas', tareasActivas)) return;
        dashboard.crearTarea(datos);
    };

    const manejarConfigurarTarea = (tarea: Tarea) => {
        /* [243A-19] Tareas virtuales de hábito (IDs negativos) no existen en BD.
         * Abrirlas como modal de tarea causa fallos silenciosos.
         * - Hábito principal: generarIdTareaHabito = -habitoId - 10000 → ID ∈ (-100000, -10000]
         * - Sub-hábito:       generarIdSubHabitoTarea = -(habitoId*1000+subId) - 100000 → ID < -100000
         * En ambos casos abrimos el modal del hábito padre. */
        if (tarea.id < -100000) {
            const habitoId = Math.floor(-(tarea.id + 100000) / 1000);
            manejarEditarHabitoPorId(habitoId);
            return;
        }
        if (tarea.id <= -10000 && tarea.id >= -100000) {
            const habitoId = -(tarea.id + 10000);
            manejarEditarHabitoPorId(habitoId);
            return;
        }
        if (esMovilActual) {
            modales.abrirEdicionTareaMovil(tarea);
        } else {
            modales.abrirModalEditarTarea(tarea);
        }
    };

    return {
        tareas: ordenTareas.tareasOrdenadas,
        proyectos: dashboard.proyectos || [],
        proyectoIdActual: filtroTareas.filtroActual.tipo === 'proyecto' ? filtroTareas.filtroActual.proyectoId : undefined,
        ocultarCompletadas: configTareas.configuracion.ocultarCompletadas,
        ocultarBadgeProyecto: configTareas.configuracion.ocultarBadgeProyecto,
        ocultarSubtareasAutomaticamente: configTareas.configuracion.ocultarSubtareasAutomaticamente,
        modoOrden: ordenTareas.modoActual,
        valorFiltroActual: valorFiltroActual,
        opcionesFiltro: opciones.opcionesFiltro,
        opcionesOrdenTareas: opciones.opcionesOrdenTareas,
        esOrdenManual: ordenTareas.esOrdenManual,
        onAbrirModalNuevaTarea: () => modales.abrirCreacionRapida('tarea'),
        onAbrirModalCrearHabito: () => modales.abrirCreacionRapida('habito'),
        onAbrirModalConfigTareas: () => modales.abrirModalConfigGlobal('tareas'),
        onToggleTarea: manejarToggleTarea,
        onCrearTarea: crearTareaConLimite,
        onEditarTarea: dashboard.editarTarea,
        /* [263A-2] Interceptar eliminación de subhábitos virtuales (IDs negativos).
         * Antes llamaba directo a eliminarTarea del store que no los encuentra → falla silenciosa. */
        onEliminarTarea: (id: number) => {
            const fueSubhabito = habitosComoTareas.manejarEliminarTareaHabito(id);
            if (!fueSubhabito) dashboard.eliminarTarea(id);
        },
        onReordenarTareas: dashboard.reordenarTareas,
        onCambiarFiltro: acciones.manejarCambioFiltro,
        onCambiarModoOrden: ordenTareas.cambiarModo,
        onCompartirTarea: compartir.manejarCompartirTarea,
        estaCompartida: compartir.estaCompartidaTarea,
        obtenerParticipantes: compartir.obtenerParticipantesTarea,
        renderHandleArrastre,
        handleMinimizar,
        onEditarHabito: manejarEditarHabitoPorId,
        onEliminarHabito: dashboard.eliminarHabito,
        onToggleHabito: dashboard.toggleHabito,
        onPosponerHabito: dashboard.posponerHabito,
        onPosponerHabitoConTiempo: dashboard.posponerHabitoConTiempo,
        onPausarHabito: dashboard.pausarHabito,
        onActualizarHabito: dashboard.editarHabito,
        /* [207A-3] Subhábitos: store directo para toggle y eliminar */
        onToggleSubHabito: useHabitosStore.getState().toggleSubHabito,
        onEliminarSubHabito: useHabitosStore.getState().eliminarSubHabito,
        /* [217A-4] Subhábitos: posponer via dashboard wrapper (con mensaje + undo) */
        onPosponerSubHabitoConTiempo: dashboard.posponerSubHabitoConTiempo,
        onActualizarSubHabito: useHabitosStore.getState().editarSubHabito,
        onConfigurarSubHabito: dashboard.abrirModalEditarSubHabito,
        modoCompacto: configTareas.configuracion.modoCompacto,
        onConfigurarTarea: manejarConfigurarTarea,
        /* [218A-2] Actualizar orden de hábitos desde drag en panel de ejecución.
         * Usamos el orden específico de Ejecución para no tocar el panel de Hábitos. */
        onReordenarHabitos: (ordenes: Map<number, number>) => {
            useHabitosStore.getState().actualizarOrdenEjecucionHabitos(ordenes);
        }
    };
}

export function generarPropsPanelFocoPrioritario(
    ctx: PropsContextoPaneles,
    renderHandleArrastre: (titulo?: string) => JSX.Element,
    handleMinimizar: JSX.Element,
    esMovilActual: boolean
) {
    const {dashboard, modales, ordenHabitos, configHabitos, opciones} = ctx;

    const manejarEditarHabito = (habito: Habito) => {
        if (esMovilActual) {
            modales.abrirEdicionHabitoMovil(habito);
        } else {
            dashboard.abrirModalEditarHabito(habito);
        }
    };

    return {
        habitos: ordenHabitos.habitosOrdenados,
        modoOrdenHabitos: ordenHabitos.modoActual,
        opcionesOrdenHabitos: opciones.opcionesOrdenHabitos,
        /* [218A-1] Orden manual para hábitos */
        esOrdenManual: ordenHabitos.esOrdenManual,
        onReordenarHabitos: dashboard.reordenarHabitos,
        configuracion: configHabitos.configuracion,
        onAbrirModalCrearHabito: () => modales.abrirCreacionRapida('habito'),
        onAbrirModalConfigHabitos: () => modales.abrirModalConfigGlobal('habitos'),
        onToggleHabito: dashboard.toggleHabito,
        onEditarHabito: manejarEditarHabito,
        onEliminarHabito: dashboard.eliminarHabito,
        onPosponerHabito: dashboard.posponerHabito,
        onPosponerHabitoConTiempo: dashboard.posponerHabitoConTiempo,
        onPausarHabito: dashboard.pausarHabito,
        onMarcarDiaHabito: ctx.marcarDiaHabitoConSync,
        onDesmarcarDiaHabito: ctx.desmarcarDiaHabitoConSync,
        onActualizarHabito: dashboard.editarHabito,
        onCambiarModoHabitos: ordenHabitos.cambiarModo,
        /* [217A-5] Subhábitos en panel de hábitos */
        onToggleSubHabito: useHabitosStore.getState().toggleSubHabito,
        onConfigurarSubHabito: dashboard.abrirModalEditarSubHabito,
        onPosponerSubHabitoConTiempo: dashboard.posponerSubHabitoConTiempo,
        renderHandleArrastre,
        handleMinimizar
    };
}

export function generarPropsPanelProyectos(
    ctx: PropsContextoPaneles,
    renderHandleArrastre: (titulo?: string) => JSX.Element,
    handleMinimizar: JSX.Element
) {
    const {dashboard, modales, compartir, configProyectos, opciones, limites} = ctx;

    const crearTareaConLimite = (datos: DatosEdicionTarea) => {
        const tareasActivas = dashboard.tareas.filter((t: Tarea) => !t.completado).length;
        if (!limites.verificarYMostrar('tareasActivas', tareasActivas)) return;
        dashboard.crearTarea(datos);
    };

    return {
        proyectos: dashboard.proyectos || [],
        tareas: dashboard.tareas,
        configuracion: configProyectos.configuracion,
        opcionesOrdenProyectos: opciones.opcionesOrdenProyectos,
        onAbrirModalCrearProyecto: () => modales.abrirCreacionRapida('proyecto'),
        onAbrirModalEditarProyecto: modales.abrirModalEditarProyecto,
        onAbrirModalConfigProyectos: () => modales.abrirModalConfigGlobal('proyectos'),
        onEliminarProyecto: dashboard.eliminarProyecto,
        onCambiarEstadoProyecto: dashboard.cambiarEstadoProyecto,
        onCambiarOrdenProyectos: configProyectos.cambiarOrdenDefecto,
        onCompartirProyecto: compartir.manejarCompartirProyecto,
        estaCompartido: compartir.estaCompartidoProyecto,
        onToggleTarea: dashboard.toggleTarea,
        onCrearTarea: crearTareaConLimite,
        onEditarTarea: dashboard.editarTarea,
        onEliminarTarea: dashboard.eliminarTarea,
        onReordenarTareas: dashboard.reordenarTareas,
        renderHandleArrastre,
        handleMinimizar,
        modoCompacto: configProyectos.configuracion.modoCompacto,
        onAbrirModalCrearTarea: (proyectoId: number) => modales.abrirCreacionRapida('tarea', {proyectoId})
    };
}

export function generarPropsPanelScratchpad(
    ctx: PropsContextoPaneles,
    renderHandleArrastre: (titulo?: string) => JSX.Element,
    handleMinimizar: JSX.Element
) {
    const {modales, configScratchpad} = ctx;
    return {
        configuracion: configScratchpad.configuracion,
        onAbrirModalConfigScratchpad: () => modales.abrirModalConfigGlobal('notas'),
        onCambiarAltura: configScratchpad.cambiarAltura,
        renderHandleArrastre,
        handleMinimizar
    };
}

export function generarPropsPanelActividad(
    ctx: PropsContextoPaneles,
    renderHandleArrastre: (titulo?: string) => JSX.Element,
    handleMinimizar: JSX.Element
) {
    const {modales, configActividad} = ctx;
    return {
        configuracion: configActividad.configuracion,
        onAbrirModalConfigActividad: () => modales.abrirModalConfigGlobal('actividad'),
        onAbrirUpgrade: modales.abrirModalUpgrade,
        renderHandleArrastre,
        handleMinimizar
    };
}

export function generarPropsPanelAyuno(
    ctx: PropsContextoPaneles,
    renderHandleArrastre: (titulo?: string) => JSX.Element,
    handleMinimizar: JSX.Element,
    esMovilActual = false
) {
    const {dashboard, modales} = ctx;

    const configAyuno = usePluginsStore.getState().configuracionPlugins['ayuno'] as unknown as {habitoId?: number} | undefined;
    const habitoAyuno = configAyuno?.habitoId ? dashboard.habitos.find((h: Habito) => h.id === configAyuno.habitoId) : undefined;

    return {
        renderHandleArrastre,
        handleMinimizar,
        onAbrirConfiguracion: () => {
            if (!habitoAyuno) return;
            if (esMovilActual) {
                modales.abrirEdicionHabitoMovil(habitoAyuno);
            } else {
                dashboard.abrirModalEditarHabito(habitoAyuno);
            }
        }
    };
}

export function generarPropsPanelDeficitCalorico(
    ctx: PropsContextoPaneles,
    renderHandleArrastre: (titulo?: string) => JSX.Element,
    handleMinimizar: JSX.Element
) {
    const {modales} = ctx;
    return {
        renderHandleArrastre,
        handleMinimizar,
        onAbrirConfiguracion: () => modales.abrirModalConfigGlobal('deficitCalorico')
    };
}

/* [233A-69] Panel IA: props base + ejecutores de tareas para acciones del LLM.
 * Hábitos se leen directamente del store Zustand (habitosStore).
 * [243A-1] onAbrirConfigIA abre el modal global en sección 'panelIA'. */
export function generarPropsPanelIA(
    ctx: PropsContextoPaneles,
    renderHandleArrastre: (titulo?: string) => JSX.Element,
    handleMinimizar: JSX.Element
) {
    return {
        renderHandleArrastre,
        handleMinimizar,
        crearTarea: ctx.dashboard.crearTarea,
        toggleTarea: ctx.dashboard.toggleTarea,
        editarTarea: ctx.dashboard.editarTarea,
        eliminarTarea: ctx.dashboard.eliminarTarea,
        tareas: ctx.dashboard.tareas,
        onAbrirConfigIA: () => ctx.modales.abrirModalConfigGlobal('panelIA')
    };
}

/* [253A-11] Props para PanelGruposFb
 * [263A-5] Agrega callback para abrir config (token, API URL) */
export function generarPropsPanelRecordatorios(
    _ctx: PropsContextoPaneles,
    renderHandleArrastre: (titulo?: string) => JSX.Element,
    handleMinimizar: JSX.Element
) {
    return {renderHandleArrastre, handleMinimizar};
}

export function generarPropsPanelGruposFb(
    ctx: PropsContextoPaneles,
    renderHandleArrastre: (titulo?: string) => JSX.Element,
    handleMinimizar: JSX.Element
) {
    return {
        renderHandleArrastre,
        handleMinimizar,
        onAbrirConfigGruposFb: () => ctx.modales.abrirModalConfigGlobal('gruposFb')
    };
}

/*
 * Mapeo de panelId a función generadora de props
 * TO-DO: En el futuro, cada panel podría registrar su propia función generadora
 */
export const GENERADORES_PROPS: Record<string, Function> = {
    ejecucion: generarPropsPanelEjecucion,
    focoPrioritario: generarPropsPanelFocoPrioritario,
    proyectos: generarPropsPanelProyectos,
    scratchpad: generarPropsPanelScratchpad,
    actividad: generarPropsPanelActividad,
    ayuno: generarPropsPanelAyuno,
    'deficit-calorico': generarPropsPanelDeficitCalorico,
    ia: generarPropsPanelIA,
    /* [253A-11] Panel Grupos FB — solo necesita props base */
    gruposFb: generarPropsPanelGruposFb,
    recordatorios: generarPropsPanelRecordatorios
};

export function obtenerGeneradorPropsPanel(panelId: string, baseId: string): Function {
    return GENERADORES_PROPS[panelId] || GENERADORES_PROPS[baseId] || generarPropsPanelBase;
}
