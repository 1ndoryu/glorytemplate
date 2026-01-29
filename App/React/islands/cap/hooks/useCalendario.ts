/**
 * Hook useCalendario
 *
 * Gestión del estado del calendario CAP:
 * - Navegación entre semanas
 * - Clases de la semana actual
 * - Bloqueo/desbloqueo de clases
 * - Generación con detección de conflictos
 * - Comunicación con API
 */

import {useState, useCallback, useEffect} from 'react';
import type {Clase, DiaSemana, ConflictoAforo, ExclusionesConflicto, ResultadoGeneracion, PreviewGeneracion} from '../types';
import {getLunesDeSemana, getFechasSemana, DIAS_SEMANA} from '../constants';
import {detectarColision} from '../utils/collisionUtils';
import {interpretarErrorHttp, interpretarErrorRed, formatearMensajeError, obtenerMensajeContextual, procesarErrorApi} from '../constants/cap-errores';

/* Interfaz para cambios de una clase */
interface CambiosClase {
    horaInicio?: string;
    horaFin?: string;
    asignaturaId?: number;
}

interface EstadoCalendario {
    clases: Clase[];
    semanaActual: Date;
    fechasSemana: Date[];
    cargando: boolean;
    error: string | null;
    generando: boolean;
    conflictos: ConflictoAforo[];
    mostrarModalConflictos: boolean;
    /* Nuevos estados para edición inline */
    claseSeleccionada: Clase | null;
    mostrarModalEdicion: boolean;
    guardandoEdicion: boolean;
    puedeDeshacer: boolean;
    /* Estado para drag & drop */
    moviendo: boolean;
    /* Estado para eliminar clase */
    eliminando: boolean;
}

interface AccionesCalendario {
    irSemanaAnterior: () => void;
    irSemanaSiguiente: () => void;
    irASemana: (fecha: Date) => void;
    irASemanaActual: () => void;
    toggleBloqueoClase: (claseId: number) => Promise<void>;
    recargarClases: () => Promise<void>;
    generarCalendario: () => Promise<void>;
    generarConExclusiones: (exclusiones: ExclusionesConflicto) => Promise<void>;
    cerrarModalConflictos: () => void;
    limpiarError: () => void;
    /* Nuevas acciones para edición inline */
    seleccionarClase: (clase: Clase) => void;
    cerrarModalEdicion: () => void;
    actualizarClase: (claseId: number, cambios: CambiosClase) => Promise<void>;
    deshacer: () => void;
    /* Acción para drag & drop */
    moverClase: (claseId: number, nuevaFecha: string, horaInicio?: string, horaFin?: string) => Promise<void>;
    moverMultiplesClases: (cambios: {clase: Clase; nuevoInicio: string; nuevoFin: string; nuevaFecha?: string}[]) => Promise<void>;
    /* Acción para eliminar clase */
    eliminarClase: (claseId: number, forzar: boolean) => Promise<void>;
    /* Acción para borrar semana completa */
    borrarSemanacompleta: (incluirBloqueadas?: boolean) => Promise<void>;
}

