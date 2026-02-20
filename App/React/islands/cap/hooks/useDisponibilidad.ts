/* sentinel-disable-file limite-lineas — hook cohesivo que gestiona una matriz interactiva
 * de disponibilidad (toggle individual/fila/columna/todo) + persistencia API.
 * Los toggles comparten estado y no se pueden separar sin compartir setState. */

/**
 * Hook para gestión de disponibilidad de alumnos
 *
 * Maneja la matriz de horas disponibles por día de semana.
 * Cumple SRP: solo gestiona disponibilidad, no UI.
 */

import {useState, useCallback, useEffect} from 'react';
import {procesarErrorApi, obtenerMensajeContextual, interpretarErrorRed, formatearMensajeError} from '../constants/cap-errores';
import {API_BASE} from '../constants/cap-constants';
import type {DiaSemana, SlotDisponibilidad} from '../types';
import {generarMatrizVacia, HORAS_DISPONIBLES_DEFAULT} from '../utils/matrizDisponibilidad';

/* Re-exports para compatibilidad con consumidores existentes */
export type {DiaSemana, SlotDisponibilidad, DisponibilidadAlumno} from '../types';
export {DIAS_SEMANA} from '../constants';
export {HORAS_DISPONIBLES_DEFAULT, HORAS_DISPONIBLES} from '../utils/matrizDisponibilidad';

interface EstadoDisponibilidad {
    slots: SlotDisponibilidad[];
    cargando: boolean;
    guardando: boolean;
    error: string | null;
    exito: string | null;
    hayCambios: boolean;
}

interface UseDisponibilidadReturn extends EstadoDisponibilidad {
    toggleSlot: (dia: DiaSemana, hora: string) => void;
    toggleFila: (hora: string) => void;
    toggleColumna: (dia: DiaSemana) => void;
    seleccionarTodo: () => void;
    limpiarTodo: () => void;
    guardar: () => Promise<boolean>;
    cargar: (alumnoId: number) => Promise<void>;
    limpiarMensajes: () => void;
    horasActuales: string[];
}

/* Opciones del hook */
interface OpcionesDisponibilidad {
    alumnoIdInicial?: number;
    horasDisponibles?: string[];
}

