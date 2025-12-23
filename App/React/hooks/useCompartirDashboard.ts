/*
 * useCompartirDashboard
 * Hook para gestionar la lógica de compartir proyectos y tareas en el dashboard
 * Responsabilidad única: manejar estado y acciones de compartir
 */

import {useState, useCallback} from 'react';
import {useCompartidos} from './useCompartidos';
import type {Proyecto, Tarea, RolCompartido, Participante} from '../types/dashboard';

interface UseCompartirDashboardProps {
    proyectos?: Proyecto[];
}

interface UseCompartirDashboardReturn {
    /* Estado de compartir proyecto */
    proyectoCompartiendo: Proyecto | null;
    participantesProyecto: Participante[];
    /* Estado de compartir tarea */
    tareaCompartiendo: Tarea | null;
    participantesTarea: Participante[];
    /* Cache de participantes */
    cacheParticipantesProyecto: Map<number, Participante[]>;
    /* Acciones de proyecto */
    manejarCompartirProyecto: (proyecto: Proyecto) => Promise<void>;
    manejarCompartirElemento: (usuarioId: number, rol: RolCompartido) => Promise<boolean>;
    manejarCambiarRolCompartido: (compartidoId: number, nuevoRol: RolCompartido) => Promise<boolean>;
    manejarDejarDeCompartir: (compartidoId: number) => Promise<boolean>;
    cerrarModalCompartirProyecto: () => void;
    /* Acciones de tarea */
    manejarCompartirTarea: (tarea: Tarea) => Promise<void>;
    manejarCompartirTareaElemento: (usuarioId: number, rol: RolCompartido) => Promise<boolean>;
    manejarCambiarRolTareaCompartida: (compartidoId: number, nuevoRol: RolCompartido) => Promise<boolean>;
    cerrarModalCompartirTarea: () => void;
    /* Utilidades */
    obtenerParticipantesTarea: (tarea: Tarea) => Participante[];
    estaCompartidoProyecto: (id: number) => boolean;
    estaCompartidaTarea: (id: number) => boolean;
    cargando: boolean;
}

