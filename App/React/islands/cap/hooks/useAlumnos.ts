/**
 * Hook para gestión de alumnos del centro CAP
 *
 * Maneja el estado local, paginación, búsqueda y llamadas API REST.
 * Cumple SRP: solo gestiona alumnos, no UI.
 */

import {useState, useEffect, useCallback} from 'react';
import {procesarErrorApi, obtenerMensajeContextual, interpretarErrorRed, formatearMensajeError} from '../constants/cap-errores';

export interface Alumno {
    id: number;
    centro_id: number;
    nombre: string;
    email?: string;
    telefono?: string;
    dni?: string;
    horas_completadas: number;
    horas_asignadas?: number;
    horas_completadas_calculadas?: number;
    estado: 'activo' | 'completado' | 'pausado';
    created_at: string;
    updated_at: string;
}

export interface FiltrosAlumnos {
    busqueda: string;
    ordenarPor: 'nombre' | 'email' | 'created_at';
    orden: 'ASC' | 'DESC';
    pagina: number;
    porPagina: number;
}

interface EstadoAlumnos {
    alumnos: Alumno[];
    total: number;
    cargando: boolean;
    guardando: boolean;
    eliminando: number | null;
    error: string | null;
    exito: string | null;
    filtros: FiltrosAlumnos;
}

interface UseAlumnosReturn extends EstadoAlumnos {
    cargarAlumnos: () => Promise<void>;
    crearAlumno: (datos: Partial<Alumno>) => Promise<boolean>;
    actualizarAlumno: (id: number, datos: Partial<Alumno>) => Promise<boolean>;
    eliminarAlumno: (id: number) => Promise<boolean>;
    cambiarFiltros: (nuevosFiltros: Partial<FiltrosAlumnos>) => void;
    limpiarMensajes: () => void;
}

const API_BASE = '/wp-json/cap/v1';
const HORAS_TOTALES_CAP = 35;

