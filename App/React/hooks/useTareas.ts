/*
 * useTareas
 * Hook personalizado para la lógica de tareas
 * Responsabilidad única: CRUD y reordenamiento de tareas
 */

import {useCallback} from 'react';
import type {Tarea, DatosEdicionTarea} from '../types/dashboard';
import {obtenerFechaHoy, sumarDias} from '../utils/fecha';
import {obtenerSubtareas} from '../utils/jerarquiaTareas';
import {registrarEventoSistema, type AccionSistema} from './useMensajes';

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

/*
 * Detecta cambios entre la tarea anterior y los nuevos datos
 * Registra cada cambio como un evento en el sistema de historial
 */
function registrarEventosCambios(tareaId: number, tareaAnterior: Tarea, datos: DatosEdicionTarea): void {
    /* Evitar registrar eventos para IDs temporales (creación local) */
    if (tareaId <= 0) return;

    /* Cambio de nombre */
    if (datos.texto !== undefined && datos.texto !== tareaAnterior.texto) {
        registrarEventoSistema('tarea', tareaId, 'nombre', `"${tareaAnterior.texto}" → "${datos.texto}"`);
    }

    /* Cambio de prioridad */
    if (datos.prioridad !== undefined && datos.prioridad !== tareaAnterior.prioridad) {
        const anterior = tareaAnterior.prioridad || 'sin prioridad';
        const nuevo = datos.prioridad || 'sin prioridad';
        registrarEventoSistema('tarea', tareaId, 'prioridad', `${anterior} → ${nuevo}`);
    }

    /* Cambio de urgencia */
    if (datos.urgencia !== undefined && datos.urgencia !== tareaAnterior.urgencia) {
        const anterior = tareaAnterior.urgencia || 'normal';
        const nuevo = datos.urgencia || 'normal';
        registrarEventoSistema('tarea', tareaId, 'urgencia', `${anterior} → ${nuevo}`);
    }

    /* Cambio de fecha límite */
    const fechaAnterior = tareaAnterior.configuracion?.fechaMaxima;
    const fechaNueva = datos.configuracion?.fechaMaxima;
    if (fechaNueva !== undefined && fechaNueva !== fechaAnterior) {
        const anterior = fechaAnterior || 'sin fecha';
        const nuevo = fechaNueva || 'sin fecha';
        registrarEventoSistema('tarea', tareaId, 'fecha_limite', `${anterior} → ${nuevo}`);
    }

    /* Cambio de descripción */
    const descAnterior = tareaAnterior.configuracion?.descripcion;
    const descNueva = datos.configuracion?.descripcion;
    if (descNueva !== undefined && descNueva !== descAnterior) {
        registrarEventoSistema('tarea', tareaId, 'descripcion');
    }

    /* Cambio de asignación */
    if (datos.asignadoA !== undefined && datos.asignadoA !== tareaAnterior.asignadoA) {
        if (datos.asignadoA === null && tareaAnterior.asignadoA) {
            /* Desasignación: solo si había alguien asignado previamente */
            registrarEventoSistema('tarea', tareaId, 'desasignado', tareaAnterior.asignadoANombre || 'usuario');
        } else if (datos.asignadoA && !tareaAnterior.asignadoA && datos.asignadoANombre) {
            /* Nueva asignación: solo si hay un nombre válido */
            registrarEventoSistema('tarea', tareaId, 'asignado', datos.asignadoANombre);
        } else if (datos.asignadoA && tareaAnterior.asignadoA && datos.asignadoANombre) {
            /* Cambio de asignación: solo si ambos nombres están disponibles */
            registrarEventoSistema('tarea', tareaId, 'asignado', `${tareaAnterior.asignadoANombre || 'anterior'} → ${datos.asignadoANombre}`);
        }
    }
}