export function useCompartirDashboard({proyectos}: UseCompartirDashboardProps): UseCompartirDashboardReturn {
    const compartidos = useCompartidos();

    /* Estado de compartir proyecto */
    const [proyectoCompartiendo, setProyectoCompartiendo] = useState<Proyecto | null>(null);
    const [participantesProyecto, setParticipantesProyecto] = useState<Participante[]>([]);

    /* Estado de compartir tarea */
    const [tareaCompartiendo, setTareaCompartiendo] = useState<Tarea | null>(null);
    const [participantesTarea, setParticipantesTarea] = useState<Participante[]>([]);

    /* Cache de participantes por proyecto para asignación de tareas */
    const [cacheParticipantesProyecto, setCacheParticipantesProyecto] = useState<Map<number, Participante[]>>(new Map());

    /*
     * Manejador para compartir proyecto
     */
    const manejarCompartirProyecto = useCallback(
        async (proyecto: Proyecto) => {
            setProyectoCompartiendo(proyecto);
            const parts = await compartidos.obtenerParticipantes('proyecto', proyecto.id);
            setParticipantesProyecto(parts);
            setCacheParticipantesProyecto(prev => new Map(prev).set(proyecto.id, parts));
        },
        [compartidos]
    );

    const cerrarModalCompartirProyecto = useCallback(() => {
        setProyectoCompartiendo(null);
    }, []);

    /*
     * Compartir elemento (proyecto)
     */
    const manejarCompartirElemento = useCallback(
        async (usuarioId: number, rol: RolCompartido): Promise<boolean> => {
            if (!proyectoCompartiendo) return false;
            const exito = await compartidos.compartir('proyecto', proyectoCompartiendo.id, usuarioId, rol);
            if (exito) {
                const parts = await compartidos.obtenerParticipantes('proyecto', proyectoCompartiendo.id);
                setParticipantesProyecto(parts);
                setCacheParticipantesProyecto(prev => new Map(prev).set(proyectoCompartiendo.id, parts));
            }
            return exito;
        },
        [proyectoCompartiendo, compartidos]
    );

    /*
     * Cambiar rol de compartido (proyecto)
     */
    const manejarCambiarRolCompartido = useCallback(
        async (compartidoId: number, nuevoRol: RolCompartido): Promise<boolean> => {
            const exito = await compartidos.actualizarRol(compartidoId, nuevoRol);
            if (exito && proyectoCompartiendo) {
                const parts = await compartidos.obtenerParticipantes('proyecto', proyectoCompartiendo.id);
                setParticipantesProyecto(parts);
                setCacheParticipantesProyecto(prev => new Map(prev).set(proyectoCompartiendo.id, parts));
            }
            return exito;
        },
        [proyectoCompartiendo, compartidos]
    );

    /*
     * Dejar de compartir (funciona para proyecto y tarea)
     */
    const manejarDejarDeCompartir = useCallback(
        async (compartidoId: number): Promise<boolean> => {
            const exito = await compartidos.dejarDeCompartir(compartidoId);
            if (exito && proyectoCompartiendo) {
                const parts = await compartidos.obtenerParticipantes('proyecto', proyectoCompartiendo.id);
                setParticipantesProyecto(parts);
                setCacheParticipantesProyecto(prev => new Map(prev).set(proyectoCompartiendo.id, parts));
            }
            if (exito && tareaCompartiendo) {
                const parts = await compartidos.obtenerParticipantes('tarea', tareaCompartiendo.id);
                setParticipantesTarea(parts);
            }
            return exito;
        },
        [proyectoCompartiendo, tareaCompartiendo, compartidos]
    );

    /*
     * Manejador para compartir tarea
     */
    const manejarCompartirTarea = useCallback(
        async (tarea: Tarea) => {
            setTareaCompartiendo(tarea);
            const parts = await compartidos.obtenerParticipantes('tarea', tarea.id);
            setParticipantesTarea(parts);
        },
        [compartidos]
    );

    const cerrarModalCompartirTarea = useCallback(() => {
        setTareaCompartiendo(null);
    }, []);

    /*
     * Compartir elemento (tarea)
     */
    const manejarCompartirTareaElemento = useCallback(
        async (usuarioId: number, rol: RolCompartido): Promise<boolean> => {
            if (!tareaCompartiendo) return false;
            const exito = await compartidos.compartir('tarea', tareaCompartiendo.id, usuarioId, rol);
            if (exito) {
                const parts = await compartidos.obtenerParticipantes('tarea', tareaCompartiendo.id);
                setParticipantesTarea(parts);
            }
            return exito;
        },
        [tareaCompartiendo, compartidos]
    );

    /*
     * Cambiar rol de compartido (tarea)
     */
    const manejarCambiarRolTareaCompartida = useCallback(
        async (compartidoId: number, nuevoRol: RolCompartido): Promise<boolean> => {
            const exito = await compartidos.actualizarRol(compartidoId, nuevoRol);
            if (exito && tareaCompartiendo) {
                const parts = await compartidos.obtenerParticipantes('tarea', tareaCompartiendo.id);
                setParticipantesTarea(parts);
            }
            return exito;
        },
        [tareaCompartiendo, compartidos]
    );

    /*
     * Obtiene los participantes disponibles para asignar a una tarea
     * Prioridad: 1) Si pertenece a un proyecto compartido, usa participantes del proyecto
     *            2) Si la tarea está compartida directamente, no tiene participantes adicionales
     *            3) Si no está compartida, array vacío
     */
    const obtenerParticipantesTarea = useCallback(
        (tarea: Tarea): Participante[] => {
            if (tarea.proyectoId) {
                const participantesDelProyecto = cacheParticipantesProyecto.get(tarea.proyectoId);
                if (participantesDelProyecto && participantesDelProyecto.length > 0) {
                    return participantesDelProyecto;
                }
                const proyecto = proyectos?.find(p => p.id === tarea.proyectoId);
                if (proyecto?.esCompartido || compartidos.estaCompartido('proyecto', tarea.proyectoId)) {
                    compartidos.obtenerParticipantes('proyecto', tarea.proyectoId).then(parts => {
                        if (parts.length > 0) {
                            setCacheParticipantesProyecto(prev => new Map(prev).set(tarea.proyectoId!, parts));
                        }
                    });
                }
            }
            return [];
        },
        [cacheParticipantesProyecto, proyectos, compartidos]
    );

    /* Utilidades de verificación */
    const estaCompartidoProyecto = useCallback(
        (id: number) => {
            return compartidos.estaCompartido('proyecto', id);
        },
        [compartidos]
    );

    const estaCompartidaTarea = useCallback(
        (id: number) => {
            return compartidos.estaCompartido('tarea', id);
        },
        [compartidos]
    );

    return {
        proyectoCompartiendo,
        participantesProyecto,
        tareaCompartiendo,
        participantesTarea,
        cacheParticipantesProyecto,
        manejarCompartirProyecto,
        manejarCompartirElemento,
        manejarCambiarRolCompartido,
        manejarDejarDeCompartir,
        cerrarModalCompartirProyecto,
        manejarCompartirTarea,
        manejarCompartirTareaElemento,
        manejarCambiarRolTareaCompartida,
        cerrarModalCompartirTarea,
        obtenerParticipantesTarea,
        estaCompartidoProyecto,
        estaCompartidaTarea,
        cargando: compartidos.cargando
    };
}