export function useCalendario(): EstadoCalendario & AccionesCalendario {
    /* Estado principal */
    const [clases, setClases] = useState<Clase[]>([]);
    const [semanaActual, setSemanaActual] = useState(() => getLunesDeSemana(new Date()));
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [generando, setGenerando] = useState(false);
    const [conflictos, setConflictos] = useState<ConflictoAforo[]>([]);
    const [mostrarModalConflictos, setMostrarModalConflictos] = useState(false);

    /* Estado para edición inline */
    const [claseSeleccionada, setClaseSeleccionada] = useState<Clase | null>(null);
    const [mostrarModalEdicion, setMostrarModalEdicion] = useState(false);
    const [guardandoEdicion, setGuardandoEdicion] = useState(false);

    /* Historial de cambios para undo */
    const [historialClases, setHistorialClases] = useState<Clase[][]>([]);
    const puedeDeshacer = historialClases.length > 0;

    /* Estado para drag & drop */
    const [moviendo, setMoviendo] = useState(false);

    /* Estado para eliminar clase */
    const [eliminando, setEliminando] = useState(false);

    /* Fechas de la semana actual */
    const fechasSemana = getFechasSemana(semanaActual);

    /* Obtener nonce de WordPress */
    const getNonce = useCallback((): string => {
        if (typeof window !== 'undefined' && (window as any).wpApiSettings?.nonce) {
            return (window as any).wpApiSettings.nonce;
        }
        return '';
    }, []);

    /* Formatear fecha para API */
    const formatearFechaApi = useCallback((fecha: Date): string => {
        return fecha.toISOString().split('T')[0];
    }, []);

    /* Normalizar formato de hora a HH:MM para evitar segundos */
    const normalizarHora = useCallback((hora?: string | null): string => {
        if (!hora) return '00:00';
        return hora.substring(0, 5);
    }, []);

    /* Cargar clases de la semana desde API */
    const cargarClases = useCallback(async () => {
        setCargando(true);
        setError(null);

        try {
            const fechaInicio = formatearFechaApi(semanaActual);

            const response = await fetch(`/wp-json/cap/v1/clases?semana=${fechaInicio}`, {
                headers: {
                    'X-WP-Nonce': getNonce()
                }
            });

            if (!response.ok) {
                const mensajeError = await procesarErrorApi(response, 'calendario', 'cargar');
                throw new Error(mensajeError);
            }

            const data = await response.json();

            /* Mapear respuesta del backend a formato frontend */
            const clasesFormateadas = (data.clases || []).map((c: any) => ({
                id: c.id,
                centroId: c.centro_id,
                fecha: c.fecha,
                /* Ajuste: normalizar horas sin segundos para evitar inconsistencias */
                horaInicio: normalizarHora(c.hora_inicio),
                horaFin: normalizarHora(c.hora_fin),
                asignaturaId: c.asignatura,
                bloqueada: c.bloqueada === true || c.bloqueada === 1 || c.bloqueada === '1',
                alumnosIds: (c.alumnos || []).map((a: any) => a.id),
                /* Guardamos los datos completos de alumnos para evitar buscar en lista paginada */
                alumnosData: (c.alumnos || []).map((a: any) => ({
                    id: a.id,
                    nombre: a.nombre,
                    asistio: a.asistio === true || a.asistio === 1 || a.asistio === '1'
                }))
            }));

            setClases(clasesFormateadas);
        } catch (err) {
            console.error('Error cargando clases:', err);
            if (err instanceof Error && err.message.includes('fetch')) {
                const errorRed = interpretarErrorRed(err);
                setError(formatearMensajeError(errorRed));
            } else {
                setError(err instanceof Error ? err.message : 'Error desconocido al cargar las clases.');
            }
        } finally {
            setCargando(false);
        }
    }, [semanaActual, getNonce, formatearFechaApi, normalizarHora]);

    /* Cargar clases al cambiar de semana */
    useEffect(() => {
        cargarClases();
    }, [cargarClases]);

    /* Navegación entre semanas */
    const irSemanaAnterior = useCallback(() => {
        setSemanaActual(prev => {
            const nueva = new Date(prev);
            nueva.setDate(nueva.getDate() - 7);
            return nueva;
        });
    }, []);

    const irSemanaSiguiente = useCallback(() => {
        setSemanaActual(prev => {
            const nueva = new Date(prev);
            nueva.setDate(nueva.getDate() + 7);
            return nueva;
        });
    }, []);

    const irASemana = useCallback((fecha: Date) => {
        setSemanaActual(getLunesDeSemana(fecha));
    }, []);

    const irASemanaActual = useCallback(() => {
        setSemanaActual(getLunesDeSemana(new Date()));
    }, []);

    /* Bloqueo/desbloqueo de clases */
    const toggleBloqueoClase = useCallback(
        async (claseId: number) => {
            const clase = clases.find(c => c.id === claseId);
            if (!clase) return;

            /* Optimistic update */
            setClases(prev => prev.map(c => (c.id === claseId ? {...c, bloqueada: !c.bloqueada} : c)));

            try {
                const response = await fetch(`/wp-json/cap/v1/clases/${claseId}/toggle-bloqueo`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-WP-Nonce': getNonce()
                    }
                });

                if (!response.ok) {
                    const mensajeError = await procesarErrorApi(response, 'calendario', 'bloquear');
                    throw new Error(mensajeError);
                }
            } catch (err) {
                /* Revertir cambio optimista */
                setClases(prev => prev.map(c => (c.id === claseId ? {...c, bloqueada: clase.bloqueada} : c)));
                const contextual = obtenerMensajeContextual('calendario', 'bloquear');
                setError(err instanceof Error ? err.message : `${contextual.fallback} ${contextual.sugerencia}`);
            }
        },
        [clases, getNonce]
    );

    /* Recargar clases manualmente */
    const recargarClases = useCallback(async () => {
        await cargarClases();
    }, [cargarClases]);

    /* Guardar snapshot antes de un cambio (para undo) */
    const guardarSnapshot = useCallback(() => {
        setHistorialClases(prev => {
            const nuevo = [...prev, JSON.parse(JSON.stringify(clases))];
            /* Limitar a 20 snapshots máximo */
            if (nuevo.length > 20) nuevo.shift();
            return nuevo;
        });
    }, [clases]);

    /* Generar calendario */
    const generarCalendario = useCallback(async () => {
        /* Guardar snapshot antes de generar para poder deshacer */
        guardarSnapshot();

        setGenerando(true);
        setError(null);
        setConflictos([]);

        try {
            const response = await fetch('/wp-json/cap/v1/generar', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-WP-Nonce': getNonce()
                },
                body: JSON.stringify({
                    semana: formatearFechaApi(semanaActual)
                })
            });

            const resultado: ResultadoGeneracion = await response.json();

            /* Mapear claves snake_case a camelCase */
            const conflictosFormateados = (resultado.conflictos || []).map((c: any) => ({
                tipo: c.tipo,
                slotKey: c.slot_key,
                fecha: c.fecha,
                horaInicio: c.hora_inicio,
                horaFin: c.hora_fin,
                demanda: c.demanda,
                capacidad: c.capacidad,
                exceso: c.exceso,
                alumnos: c.alumnos
            }));

            if (!resultado.exito && conflictosFormateados.length > 0) {
                /* Hay conflictos de aforo, mostrar modal */
                setConflictos(conflictosFormateados);
                setMostrarModalConflictos(true);
            } else if (resultado.exito) {
                /* Generación exitosa, recargar clases */
                await cargarClases();
            } else {
                /* Error sin conflictos */
                const contextual = obtenerMensajeContextual('calendario', 'generar');
                setError(resultado.mensaje || `${contextual.fallback} ${contextual.sugerencia}`);
            }
        } catch (err) {
            console.error('Error generando calendario:', err);
            const contextual = obtenerMensajeContextual('calendario', 'generar');
            setError(err instanceof Error ? err.message : `${contextual.fallback} ${contextual.sugerencia}`);
        } finally {
            setGenerando(false);
        }
    }, [semanaActual, getNonce, formatearFechaApi, cargarClases, guardarSnapshot]);

    /* Generar con exclusiones (después de resolver conflictos) */
    const generarConExclusiones = useCallback(
        async (exclusiones: ExclusionesConflicto) => {
            setGenerando(true);
            setError(null);

            try {
                const response = await fetch('/wp-json/cap/v1/generar/con-exclusiones', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-WP-Nonce': getNonce()
                    },
                    body: JSON.stringify({
                        semana: formatearFechaApi(semanaActual),
                        exclusiones
                    })
                });

                const resultado: ResultadoGeneracion = await response.json();

                if (resultado.exito) {
                    setConflictos([]);
                    setMostrarModalConflictos(false);
                    await cargarClases();
                } else {
                    const contextual = obtenerMensajeContextual('calendario', 'generar');
                    setError(resultado.mensaje || `${contextual.fallback} ${contextual.sugerencia}`);
                }
            } catch (err) {
                console.error('Error generando con exclusiones:', err);
                const contextual = obtenerMensajeContextual('calendario', 'generar');
                setError(err instanceof Error ? err.message : `${contextual.fallback} ${contextual.sugerencia}`);
            } finally {
                setGenerando(false);
            }
        },
        [semanaActual, getNonce, formatearFechaApi, cargarClases]
    );

    /* Cerrar modal de conflictos */
    const cerrarModalConflictos = useCallback(() => {
        setMostrarModalConflictos(false);
        setConflictos([]);
    }, []);

    /* Limpiar error */
    const limpiarError = useCallback(() => {
        setError(null);
    }, []);

    /* Seleccionar clase para edición */
    const seleccionarClase = useCallback((clase: Clase) => {
        setClaseSeleccionada(clase);
        setMostrarModalEdicion(true);
    }, []);

    /* Cerrar modal de edición */
    const cerrarModalEdicion = useCallback(() => {
        setMostrarModalEdicion(false);
        setClaseSeleccionada(null);
    }, []);

    /* Actualizar clase con cambios */
    const actualizarClase = useCallback(
        async (claseId: number, cambios: CambiosClase) => {
            const claseActual = clases.find(c => c.id === claseId);
            if (!claseActual) return;

            const horaInicioOriginal = normalizarHora(claseActual.horaInicio);
            const horaFinOriginal = normalizarHora(claseActual.horaFin);
            const horaInicioNueva = normalizarHora(cambios.horaInicio ?? horaInicioOriginal);
            const horaFinNueva = normalizarHora(cambios.horaFin ?? horaFinOriginal);
            const cambiaHorario = horaInicioNueva !== horaInicioOriginal || horaFinNueva !== horaFinOriginal;

            /* Ajuste: validar conflictos al editar hora desde modal */
            if (cambiaHorario) {
                const clasesDia = clases.filter(c => c.fecha === claseActual.fecha);
                const conflicto = detectarColision(horaInicioNueva, horaFinNueva, clasesDia, claseId);
                if (conflicto) {
                    const contexto = obtenerMensajeContextual('calendario', 'mover');
                    setError(
                        `Estás intentando mover la clase a las ${horaInicioNueva}, pero ese horario ya está ocupado. ${contexto.sugerencia}`
                    );
                    return;
                }
            }

            setGuardandoEdicion(true);
            setError(null);

            /* Guardar snapshot antes del cambio */
            guardarSnapshot();

            /* Actualización optimista */
            setClases(prev =>
                prev.map(c => {
                    if (c.id === claseId) {
                        return {
                            ...c,
                            horaInicio: horaInicioNueva,
                            horaFin: horaFinNueva,
                            asignaturaId: cambios.asignaturaId ?? c.asignaturaId
                        };
                    }
                    return c;
                })
            );

            try {
                const response = await fetch(`/wp-json/cap/v1/clases/${claseId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-WP-Nonce': getNonce()
                    },
                    body: JSON.stringify({
                        hora_inicio: cambios.horaInicio,
                        hora_fin: cambios.horaFin,
                        asignatura: cambios.asignaturaId
                    })
                });

                if (!response.ok) {
                    const mensajeError = await procesarErrorApi(response, 'calendario', 'actualizar');
                    throw new Error(mensajeError);
                }

                /* Cerrar modal tras éxito */
                cerrarModalEdicion();
            } catch (err) {
                /* Revertir cambio optimista usando el último snapshot */
                const ultimo = historialClases[historialClases.length - 1];
                if (ultimo) {
                    setClases(ultimo);
                    setHistorialClases(prev => prev.slice(0, -1));
                }
                const contextual = obtenerMensajeContextual('calendario', 'actualizar');
                setError(err instanceof Error ? err.message : `${contextual.fallback} ${contextual.sugerencia}`);
            } finally {
                setGuardandoEdicion(false);
            }
        },
        [clases, getNonce, guardarSnapshot, cerrarModalEdicion, historialClases, normalizarHora]
    );

    /* Deshacer último cambio */
    const deshacer = useCallback(() => {
        if (historialClases.length === 0) return;

        const estadoAnterior = historialClases[historialClases.length - 1];
        setClases(estadoAnterior);
        setHistorialClases(prev => prev.slice(0, -1));
    }, [historialClases]);

    /* Mover clase a otro día (drag & drop) o cambiar hora */
    const moverClase = useCallback(
        async (claseId: number, nuevaFecha: string, nuevaHoraInicio?: string, nuevaHoraFin?: string) => {
            const clase = clases.find(c => c.id === claseId);
            if (!clase) return;

            /* No mover clases bloqueadas */
            if (clase.bloqueada) {
                setError('No se puede mover una clase bloqueada. Desbloquéala primero si necesitas cambiarla de día.');
                return;
            }

            setMoviendo(true);
            setError(null);

            /* Guardar snapshot antes del cambio */
            guardarSnapshot();

            /* Actualización optimista */
            setClases(prev =>
                prev.map(c => {
                    if (c.id === claseId) {
                        return {
                            ...c,
                            fecha: nuevaFecha,
                            horaInicio: normalizarHora(nuevaHoraInicio || c.horaInicio),
                            horaFin: normalizarHora(nuevaHoraFin || c.horaFin)
                        };
                    }
                    return c;
                })
            );

            try {
                const body: any = {fecha: nuevaFecha};
                if (nuevaHoraInicio) body.hora_inicio = nuevaHoraInicio;
                if (nuevaHoraFin) body.hora_fin = nuevaHoraFin;

                const response = await fetch(`/wp-json/cap/v1/clases/${claseId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-WP-Nonce': getNonce()
                    },
                    body: JSON.stringify(body)
                });

                if (!response.ok) {
                    const mensajeError = await procesarErrorApi(response, 'calendario', 'mover');
                    throw new Error(mensajeError);
                }
            } catch (err) {
                /* Revertir cambio optimista usando el último snapshot */
                const ultimo = historialClases[historialClases.length - 1];
                if (ultimo) {
                    setClases(ultimo);
                    setHistorialClases(prev => prev.slice(0, -1));
                }
                const contextual = obtenerMensajeContextual('calendario', 'mover');
                setError(err instanceof Error ? err.message : `${contextual.fallback} ${contextual.sugerencia}`);
            } finally {
                setMoviendo(false);
            }
        },
        [clases, getNonce, guardarSnapshot, historialClases, normalizarHora]
    );

    /* Mover múltiples clases (para resolución de conflictos en cascada) */
    const moverMultiplesClases = useCallback(
        async (cambios: {clase: Clase; nuevoInicio: string; nuevoFin: string; nuevaFecha?: string}[]) => {
            if (cambios.length === 0) return;

            setMoviendo(true);
            setError(null);
            guardarSnapshot();

            /* Actualización optimista masiva */
            setClases(prev =>
                prev.map(c => {
                    const cambio = cambios.find(curr => curr.clase.id === c.id);
                    if (cambio) {
                        return {
                            ...c,
                            horaInicio: normalizarHora(cambio.nuevoInicio),
                            horaFin: normalizarHora(cambio.nuevoFin),
                            fecha: cambio.nuevaFecha || c.fecha
                        };
                    }
                    return c;
                })
            );

            try {
                /* Ejecutar peticiones en paralelo */
                const promesas = cambios.map(cambio => {
                    const body: any = {
                        hora_inicio: cambio.nuevoInicio,
                        hora_fin: cambio.nuevoFin
                    };
                    if (cambio.nuevaFecha) body.fecha = cambio.nuevaFecha;

                    return fetch(`/wp-json/cap/v1/clases/${cambio.clase.id}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-WP-Nonce': getNonce()
                        },
                        body: JSON.stringify(body)
                    }).then(async res => {
                        if (!res.ok) {
                            const msg = await procesarErrorApi(res, 'calendario', 'mover');
                            throw new Error(msg);
                        }
                        return res.json();
                    });
                });

                await Promise.all(promesas);
            } catch (err) {
                /* Revertir todo si falla algo */
                const ultimo = historialClases[historialClases.length - 1];
                if (ultimo) {
                    setClases(ultimo);
                    setHistorialClases(prev => prev.slice(0, -1));
                }
                setError('Hubo un error al desplazar las clases. Se han revertido los cambios.');
            } finally {
                setMoviendo(false);
            }
        },
        [getNonce, guardarSnapshot, historialClases, normalizarHora]
    );

    /* Eliminar una clase */
    const eliminarClase = useCallback(
        async (claseId: number, forzar: boolean) => {
            /* Guardar snapshot antes de eliminar para poder deshacer */
            guardarSnapshot();

            setEliminando(true);
            setError(null);

            try {
                const url = forzar ? `/wp-json/cap/v1/clases/${claseId}?forzar=true` : `/wp-json/cap/v1/clases/${claseId}`;

                const response = await fetch(url, {
                    method: 'DELETE',
                    headers: {
                        'X-WP-Nonce': getNonce()
                    }
                });

                if (!response.ok) {
                    const mensajeError = await procesarErrorApi(response, 'calendario', 'eliminar');
                    throw new Error(mensajeError);
                }

                /* Eliminar de la lista local */
                setClases(prev => prev.filter(c => c.id !== claseId));

                /* Cerrar modal */
                cerrarModalEdicion();
            } catch (err) {
                const contextual = obtenerMensajeContextual('calendario', 'eliminar');
                setError(err instanceof Error ? err.message : `${contextual.fallback} ${contextual.sugerencia}`);
            } finally {
                setEliminando(false);
            }
        },
        [getNonce, cerrarModalEdicion, guardarSnapshot]
    );

    /*
     * Borrar todas las clases de la semana actual
     * Reversible con undo
     */
    const borrarSemanacompleta = useCallback(
        async (incluirBloqueadas: boolean = false) => {
            /* Guardar snapshot antes de borrar para poder deshacer */
            guardarSnapshot();

            setGenerando(true);
            setError(null);

            try {
                const fechaLunes = formatearFechaApi(semanaActual);

                const response = await fetch('/wp-json/cap/v1/clases/limpiar-semana', {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-WP-Nonce': getNonce()
                    },
                    body: JSON.stringify({
                        fecha: fechaLunes,
                        incluirBloqueadas
                    })
                });

                if (!response.ok) {
                    const mensajeError = await procesarErrorApi(response, 'calendario', 'limpiar');
                    throw new Error(mensajeError);
                }

                const data = await response.json();

                if (data.exito) {
                    /* Cargar clases de nuevo (ahora vacías) */
                    setClases([]);
                } else {
                    throw new Error(data.error || 'Error al limpiar la semana');
                }
            } catch (err) {
                const contextual = obtenerMensajeContextual('calendario', 'limpiar');
                setError(err instanceof Error ? err.message : `${contextual.fallback} ${contextual.sugerencia}`);
            } finally {
                setGenerando(false);
            }
        },
        [semanaActual, getNonce, formatearFechaApi, guardarSnapshot]
    );

    return {
        clases,
        semanaActual,
        fechasSemana,
        cargando,
        error,
        generando,
        conflictos,
        mostrarModalConflictos,
        claseSeleccionada,
        mostrarModalEdicion,
        guardandoEdicion,
        puedeDeshacer,
        moviendo,
        irSemanaAnterior,
        irSemanaSiguiente,
        irASemana,
        irASemanaActual,
        toggleBloqueoClase,
        recargarClases,
        generarCalendario,
        generarConExclusiones,
        cerrarModalConflictos,
        limpiarError,
        seleccionarClase,
        cerrarModalEdicion,
        actualizarClase,
        deshacer,
        moverClase,
        moverMultiplesClases,
        eliminarClase,
        eliminando,
        borrarSemanacompleta
    };
}