export function useTareas({tareas, setTareas, registrarAccion, mostrarMensaje}: UseTareasParams): UseTareasReturn {
    /*
     * Toggle de tarea: completa o desmarca con soporte de deshacer
     */
    /*
     * Toggle de tarea: completa o desmarca con soporte de deshacer
     * Maneja la logica de repeticion autogenerando nuevas tareas
     */
    const toggleTarea = useCallback(
        (id: number) => {
            const tarea = tareas.find(t => t.id === id);
            if (!tarea) return;

            const estadoAnterior = tarea.completado;
            const accion = estadoAnterior ? 'pendiente' : 'completada';

            /* Logica de Repeticion: Generar nueva tarea si se completa y tiene repeticion */
            let nuevaTareaRepetida: Tarea | null = null;

            if (!estadoAnterior && tarea.configuracion?.repeticion) {
                const {tipo, intervalo} = tarea.configuracion.repeticion;

                /* Verificar duplicados pendientes para no spammear */
                const yaExiste = tareas.some(t => t.texto === tarea.texto && !t.completado && t.id !== id);

                if (!yaExiste && intervalo > 0) {
                    const hoy = obtenerFechaHoy();
                    let nuevaFechaMaxima = '';

                    if (tipo === 'despuesCompletar') {
                        nuevaFechaMaxima = sumarDias(hoy, intervalo);
                    } else {
                        /* intervaloFijo: Sumar a la fecha maxima anterior o a hoy si no existe */
                        const base = tarea.configuracion.fechaMaxima || hoy;
                        nuevaFechaMaxima = sumarDias(base, intervalo);
                    }

                    /* Crear la nueva instancia de la tarea */
                    nuevaTareaRepetida = {
                        ...tarea,
                        id: Date.now() /* Nuevo ID unico */,
                        completado: false,
                        fechaCreacion: hoy,
                        fechaCompletado: undefined,
                        orden: 0 /* Se colocara al inicio */,
                        configuracion: {
                            ...tarea.configuracion,
                            fechaMaxima: nuevaFechaMaxima,
                            repeticion: {
                                ...tarea.configuracion.repeticion,
                                ultimaRepeticion: hoy
                            }
                        }
                    };
                }
            }

            setTareas(prev => {
                const actualizadas = prev.map(t => (t.id === id ? {...t, completado: !t.completado} : t));

                if (nuevaTareaRepetida) {
                    /* Insertar al inicio y recalcular ordenes */
                    const listaConNueva = [nuevaTareaRepetida, ...actualizadas];
                    return listaConNueva.map((t, i) => ({...t, orden: i}));
                }

                return actualizadas;
            });

            /* Registrar evento en el sistema de historial */
            const accionSistema: AccionSistema = estadoAnterior ? 'reabierto' : 'completado';
            registrarEventoSistema('tarea', id, accionSistema);

            registrarAccion(`Tarea "${tarea.texto.substring(0, 30)}..." ${accion}`, () => {
                setTareas(prev => {
                    /* Restaurar estado original y eliminar tarea generada si existe */
                    let listaRestaurada = prev.filter(t => t.id !== nuevaTareaRepetida?.id).map(t => (t.id === id ? {...t, completado: estadoAnterior} : t));

                    /* Si habia repeticion, normalizar ordenes tras eliminar la nueva */
                    if (nuevaTareaRepetida) {
                        listaRestaurada = listaRestaurada.map((t, i) => ({...t, orden: i}));
                    }

                    return listaRestaurada;
                });
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

                /*
                 * Crear tarea incluyendo TODOS los campos de DatosEdicionTarea
                 * Esto garantiza que configuracion, urgencia, asignadoA, etc. se incluyan
                 * Los campos que pueden ser null se normalizan a undefined
                 */
                const nuevaTarea: Tarea = {
                    /* Campos obligatorios */
                    id: nuevoId,
                    texto: datos.texto || 'Nueva tarea',
                    completado: datos.completado ?? false,
                    fechaCreacion: hoy,
                    orden: indiceInsercion,
                    /* Campos opcionales de DatosEdicionTarea */
                    parentId: datos.parentId,
                    proyectoId: datos.proyectoId,
                    configuracion: datos.configuracion,
                    /* Normalizar campos que pueden ser null -> undefined */
                    prioridad: datos.prioridad ?? undefined,
                    urgencia: datos.urgencia ?? undefined,
                    asignadoA: datos.asignadoA ?? undefined,
                    asignadoANombre: datos.asignadoANombre,
                    asignadoAAvatar: datos.asignadoAAvatar
                };

                /* Insertar y recalcular orden de todas las tareas */
                const nuevaLista = [...prev];
                nuevaLista.splice(indiceInsercion, 0, nuevaTarea);

                /* Actualizar campo orden de todas las tareas */
                return nuevaLista.map((t, idx) => ({...t, orden: idx}));
            });

            /* Nota: El evento 'creado' se registra después de que la tarea se sincronice
             * con el servidor y obtenga un ID real. Esto evita registrar eventos
             * para IDs temporales que luego cambian. */

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
     * Registra eventos del sistema cuando se detectan cambios significativos
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
                     * Crear objeto base excluyendo campos que pueden ser null o no pertenecen a Tarea
                     * Para prioridad/urgencia/asignadoA, null significa "quitar"
                     */
                    const {prioridad: nuevaPrioridad, urgencia: nuevaUrgencia, configuracion: nuevaConfiguracion, asignadoA: nuevoAsignadoA, asignadoANombre, asignadoAAvatar, insertarDespuesDe: _, ...restoDatos} = datos;

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

                    /* Si urgencia es null, eliminar; si tiene valor, asignar */
                    if (nuevaUrgencia === null) {
                        delete tareaActualizada.urgencia;
                    } else if (nuevaUrgencia !== undefined) {
                        tareaActualizada.urgencia = nuevaUrgencia;
                    }

                    /* Si asignadoA es null, eliminar asignación; si tiene valor, asignar */
                    if (nuevoAsignadoA === null) {
                        delete tareaActualizada.asignadoA;
                        delete tareaActualizada.asignadoANombre;
                        delete tareaActualizada.asignadoAAvatar;
                    } else if (nuevoAsignadoA !== undefined) {
                        tareaActualizada.asignadoA = nuevoAsignadoA;
                        tareaActualizada.asignadoANombre = asignadoANombre;
                        tareaActualizada.asignadoAAvatar = asignadoAAvatar;
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

            /* Registrar eventos del sistema para cambios detectados */
            registrarEventosCambios(id, tareaAnterior, datos);

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