export function useAlumnos(): UseAlumnosReturn {
    const [estado, setEstado] = useState<EstadoAlumnos>({
        alumnos: [],
        total: 0,
        cargando: true,
        guardando: false,
        eliminando: null,
        error: null,
        exito: null,
        filtros: {
            busqueda: '',
            ordenarPor: 'nombre',
            orden: 'ASC',
            pagina: 1,
            porPagina: 10
        }
    });

    const cargarAlumnos = useCallback(async () => {
        setEstado(prev => ({...prev, cargando: true, error: null}));

        try {
            const {filtros} = estado;
            const params = new URLSearchParams({
                limite: filtros.porPagina.toString(),
                offset: ((filtros.pagina - 1) * filtros.porPagina).toString(),
                busqueda: filtros.busqueda,
                ordenar_por: filtros.ordenarPor,
                orden: filtros.orden
            });

            const respuesta = await fetch(`${API_BASE}/alumnos?${params}`, {
                credentials: 'same-origin',
                headers: {'X-WP-Nonce': (window as any).wpApiSettings?.nonce || ''}
            });

            if (!respuesta.ok) {
                const mensajeError = await procesarErrorApi(respuesta, 'alumnos', 'cargar');
                throw new Error(mensajeError);
            }

            const datos = await respuesta.json();

            setEstado(prev => ({
                ...prev,
                alumnos: datos.alumnos || [],
                total: datos.total || 0,
                cargando: false
            }));
        } catch (err) {
            const contextual = obtenerMensajeContextual('alumnos', 'cargar');
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
    }, [estado.filtros]);

    const crearAlumno = useCallback(
        async (datos: Partial<Alumno>): Promise<boolean> => {
            setEstado(prev => ({...prev, guardando: true, error: null, exito: null}));

            try {
                const respuesta = await fetch(`${API_BASE}/alumnos`, {
                    method: 'POST',
                    credentials: 'same-origin',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-WP-Nonce': (window as any).wpApiSettings?.nonce || ''
                    },
                    body: JSON.stringify(datos)
                });

                if (!respuesta.ok) {
                    const errorData = await respuesta.json().catch(() => ({}));
                    const contextual = obtenerMensajeContextual('alumnos', 'crear');
                    throw new Error(errorData.error || `${contextual.fallback} ${contextual.sugerencia}`);
                }

                setEstado(prev => ({
                    ...prev,
                    guardando: false,
                    exito: 'Alumno creado correctamente'
                }));

                /* Recargar lista */
                await cargarAlumnos();
                return true;
            } catch (err) {
                const contextual = obtenerMensajeContextual('alumnos', 'crear');
                setEstado(prev => ({
                    ...prev,
                    guardando: false,
                    error: err instanceof Error ? err.message : `${contextual.fallback} ${contextual.sugerencia}`
                }));
                return false;
            }
        },
        [cargarAlumnos]
    );

    const actualizarAlumno = useCallback(async (id: number, datos: Partial<Alumno>): Promise<boolean> => {
        setEstado(prev => ({...prev, guardando: true, error: null, exito: null}));

        try {
            const respuesta = await fetch(`${API_BASE}/alumnos/${id}`, {
                method: 'PUT',
                credentials: 'same-origin',
                headers: {
                    'Content-Type': 'application/json',
                    'X-WP-Nonce': (window as any).wpApiSettings?.nonce || ''
                },
                body: JSON.stringify(datos)
            });

            if (!respuesta.ok) {
                const mensajeError = await procesarErrorApi(respuesta, 'alumnos', 'actualizar');
                throw new Error(mensajeError);
            }

            /* Actualizar en estado local */
            setEstado(prev => ({
                ...prev,
                alumnos: prev.alumnos.map(a => (a.id === id ? {...a, ...datos} : a)),
                guardando: false,
                exito: 'Alumno actualizado correctamente'
            }));

            return true;
        } catch (err) {
            const contextual = obtenerMensajeContextual('alumnos', 'actualizar');
            setEstado(prev => ({
                ...prev,
                guardando: false,
                error: err instanceof Error ? err.message : `${contextual.fallback} ${contextual.sugerencia}`
            }));
            return false;
        }
    }, []);

    const eliminarAlumno = useCallback(async (id: number): Promise<boolean> => {
        setEstado(prev => ({...prev, eliminando: id, error: null, exito: null}));

        try {
            const respuesta = await fetch(`${API_BASE}/alumnos/${id}`, {
                method: 'DELETE',
                credentials: 'same-origin',
                headers: {
                    'X-WP-Nonce': (window as any).wpApiSettings?.nonce || ''
                }
            });

            if (!respuesta.ok) {
                const mensajeError = await procesarErrorApi(respuesta, 'alumnos', 'eliminar');
                throw new Error(mensajeError);
            }

            /* Eliminar del estado local */
            setEstado(prev => ({
                ...prev,
                alumnos: prev.alumnos.filter(a => a.id !== id),
                total: prev.total - 1,
                eliminando: null,
                exito: 'Alumno eliminado correctamente'
            }));

            return true;
        } catch (err) {
            const contextual = obtenerMensajeContextual('alumnos', 'eliminar');
            setEstado(prev => ({
                ...prev,
                eliminando: null,
                error: err instanceof Error ? err.message : `${contextual.fallback} ${contextual.sugerencia}`
            }));
            return false;
        }
    }, []);

    const cambiarFiltros = useCallback((nuevosFiltros: Partial<FiltrosAlumnos>) => {
        setEstado(prev => ({
            ...prev,
            filtros: {
                ...prev.filtros,
                ...nuevosFiltros,
                /* Reiniciar a página 1 si cambia búsqueda u ordenamiento */
                pagina: nuevosFiltros.busqueda !== undefined || nuevosFiltros.ordenarPor !== undefined ? 1 : (nuevosFiltros.pagina ?? prev.filtros.pagina)
            }
        }));
    }, []);

    const limpiarMensajes = useCallback(() => {
        setEstado(prev => ({...prev, error: null, exito: null}));
    }, []);

    /* Cargar alumnos cuando cambian los filtros */
    useEffect(() => {
        cargarAlumnos();
    }, [estado.filtros.busqueda, estado.filtros.ordenarPor, estado.filtros.orden, estado.filtros.pagina]);

    return {
        ...estado,
        cargarAlumnos,
        crearAlumno,
        actualizarAlumno,
        eliminarAlumno,
        cambiarFiltros,
        limpiarMensajes
    };
}

/* Utilidad para calcular el porcentaje de progreso */
export function calcularProgreso(horasCompletadas: number): number {
    return Math.min(100, Math.round((horasCompletadas / HORAS_TOTALES_CAP) * 100));
}

/* Utilidad para obtener el estado visual del progreso */
export function estadoProgreso(horasCompletadas: number): 'ok' | 'warning' | 'completed' {
    const porcentaje = calcularProgreso(horasCompletadas);
    if (porcentaje >= 100) return 'completed';
    if (porcentaje >= 75) return 'warning';
    return 'ok';
}

export default useAlumnos;
