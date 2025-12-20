/*
 * useTareas
 * Hook personalizado para la lógica de tareas
 * Responsabilidad única: CRUD y reordenamiento de tareas
 */

import {useCallback} from 'react';
import type {Tarea, DatosEdicionTarea} from '../types/dashboard';
import {obtenerFechaHoy} from '../utils/fecha';
import {obtenerSubtareas} from '../utils/jerarquiaTareas';

export interface UseTareasParams {
    tareas: Tarea[];
    setTareas: React.Dispatch<React.SetStateAction<Tarea[]>>;
    registrarAccion: (mensaje: string, deshacer: () => void) => void;
    mostrarMensaje?: (mensaje: string, tipo: 'exito' | 'error') => void;
}

export interface UseTareasReturn {
    toggleTarea: (id: number) => void;
    crearTarea: (datos: DatosEdicionTarea) => void;
    editarTarea: (id: number, datos: DatosEdicionTarea) => void;
    eliminarTarea: (id: number) => void;
    reordenarTareas: (tareas: Tarea[]) => void;
}

export function useTareas({tareas, setTareas, registrarAccion, mostrarMensaje}: UseTareasParams): UseTareasReturn {
    /*
     * Toggle de tarea: completa o desmarca con soporte de deshacer
     */
    const toggleTarea = useCallback(
        (id: number) => {
            const tarea = tareas.find(t => t.id === id);
            if (!tarea) return;

            const estadoAnterior = tarea.completado;
            const accion = estadoAnterior ? 'pendiente' : 'completada';

            setTareas(prev => prev.map(t => (t.id === id ? {...t, completado: !t.completado} : t)));

            registrarAccion(`Tarea "${tarea.texto.substring(0, 30)}..." ${accion}`, () => {
                setTareas(prev => prev.map(t => (t.id === id ? {...t, completado: estadoAnterior} : t)));
            });
        },
        [tareas, setTareas, registrarAccion]
    );

    /*
     * Crear una nueva tarea
     * Acepta DatosEdicionTarea para soportar creación de subtareas (con parentId)
     * Si se proporciona insertarDespuesDe, inserta después de esa tarea
     * Asigna campo orden automáticamente basado en la posición de inserción
     */
    const crearTarea = useCallback(
        (datos: DatosEdicionTarea) => {
            const hoy = obtenerFechaHoy();
            /* Generar ID fuera del callback para poder referenciarlo en deshacer */
            const nuevoId = Date.now();

            setTareas(prev => {
                /* Calcular posición de inserción primero */
                let indiceInsercion: number;

                if (datos.insertarDespuesDe) {
                    const indice = prev.findIndex(t => t.id === datos.insertarDespuesDe);
                    indiceInsercion = indice !== -1 ? indice + 1 : prev.length;
                } else {
                    const primeraCompletada = prev.findIndex(t => t.completado);
                    indiceInsercion = primeraCompletada === -1 ? prev.length : primeraCompletada;
                }

                /* Crear tarea con orden basado en la posición */
                const nuevaTarea: Tarea = {
                    id: nuevoId,
                    texto: datos.texto || 'Nueva tarea',
                    completado: false,
                    fechaCreacion: hoy,
                    prioridad: datos.prioridad ?? undefined,
                    parentId: datos.parentId,
                    orden: indiceInsercion
                };

                /* Insertar y recalcular orden de todas las tareas */
                const nuevaLista = [...prev];
                nuevaLista.splice(indiceInsercion, 0, nuevaTarea);

                /* Actualizar campo orden de todas las tareas */
                return nuevaLista.map((t, idx) => ({...t, orden: idx}));
            });

            registrarAccion(`Tarea creada`, () => {
                setTareas(prev => prev.filter(t => t.id !== nuevoId));
            });
        },
        [setTareas, registrarAccion]
    );

    /*
     * Eliminar una tarea con soporte de deshacer
     * Si la tarea tiene subtareas, las promueve a tareas principales
     */
    const eliminarTarea = useCallback(
        (id: number) => {
            const tareaEliminada = tareas.find(t => t.id === id);
            if (!tareaEliminada) return;

            /* Guardar índice original para restaurar en la misma posición */
            const indiceOriginal = tareas.findIndex(t => t.id === id);

            /* Identificar subtareas que quedarán huérfanas */
            const subtareasHuerfanas = obtenerSubtareas(tareas, id);

            setTareas(prev => {
                /* Eliminar la tarea y promover subtareas huérfanas */
                return prev
                    .filter(t => t.id !== id)
                    .map(t => {
                        /* Si era subtarea de la eliminada, promover a principal */
                        if (t.parentId === id) {
                            const {parentId: _, ...tareaSinParent} = t;
                            return tareaSinParent as Tarea;
                        }
                        return t;
                    });
            });

            const mensajeExtra = subtareasHuerfanas.length > 0 ? ` (${subtareasHuerfanas.length} subtareas promovidas)` : '';
            mostrarMensaje?.(`Tarea eliminada${mensajeExtra}`, 'exito');

            registrarAccion(`Tarea eliminada`, () => {
                setTareas(prev => {
                    /* Restaurar tarea y re-asignar parentId a subtareas */
                    const nuevaLista = [...prev];
                    nuevaLista.splice(indiceOriginal, 0, tareaEliminada);

                    /* Restaurar relación padre-hijo de las subtareas */
                    return nuevaLista.map(t => {
                        const eraSubtarea = subtareasHuerfanas.find(s => s.id === t.id);
                        if (eraSubtarea) {
                            return {...t, parentId: id};
                        }
                        return t;
                    });
                });
            });
        },
        [tareas, setTareas, mostrarMensaje, registrarAccion]
    );

    /*
     * Editar una tarea existente con soporte de deshacer
     */
    const editarTarea = useCallback(
        (id: number, datos: DatosEdicionTarea) => {
            const tareaAnterior = tareas.find(t => t.id === id);
            if (!tareaAnterior) return;

            /* Fusionar datos nuevos con la tarea existente */
            setTareas(prev =>
                prev.map(t => {
                    if (t.id !== id) return t;

                    /*
                     * Crear objeto base excluyendo prioridad de datos si es null
                     * Para prioridad null significa "quitar", así que no la incluimos en el spread
                     */
                    const {prioridad: nuevaPrioridad, configuracion: nuevaConfiguracion, ...restoDatos} = datos;

                    const tareaActualizada: Tarea = {
                        ...t,
                        ...restoDatos
                    };

                    /* Si prioridad es null, eliminar; si tiene valor, asignar */
                    if (nuevaPrioridad === null) {
                        delete tareaActualizada.prioridad;
                    } else if (nuevaPrioridad !== undefined) {
                        tareaActualizada.prioridad = nuevaPrioridad;
                    }

                    /* Manejar configuracion: fusionar con existente o reemplazar */
                    if (nuevaConfiguracion !== undefined) {
                        /* Si hay campos en la configuracion, fusionar; de lo contrario mantener existente */
                        if (Object.keys(nuevaConfiguracion).length > 0) {
                            tareaActualizada.configuracion = {
                                ...t.configuracion,
                                ...nuevaConfiguracion
                            };
                        } else {
                            /* Configuracion vacia significa quitar */
                            delete tareaActualizada.configuracion;
                        }
                    }

                    return tareaActualizada;
                })
            );

            registrarAccion(`Tarea editada`, () => {
                setTareas(prev => prev.map(t => (t.id === id ? tareaAnterior : t)));
            });
        },
        [tareas, setTareas, registrarAccion]
    );

    /*
     * Reordenar tareas (para drag & drop)
     * Recalcula campo orden para mantener consistencia
     */
    const reordenarTareas = useCallback(
        (nuevasTareas: Tarea[]) => {
            /* Recalcular orden de todas las tareas */
            setTareas(nuevasTareas.map((t, idx) => ({...t, orden: idx})));
        },
        [setTareas]
    );

    return {
        toggleTarea,
        crearTarea,
        editarTarea,
        eliminarTarea,
        reordenarTareas
    };
}
