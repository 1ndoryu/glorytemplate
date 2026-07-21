/*
 * useDashboardCompleto
 * Hook de composición que agrupa todos los hooks del Dashboard
 * Simplifica el componente principal evitando múltiples llamadas a hooks
 */

import {useMemo, useCallback} from 'react';
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
import {useConfiguracionActividad} from './useConfiguracionActividad';
import {useArrastrePaneles} from './useArrastrePaneles';
import {useModalesDashboard} from './useModalesDashboard';
import {useCompartirDashboard} from './useCompartirDashboard';
import {useOpcionesDashboard} from './useOpcionesDashboard';
import {useAccionesDashboard} from './useAccionesDashboard';
import {useHabitosComoTareas} from './useHabitosComoTareas';
import {useLimites} from './useLimites';
import {useHabitosStore} from '../stores/habitosStore';
import {useTema} from './useTema';
import type {Tarea} from '../types/dashboard';

export function useDashboardCompleto() {
    const dashboard = useDashboard();
    const auth = useAuth();
    const {suscripcion} = useSuscripcion();
    const esAdmin = Boolean((window as unknown as {gloryDashboard?: {esAdmin?: boolean}}).gloryDashboard?.esAdmin);
    const limites = useLimites();

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
    const configActividad = useConfiguracionActividad();
    const temas = useTema();

    /* Hook para convertir hábitos en tareas virtuales + sus subtareas */
    const toggleSubHabitoStore = useHabitosStore(state => state.toggleSubHabito);
    /* [263A-2] Necesario para interceptar eliminación de subhábitos virtuales en panel ejecución */
    const eliminarSubHabitoStore = useHabitosStore(state => state.eliminarSubHabito);

    const habitosComoTareas = useHabitosComoTareas({
        habitos: dashboard.habitos,
        tareas: dashboard.tareas,
        mostrarHabitos: configTareas.configuracion.mostrarHabitosEnEjecucion,
        onToggleHabito: dashboard.toggleHabito,
        onToggleSubHabito: toggleSubHabitoStore,
        onEliminarSubHabito: eliminarSubHabitoStore,
        umbralesUrgencia: configHabitos.obtenerUmbralesActuales()
    });

    /* Acciones del store de hábitos para marcar/desmarcar días */
    const marcarDiaStore = useHabitosStore(state => state.marcarDia);
    const desmarcarDiaStore = useHabitosStore(state => state.desmarcarDia);

    /*
     * Wrappers para marcar/desmarcar días
     * Ahora usamos directamente el store de Zustand que maneja:
     * - Actualización optimista de la UI
     * - Llamada a la API
     * - Rollback en caso de error
     * - Sincronización de historialDetallado
     */
    const marcarDiaHabitoConSync = useCallback(
        async (habitoId: number, fecha: string, estado: 'completado' | 'pospuesto') => {
            await marcarDiaStore(habitoId, fecha, estado);
        },
        [marcarDiaStore]
    );

    const desmarcarDiaHabitoConSync = useCallback(
        async (habitoId: number, fecha: string) => {
            await desmarcarDiaStore(habitoId, fecha);
        },
        [desmarcarDiaStore]
    );

    /*
     * Combinar tareas filtradas con tareas-hábito (incluye subtareas)
     * NOTA: Cuando el filtro es "asignadas", NO incluir hábitos
     * Los hábitos nunca son "asignados" por otros usuarios
     * Fase 14.8: Usamos tareasConSubtareas para incluir subtareas del hábito
     */
    const tareasConHabitos = useMemo<Tarea[]>(() => {
        /* Si el filtro es "asignadas", solo mostrar tareas reales asignadas */
        if (filtroTareas.filtroActual.tipo === 'asignadas') {
            return filtroTareas.tareasFiltradas;
        }

        /* Excluir tareas con habitoId de las filtradas (se incluyen via tareasConSubtareas) */
        const tareasNoHabito = filtroTareas.tareasFiltradas.filter(t => !t.habitoId);
        return [...tareasNoHabito, ...habitosComoTareas.tareasConSubtareas];
    }, [filtroTareas.tareasFiltradas, filtroTareas.filtroActual.tipo, habitosComoTareas.tareasConSubtareas]);

    /* Ordenar la combinación de tareas + tareas-hábito */
    const ordenTareas = useOrdenarTareas(tareasConHabitos, {
        ignorarUrgencia: configTareas.configuracion.ignorarUrgenciaEnPrioridad
    });

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
        editarTarea: dashboard.editarTarea,
        actualizarNotas: dashboard.actualizarNotas,
        crearProyecto: dashboard.crearProyecto,
        editarProyecto: dashboard.editarProyecto,
        proyectoEditando: modales.proyectoEditando,
        cambiarFiltro: filtroTareas.cambiarFiltro,
        cerrarModalNuevaTarea: modales.cerrarModalNuevaTarea,
        cerrarModalEditarTarea: modales.cerrarModalEditarTarea,
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
        limites,
        modales,
        equipos,
        notificaciones,
        compartir,
        ordenHabitos,
        filtroTareas,
        ordenTareas,
        habitosComoTareas,
        marcarDiaHabitoConSync,
        desmarcarDiaHabitoConSync,
        configTareas,
        configHabitos,
        configProyectos,
        configScratchpad,
        configActividad,
        layout,
        arrastre,
        opciones,
        acciones,
        valorFiltroActual,
        temas
    };
}

export type DashboardCompletoRetorno = ReturnType<typeof useDashboardCompleto>;
