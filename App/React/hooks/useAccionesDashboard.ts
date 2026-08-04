/*
 * useAccionesDashboard
 * Hook para gestionar las acciones y callbacks del dashboard
 * Responsabilidad única: centralizar manejadores de eventos del dashboard
 */

import {useCallback} from 'react';
import {useAlertasContext} from '../context/AlertasContext';
import {invalidarCache} from '../services/actividadStore';
import {useHabitosHistorialStore} from '../stores/habitosHistorialStore';
import type {Proyecto, NivelPrioridad, NivelUrgencia, TareaConfiguracion, DatosEdicionTarea, Notificacion} from '../types/dashboard';
import type {DatosNuevoProyecto} from './useProyectos';
import type {EstadoFiltro} from './useFiltroTareas';

interface UseAccionesDashboardProps {
    filtroActual: EstadoFiltro;
    notas: string;
    crearTarea: (datos: {texto: string; prioridad: NivelPrioridad | null; urgencia?: NivelUrgencia | null; configuracion: TareaConfiguracion; proyectoId?: number; completado: boolean; tags?: string[]; dependencias?: import('../types/dashboard').ReferenciaDependencia[]; grupoEjecucion?: string | null}) => void;
    editarTarea: (id: number, datos: DatosEdicionTarea) => void;
    actualizarNotas: (notas: string) => void;
    crearProyecto: (datos: DatosNuevoProyecto) => void;
    editarProyecto: (id: number, datos: Partial<Proyecto>) => void;
    proyectoEditando: Proyecto | null;
    cambiarFiltro: (filtro: EstadoFiltro) => void;
    cerrarModalNuevaTarea: () => void;
    cerrarModalEditarTarea: () => void;
    cerrarModalCrearProyecto: () => void;
    cerrarModalEditarProyecto: () => void;
    abrirModalEquipos: () => void;
    abrirModalNotificaciones: (evento: React.MouseEvent) => void;
    cerrarModalNotificaciones: () => void;
    modalNotificacionesAbierto: boolean;
    cargarNotificaciones: () => void;
    refrescarNotificaciones: () => void;
}

interface UseAccionesDashboardReturn {
    manejarCambioFiltro: (valor: string) => void;
    manejarLimpiarScratchpad: () => Promise<void>;
    manejarCrearNuevaTareaGlobal: (configuracion: TareaConfiguracion, prioridad: NivelPrioridad | null, texto?: string, asignacion?: {asignadoA: number | null; asignadoANombre: string; asignadoAAvatar: string}, urgencia?: NivelUrgencia | null, tags?: string[], proyectoIdOverride?: number, dependencias?: import('../types/dashboard').ReferenciaDependencia[], grupoEjecucion?: string | null) => void;
    manejarGuardarNuevoProyecto: (datos: DatosNuevoProyecto) => void;
    manejarGuardarEdicionProyecto: (datos: Partial<Proyecto>) => void;
    manejarGuardarEdicionTareaGlobal: (tareaId: number, configuracion: TareaConfiguracion, prioridad: NivelPrioridad | null, texto?: string, asignacion?: {asignadoA: number | null; asignadoANombre: string; asignadoAAvatar: string}, urgencia?: NivelUrgencia | null, tags?: string[], dependencias?: import('../types/dashboard').ReferenciaDependencia[], grupoEjecucion?: string | null) => void;
    manejarClickNotificaciones: (evento: React.MouseEvent) => void;
    manejarClickNotificacionIndividual: (notificacion: Notificacion) => void;
    crearNotificacionPrueba: () => Promise<boolean>;
    limpiarActividadCompleta: () => Promise<boolean>;
}

