/*
 * useAccionesDashboard
 * Hook para gestionar las acciones y callbacks del dashboard
 * Responsabilidad única: centralizar manejadores de eventos del dashboard
 */

import {useCallback} from 'react';
import {useAlertasContext} from '../context/AlertasContext';
import type {Proyecto, NivelPrioridad, TareaConfiguracion} from '../types/dashboard';
import type {EstadoFiltro} from './useFiltroTareas';

interface UseAccionesDashboardProps {
    filtroActual: EstadoFiltro;
    notas: string;
    crearTarea: (datos: {texto: string; prioridad: NivelPrioridad | null; configuracion: TareaConfiguracion; proyectoId?: number; completado: boolean}) => void;
    actualizarNotas: (notas: string) => void;
    crearProyecto: (datos: any) => void;
    editarProyecto: (id: number, datos: any) => void;
    proyectoEditando: Proyecto | null;
    cambiarFiltro: (filtro: EstadoFiltro) => void;
    cerrarModalNuevaTarea: () => void;
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
    manejarCrearNuevaTareaGlobal: (configuracion: TareaConfiguracion, prioridad: NivelPrioridad | null, texto?: string) => void;
    manejarGuardarNuevoProyecto: (datos: any) => void;
    manejarGuardarEdicionProyecto: (datos: any) => void;
    manejarClickNotificaciones: (evento: React.MouseEvent) => void;
    manejarClickNotificacionIndividual: (notificacion: any) => void;
    crearNotificacionPrueba: () => Promise<boolean>;
}

export function useAccionesDashboard(props: UseAccionesDashboardProps): UseAccionesDashboardReturn {
    const {filtroActual, notas, crearTarea, actualizarNotas, crearProyecto, editarProyecto, proyectoEditando, cambiarFiltro, cerrarModalNuevaTarea, cerrarModalCrearProyecto, cerrarModalEditarProyecto, abrirModalEquipos, abrirModalNotificaciones, cerrarModalNotificaciones, modalNotificacionesAbierto, cargarNotificaciones, refrescarNotificaciones} = props;

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
        (configuracion: TareaConfiguracion, prioridad: NivelPrioridad | null, texto?: string) => {
            if (!texto) return;
            const proyectoId = filtroActual.tipo === 'proyecto' ? filtroActual.proyectoId : undefined;
            crearTarea({texto, prioridad, configuracion, proyectoId, completado: false});
            cerrarModalNuevaTarea();
        },
        [filtroActual, crearTarea, cerrarModalNuevaTarea]
    );

    const manejarGuardarNuevoProyecto = useCallback(
        (datos: any) => {
            crearProyecto(datos);
            cerrarModalCrearProyecto();
        },
        [crearProyecto, cerrarModalCrearProyecto]
    );

    const manejarGuardarEdicionProyecto = useCallback(
        (datos: any) => {
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
        (notificacion: any) => {
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

    return {
        manejarCambioFiltro,
        manejarLimpiarScratchpad,
        manejarCrearNuevaTareaGlobal,
        manejarGuardarNuevoProyecto,
        manejarGuardarEdicionProyecto,
        manejarClickNotificaciones,
        manejarClickNotificacionIndividual,
        crearNotificacionPrueba
    };
}