export function useDisponibilidad(opciones: OpcionesDisponibilidad | number = {}): UseDisponibilidadReturn {
    /* Compatibilidad: si se pasa un número, es el alumnoId legacy */
    const opcionesNormalizadas: OpcionesDisponibilidad = typeof opciones === 'number' ? {alumnoIdInicial: opciones} : opciones;

    const {alumnoIdInicial, horasDisponibles = HORAS_DISPONIBLES_DEFAULT} = opcionesNormalizadas;

    const [alumnoId, setAlumnoId] = useState<number | null>(alumnoIdInicial ?? null);
    const [estado, setEstado] = useState<EstadoDisponibilidad>({
        slots: generarMatrizVacia(horasDisponibles),
        cargando: false,
        guardando: false,
        error: null,
        exito: null,
        hayCambios: false
    });

    /* Regenerar matriz cuando cambien las horas disponibles */
    const horasKey = horasDisponibles.join(',');
    const [ultimasHoras, setUltimasHoras] = useState(horasKey);

    /* Efecto para regenerar matriz cuando cambian las horas configuradas */
    useEffect(() => {
        if (horasKey !== ultimasHoras) {
            setUltimasHoras(horasKey);
            setEstado(prev => ({
                ...prev,
                slots: generarMatrizVacia(horasDisponibles),
                hayCambios: false
            }));
        }
    }, [horasKey, ultimasHoras, horasDisponibles]);

    const cargar = useCallback(
        async (id: number, signal?: AbortSignal) => {
            setAlumnoId(id);
            setEstado(prev => ({...prev, cargando: true, error: null, hayCambios: false}));

            try {
                const respuesta = await fetch(`${API_BASE}/disponibilidad/${id}`, {
                    credentials: 'same-origin',
                    headers: {'X-WP-Nonce': (window as any).wpApiSettings?.nonce || ''},
                    signal
                });

                if (!respuesta.ok) {
                    /* Si no existe, usar matriz vacía con horas dinámicas */
                    if (respuesta.status === 404) {
                        setEstado(prev => ({
                            ...prev,
                            slots: generarMatrizVacia(horasDisponibles),
                            cargando: false
                        }));
                        return;
                    }
                    const mensajeError = await procesarErrorApi(respuesta, 'disponibilidad', 'cargar');
                    throw new Error(mensajeError);
                }

                const datos = await respuesta.json();

                /* Combinar slots guardados con la matriz completa usando horas dinámicas */
                const slotsGuardados = datos.slots || [];
                const matrizCompleta = generarMatrizVacia(horasDisponibles);

                for (const slot of slotsGuardados) {
                    const indice = matrizCompleta.findIndex(s => s.dia === slot.dia && s.hora === slot.hora);
                    if (indice >= 0) {
                        matrizCompleta[indice].disponible = slot.disponible;
                    }
                }

                setEstado(prev => ({
                    ...prev,
                    slots: matrizCompleta,
                    cargando: false
                }));
            } catch (err) {
                /* Ignorar cancelaciones por AbortController */
                if (err instanceof DOMException && err.name === 'AbortError') return;
                const contextual = obtenerMensajeContextual('disponibilidad', 'cargar');
                let mensajeError = err instanceof Error ? err.message : `${contextual.fallback} ${contextual.sugerencia}`;

                if (err instanceof Error && err.message.includes('fetch')) {
                    const errorRed = interpretarErrorRed(err);
                    mensajeError = formatearMensajeError(errorRed);
                }

                setEstado(prev => ({
                    ...prev,
                    cargando: false,
                    error: mensajeError
                }));
            }
        },
        [horasDisponibles]
    );

    const toggleSlot = useCallback((dia: DiaSemana, hora: string) => {
        setEstado(prev => ({
            ...prev,
            hayCambios: true,
            slots: prev.slots.map(slot => (slot.dia === dia && slot.hora === hora ? {...slot, disponible: !slot.disponible} : slot))
        }));
    }, []);

    const toggleFila = useCallback((hora: string) => {
        setEstado(prev => {
            /* Verificar si toda la fila está seleccionada */
            const slotsEnFila = prev.slots.filter(s => s.hora === hora);
            const todosMarcados = slotsEnFila.every(s => s.disponible);
            const nuevoValor = !todosMarcados;

            return {
                ...prev,
                hayCambios: true,
                slots: prev.slots.map(slot => (slot.hora === hora ? {...slot, disponible: nuevoValor} : slot))
            };
        });
    }, []);

    const toggleColumna = useCallback((dia: DiaSemana) => {
        setEstado(prev => {
            /* Verificar si toda la columna está seleccionada */
            const slotsEnColumna = prev.slots.filter(s => s.dia === dia);
            const todosMarcados = slotsEnColumna.every(s => s.disponible);
            const nuevoValor = !todosMarcados;

            return {
                ...prev,
                hayCambios: true,
                slots: prev.slots.map(slot => (slot.dia === dia ? {...slot, disponible: nuevoValor} : slot))
            };
        });
    }, []);

    const seleccionarTodo = useCallback(() => {
        setEstado(prev => ({
            ...prev,
            hayCambios: true,
            slots: prev.slots.map(slot => ({...slot, disponible: true}))
        }));
    }, []);

    const limpiarTodo = useCallback(() => {
        setEstado(prev => ({
            ...prev,
            hayCambios: true,
            slots: prev.slots.map(slot => ({...slot, disponible: false}))
        }));
    }, []);

    const guardar = useCallback(async (): Promise<boolean> => {
        if (!alumnoId) {
            setEstado(prev => ({...prev, error: 'No hay alumno seleccionado'}));
            return false;
        }

        setEstado(prev => ({...prev, guardando: true, error: null, exito: null}));

        try {
            /* Solo enviar slots marcados como disponibles */
            const slotsDisponibles = estado.slots.filter(s => s.disponible);

            const respuesta = await fetch(`${API_BASE}/disponibilidad/${alumnoId}`, {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    'Content-Type': 'application/json',
                    'X-WP-Nonce': (window as any).wpApiSettings?.nonce || ''
                },
                body: JSON.stringify({slots: slotsDisponibles})
            });

            if (!respuesta.ok) {
                const mensajeError = await procesarErrorApi(respuesta, 'disponibilidad', 'guardar');
                throw new Error(mensajeError);
            }

            setEstado(prev => ({
                ...prev,
                guardando: false,
                hayCambios: false,
                exito: 'Disponibilidad guardada correctamente'
            }));

            return true;
        } catch (err) {
            const contextual = obtenerMensajeContextual('disponibilidad', 'guardar');
            setEstado(prev => ({
                ...prev,
                guardando: false,
                error: err instanceof Error ? err.message : `${contextual.fallback} ${contextual.sugerencia}`
            }));
            return false;
        }
    }, [alumnoId, estado.slots]);

    const limpiarMensajes = useCallback(() => {
        setEstado(prev => ({...prev, error: null, exito: null}));
    }, []);

    /* Cargar al inicializar si hay alumnoId */
    useEffect(() => {
        if (alumnoIdInicial) {
            const controller = new AbortController();
            cargar(alumnoIdInicial, controller.signal);
            return () => controller.abort();
        }
    }, [alumnoIdInicial, cargar]);

    return {
        ...estado,
        toggleSlot,
        toggleFila,
        toggleColumna,
        seleccionarTodo,
        limpiarTodo,
        guardar,
        cargar,
        limpiarMensajes,
        horasActuales: horasDisponibles
    };
}

export default useDisponibilidad;
