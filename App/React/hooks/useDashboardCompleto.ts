/*
 * useDashboardCompleto
 * Hook de composición que agrupa todos los hooks del Dashboard
 * Simplifica el componente principal evitando múltiples llamadas a hooks
 */

import {useMemo} from 'react';
import {useDashboard} from './useDashboard';
import {useAuth} from './useAuth';
import {useSuscripcion} from './useSuscripcion';
import {useEquipos} from './useEquipos';
import {useNotificaciones} from './useNotificaciones';
import {useOrdenarHabitos} from './useOrdenarHabitos';
import {useFiltroTareas} from './useFiltroTareas';
import {useOrdenarTareas} from './useOrdenarTareas';
import {useConfiguracionLayout} from './useConfiguracionLayout';
import {useConfiguracionTareas} from './useConfiguracionTareas';
import {useConfiguracionHabitos} from './useConfiguracionHabitos';
import {useConfiguracionProyectos} from './useConfiguracionProyectos';
import {useConfiguracionScratchpad} from './useConfiguracionScratchpad';
import {useArrastrePaneles} from './useArrastrePaneles';
import {useModalesDashboard} from './useModalesDashboard';
import {useCompartirDashboard} from './useCompartirDashboard';
import {useOpcionesDashboard} from './useOpcionesDashboard';
import {useAccionesDashboard} from './useAccionesDashboard';
import {useHabitosComoTareas} from './useHabitosComoTareas';
import type {Tarea} from '../types/dashboard';

export function useDashboardCompleto() {
    const dashboard = useDashboard();
    const auth = useAuth();
    const {suscripcion} = useSuscripcion();
    const esAdmin = Boolean((window as unknown as {gloryDashboard?: {esAdmin?: boolean}}).gloryDashboard?.esAdmin);

    const modales = useModalesDashboard();
    const equipos = useEquipos();
    const notificaciones = useNotificaciones(Boolean(auth.user));
    const compartir = useCompartirDashboard({proyectos: dashboard.proyectos});

    const ordenHabitos = useOrdenarHabitos(dashboard.habitos);
    const filtroTareas = useFiltroTareas(dashboard.tareas, dashboard.proyectos || []);

    const configTareas = useConfiguracionTareas();
    const configHabitos = useConfiguracionHabitos();
    const configProyectos = useConfiguracionProyectos();
    const configScratchpad = useConfiguracionScratchpad();

    /* Hook para convertir hábitos en tareas virtuales */
    const habitosComoTareas = useHabitosComoTareas({
        habitos: dashboard.habitos,
        mostrarHabitos: configTareas.configuracion.mostrarHabitosEnEjecucion,
        onToggleHabito: dashboard.toggleHabito
    });

    /* Combinar tareas filtradas con tareas-hábito */
    const tareasConHabitos = useMemo<Tarea[]>(() => {
        return [...filtroTareas.tareasFiltradas, ...habitosComoTareas.tareasHabito];
    }, [filtroTareas.tareasFiltradas, habitosComoTareas.tareasHabito]);

    /* Ordenar la combinación de tareas + tareas-hábito */
    const ordenTareas = useOrdenarTareas(tareasConHabitos);

    const layout = useConfiguracionLayout();
    const arrastre = useArrastrePaneles(layout.ordenPaneles, layout.reordenarPanel);

    const opciones = useOpcionesDashboard({
        proyectos: dashboard.proyectos || [],
        modosOrdenHabitos: ordenHabitos.modosDisponibles,
        contarAsignadas: filtroTareas.contarAsignadas
    });

    const acciones = useAccionesDashboard({
        filtroActual: filtroTareas.filtroActual,
        notas: dashboard.notas,
        crearTarea: dashboard.crearTarea,
        actualizarNotas: dashboard.actualizarNotas,
        crearProyecto: dashboard.crearProyecto,
        editarProyecto: dashboard.editarProyecto,
        proyectoEditando: modales.proyectoEditando,
        cambiarFiltro: filtroTareas.cambiarFiltro,
        cerrarModalNuevaTarea: modales.cerrarModalNuevaTarea,
        cerrarModalCrearProyecto: modales.cerrarModalCrearProyecto,
        cerrarModalEditarProyecto: modales.cerrarModalEditarProyecto,
        abrirModalEquipos: modales.abrirModalEquipos,
        abrirModalNotificaciones: modales.abrirModalNotificaciones,
        cerrarModalNotificaciones: modales.cerrarModalNotificaciones,
        modalNotificacionesAbierto: modales.modalNotificacionesAbierto,
        cargarNotificaciones: notificaciones.cargarNotificaciones,
        refrescarNotificaciones: notificaciones.refrescar
    });

    const valorFiltroActual = filtroTareas.filtroActual.tipo === 'proyecto' ? `proyecto-${filtroTareas.filtroActual.proyectoId}` : filtroTareas.filtroActual.tipo;

    return {
        dashboard,
        auth,
        suscripcion,
        esAdmin,
        modales,
        equipos,
        notificaciones,
        compartir,
        ordenHabitos,
        filtroTareas,
        ordenTareas,
        habitosComoTareas,
        configTareas,
        configHabitos,
        configProyectos,
        configScratchpad,
        layout,
        arrastre,
        opciones,
        acciones,
        valorFiltroActual
    };
}

export type DashboardCompletoRetorno = ReturnType<typeof useDashboardCompleto>;