export function useAccionesDashboard(props: UseAccionesDashboardProps): UseAccionesDashboardReturn {
    const {filtroActual, notas, crearTarea, editarTarea, actualizarNotas, crearProyecto, editarProyecto, proyectoEditando, cambiarFiltro, cerrarModalNuevaTarea, cerrarModalEditarTarea, cerrarModalCrearProyecto, cerrarModalEditarProyecto, abrirModalEquipos, abrirModalNotificaciones, cerrarModalNotificaciones, modalNotificacionesAbierto, cargarNotificaciones, refrescarNotificaciones} = props;

    const {confirmar} = useAlertasContext();

    const manejarCambioFiltro = useCallback(
        (valor: string) => {
            if (valor === 'sueltas') cambiarFiltro({tipo: 'sueltas'});
            else if (valor === 'todas') cambiarFiltro({tipo: 'todas'});
            else if (valor === 'asignadas') cambiarFiltro({tipo: 'asignadas'});
            else if (valor.startsWith('proyecto-')) {
                const id = parseInt(valor.replace('proyecto-', ''), 10);
                cambiarFiltro({tipo: 'proyecto', proyectoId: id});
            }
        },
        [cambiarFiltro]
    );

    const manejarLimpiarScratchpad = useCallback(async () => {
        if (!notas || notas.trim() === '') return;
        const confirmado = await confirmar({
            titulo: 'Limpiar Scratchpad',
            mensaje: '¿Estás seguro de que quieres borrar todo el contenido del Scratchpad? Esta acción no se puede deshacer.',
            textoAceptar: 'Limpiar',
            textoCancelar: 'Cancelar',
            tipo: 'advertencia'
        });
        if (confirmado) actualizarNotas('');
    }, [notas, confirmar, actualizarNotas]);

    const manejarCrearNuevaTareaGlobal = useCallback(
        (configuracion: TareaConfiguracion, prioridad: NivelPrioridad | null, texto?: string, _asignacion?: {asignadoA: number | null; asignadoANombre: string; asignadoAAvatar: string}, urgencia?: NivelUrgencia | null, tags?: string[], proyectoIdOverride?: number, dependencias?: import('../types/dashboard').ReferenciaDependencia[], grupoEjecucion?: string | null) => {
            if (!texto) return;
            const proyectoId = proyectoIdOverride !== undefined ? proyectoIdOverride : filtroActual.tipo === 'proyecto' ? filtroActual.proyectoId : undefined;
            crearTarea({texto, prioridad, urgencia, configuracion, proyectoId, completado: false, tags, dependencias, grupoEjecucion});
            cerrarModalNuevaTarea();
        },
        [filtroActual, crearTarea, cerrarModalNuevaTarea]
    );

    const manejarGuardarEdicionTareaGlobal = useCallback(
        (tareaId: number, configuracion: TareaConfiguracion, prioridad: NivelPrioridad | null, texto?: string, asignacion?: {asignadoA: number | null; asignadoANombre: string; asignadoAAvatar: string}, urgencia?: NivelUrgencia | null, tags?: string[], dependencias?: import('../types/dashboard').ReferenciaDependencia[], grupoEjecucion?: string | null) => {
            if (texto !== undefined && !texto) return; /* Si se pasa texto vacio */

            const datosEdicion: DatosEdicionTarea = {
                configuracion
            };

            if (texto !== undefined) datosEdicion.texto = texto;
            if (prioridad !== undefined) datosEdicion.prioridad = prioridad;
            if (urgencia !== undefined) datosEdicion.urgencia = urgencia;
            if (tags !== undefined) datosEdicion.tags = tags;
            if (asignacion) {
                datosEdicion.asignadoA = asignacion.asignadoA;
                datosEdicion.asignadoANombre = asignacion.asignadoANombre;
                datosEdicion.asignadoAAvatar = asignacion.asignadoAAvatar;
            }
            if (dependencias !== undefined) datosEdicion.dependencias = dependencias;
            if (grupoEjecucion !== undefined) datosEdicion.grupoEjecucion = grupoEjecucion;

            editarTarea(tareaId, datosEdicion);
            cerrarModalEditarTarea();
        },
        [editarTarea, cerrarModalEditarTarea]
    );

    const manejarGuardarNuevoProyecto = useCallback(
        (datos: DatosNuevoProyecto) => {
            crearProyecto(datos);
            cerrarModalCrearProyecto();
        },
        [crearProyecto, cerrarModalCrearProyecto]
    );

    const manejarGuardarEdicionProyecto = useCallback(
        (datos: Partial<Proyecto>) => {
            if (proyectoEditando) {
                editarProyecto(proyectoEditando.id, datos);
                cerrarModalEditarProyecto();
            }
        },
        [proyectoEditando, editarProyecto, cerrarModalEditarProyecto]
    );

    const manejarClickNotificaciones = useCallback(
        (evento: React.MouseEvent) => {
            abrirModalNotificaciones(evento);
            if (!modalNotificacionesAbierto) {
                cargarNotificaciones();
            }
        },
        [abrirModalNotificaciones, modalNotificacionesAbierto, cargarNotificaciones]
    );

    const manejarClickNotificacionIndividual = useCallback(
        (notificacion: Notificacion) => {
            if (notificacion.tipo === 'solicitud_equipo') {
                abrirModalEquipos();
                cerrarModalNotificaciones();
            }
        },
        [abrirModalEquipos, cerrarModalNotificaciones]
    );

    const crearNotificacionPrueba = useCallback(async (): Promise<boolean> => {
        try {
            const nonce = (window as unknown as {gloryDashboard?: {nonce?: string}}).gloryDashboard?.nonce || '';
            const response = await fetch('/wp-json/glory/v1/notificaciones/test', {
                method: 'POST',
                headers: {'Content-Type': 'application/json', 'X-WP-Nonce': nonce},
                body: JSON.stringify({tipo: 'solicitud_equipo', titulo: 'Notificación de prueba', contenido: 'Esta es una notificación de prueba.'})
            });
            const data = await response.json();
            if (data.success) {
                refrescarNotificaciones();
                return true;
            }
            return false;
        } catch {
            return false;
        }
    }, [refrescarNotificaciones]);

    const limpiarActividadCompleta = useCallback(async (): Promise<boolean> => {
        try {
            const nonce = (window as unknown as {gloryDashboard?: {nonce?: string}}).gloryDashboard?.nonce || '';
            const response = await fetch('/wp-json/glory/v1/actividad/limpiar', {
                method: 'DELETE',
                headers: {'Content-Type': 'application/json', 'X-WP-Nonce': nonce}
            });
            const data = await response.json();
            if (data.success) {
                /* Limpiar cache local de actividad y historial */
                invalidarCache();
                useHabitosHistorialStore.getState().limpiarTodoHistorialDetallado();
                return true;
            }
            return false;
        } catch {
            return false;
        }
    }, []);

    return {
        manejarCambioFiltro,
        manejarLimpiarScratchpad,
        manejarCrearNuevaTareaGlobal,
        manejarGuardarEdicionTareaGlobal,
        manejarGuardarNuevoProyecto,
        manejarGuardarEdicionProyecto,
        manejarClickNotificaciones,
        manejarClickNotificacionIndividual,
        crearNotificacionPrueba,
        limpiarActividadCompleta
    };
}
