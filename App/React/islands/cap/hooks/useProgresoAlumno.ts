/**
 * useProgresoAlumno
 *
 * Gestiona la carga y el estado del progreso de un alumno desde la API.
 * Separado de ModalProgresoAlumno para cumplir SRP y reducir useState del componente.
 */

import {useState, useEffect} from 'react';
import {ASIGNATURAS_CAP, getAsignatura, API_BASE} from '../constants';
import type {Alumno} from './useAlumnos';

export interface ProgresoAsignatura {
    asignaturaId: number;
    horasCompletadas: number;
}

interface ProgresoApiResponse {
    alumnoId: number;
    horasCompletadas: number;
    horasAsignadas?: number;
    horasTotales: number;
    porcentajeCompletadas?: number;
    porcentajeAsignadas?: number;
    asignaturas: Array<{asignatura: string; horas: string}>;
    asignaturasCompletadas?: Array<{asignatura: string; horas: string}>;
    asignaturasAsignadas?: Array<{asignatura: string; horas: string}>;
}

interface UseProgresoAlumnoReturn {
    cargando: boolean;
    errorCarga: string | null;
    progresoAsignado: ProgresoAsignatura[];
    progresoCompletado: ProgresoAsignatura[];
    horasAsignadas: number;
    horasCompletadas: number;
}

/*
 * Obtiene el ID numérico de una asignatura a partir de su código backend.
 * Delega a getAsignatura() centralizada para no duplicar el mapeo de alias.
 */
function obtenerAsignaturaId(valorAsignatura: string): number | null {
    const asignatura = getAsignatura(valorAsignatura);
    return asignatura ? asignatura.id : null;
}

/* Base vacía reutilizable para el mapeo de asignaturas */
function crearBaseAsignaturas(): ProgresoAsignatura[] {
    return ASIGNATURAS_CAP.map(asig => ({asignaturaId: asig.id, horasCompletadas: 0}));
}

function mapearAsignaturas(items: Array<{asignatura: string; horas: string}>): ProgresoAsignatura[] {
    const mapeado = crearBaseAsignaturas();
    (items || []).forEach(item => {
        const id = obtenerAsignaturaId(String(item.asignatura));
        if (id !== null) {
            const idx = mapeado.findIndex(p => p.asignaturaId === id);
            if (idx !== -1) {
                mapeado[idx].horasCompletadas += parseFloat(item.horas) || 0;
            }
        }
    });
    return mapeado;
}

export function useProgresoAlumno(visible: boolean, alumno: Alumno | null): UseProgresoAlumnoReturn {
    const [cargando, setCargando] = useState(false);
    const [errorCarga, setErrorCarga] = useState<string | null>(null);
    const [progresoAsignado, setProgresoAsignado] = useState<ProgresoAsignatura[]>([]);
    const [progresoCompletado, setProgresoCompletado] = useState<ProgresoAsignatura[]>([]);
    const [horasAsignadas, setHorasAsignadas] = useState(0);
    const [horasCompletadas, setHorasCompletadas] = useState(0);

    useEffect(() => {
        if (!visible || !alumno) return;

        const abortController = new AbortController();

        const cargarProgreso = async () => {
            setCargando(true);
            setErrorCarga(null);
            try {
                const nonce = (window as any).wpApiSettings?.nonce || '';
                const response = await fetch(`${API_BASE}/alumnos/${alumno.id}/progreso`, {
                    headers: {'X-WP-Nonce': nonce},
                    credentials: 'same-origin',
                    signal: abortController.signal
                });

                if (!response.ok) throw new Error('Error al cargar progreso');

                const data: ProgresoApiResponse = await response.json();

                const asignadas = data.asignaturasAsignadas || data.asignaturas || [];
                const completadas = data.asignaturasCompletadas || data.asignaturas || [];

                const progresoAsignadoMapeado = mapearAsignaturas(asignadas);
                const progresoCompletadoMapeado = mapearAsignaturas(completadas);

                /*
                 * Usar SIEMPRE la misma fuente de verdad que el desglose visual.
                 * Así evitamos mostrar un total global que no coincide con la suma
                 * de las asignaturas renderizadas en el modal.
                 */
                const totalAsignado = progresoAsignadoMapeado.reduce((acc, item) => acc + (parseFloat(String(item.horasCompletadas)) || 0), 0);
                const totalCompletado = progresoCompletadoMapeado.reduce((acc, item) => acc + (parseFloat(String(item.horasCompletadas)) || 0), 0);

                setProgresoAsignado(progresoAsignadoMapeado);
                setProgresoCompletado(progresoCompletadoMapeado);
                setHorasAsignadas(totalAsignado);
                setHorasCompletadas(totalCompletado);
            } catch (err) {
                if (abortController.signal.aborted) return;

                console.error('[useProgresoAlumno] Error cargando progreso', err);
                setErrorCarga('No se pudo cargar el progreso actualizado. Se muestran datos aproximados.');

                /* Fallback con datos básicos para que el modal no quede vacío */
                const fallback = crearBaseAsignaturas();
                setProgresoAsignado(fallback);
                setProgresoCompletado(fallback);
                setHorasAsignadas(alumno.horas_completadas || 0);
                setHorasCompletadas(alumno.horas_completadas || 0);
            } finally {
                if (!abortController.signal.aborted) {
                    setCargando(false);
                }
            }
        };

        cargarProgreso();
        return () => { abortController.abort(); };
    }, [visible, alumno]);

    return {cargando, errorCarga, progresoAsignado, progresoCompletado, horasAsignadas, horasCompletadas};
}
