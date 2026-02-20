/**
 * useCalendarioClases
 * 
 * Carga de clases desde la API y toggle de bloqueo.
 * Responsabilidad: comunicación con API para lectura de clases.
 */

import {useState, useCallback, useEffect} from 'react';
import type {Clase} from '../../types';
import {API_BASE} from '../../constants';
import {interpretarErrorRed, formatearMensajeError, obtenerMensajeContextual, procesarErrorApi} from '../../constants/cap-errores';
import type {EstadoBase} from './tipos';

interface Props {
    base: EstadoBase;
}

export function useCalendarioClases({base}: Props) {
    const {clases, setClases, semanaActual, setError, getNonce, formatearFechaApi, normalizarHora} = base;
    const [cargando, setCargando] = useState(false);

    /* Cargar clases de la semana desde API */
    const cargarClases = useCallback(async (signal?: AbortSignal) => {
        setCargando(true);
        setError(null);

        try {
            const fechaInicio = formatearFechaApi(semanaActual);

            const response = await fetch(`${API_BASE}/clases?semana=${fechaInicio}`, {
                headers: {
                    'X-WP-Nonce': getNonce()
                },
                signal
            });

            if (!response.ok) {
                const mensajeError = await procesarErrorApi(response, 'calendario', 'cargar');
                throw new Error(mensajeError);
            }

            const data = await response.json();

            /* Mapear respuesta del backend a formato frontend */
            const clasesFormateadas: Clase[] = (data.clases || []).map((c: any) => ({
                id: c.id,
                centroId: c.centro_id,
                fecha: c.fecha,
                horaInicio: normalizarHora(c.hora_inicio),
                horaFin: normalizarHora(c.hora_fin),
                asignaturaId: c.asignatura,
                bloqueada: c.bloqueada === true || c.bloqueada === 1 || c.bloqueada === '1',
                alumnosIds: (c.alumnos || []).map((a: any) => a.id),
                alumnosData: (c.alumnos || []).map((a: any) => ({
                    id: a.id,
                    nombre: a.nombre,
                    asistio: a.asistio === true || a.asistio === 1 || a.asistio === '1'
                }))
            }));

            setClases(clasesFormateadas);
        } catch (err) {
            if (err instanceof DOMException && err.name === 'AbortError') return;
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
    }, [semanaActual, getNonce, formatearFechaApi, normalizarHora, setClases, setError]);

    /* Cargar clases al cambiar de semana con AbortController */
    useEffect(() => {
        const controller = new AbortController();
        cargarClases(controller.signal);
        return () => controller.abort();
    }, [cargarClases]);

    /* Bloqueo/desbloqueo de clases (update optimista con rollback) */
    const toggleBloqueoClase = useCallback(
        async (claseId: number) => {
            const clase = clases.find(c => c.id === claseId);
            if (!clase) return;

            setClases(prev => prev.map(c => (c.id === claseId ? {...c, bloqueada: !c.bloqueada} : c)));

            try {
                const response = await fetch(`${API_BASE}/clases/${claseId}/toggle-bloqueo`, {
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
                /* Rollback del cambio optimista */
                setClases(prev => prev.map(c => (c.id === claseId ? {...c, bloqueada: clase.bloqueada} : c)));
                const contextual = obtenerMensajeContextual('calendario', 'bloquear');
                setError(err instanceof Error ? err.message : `${contextual.fallback} ${contextual.sugerencia}`);
            }
        },
        [clases, getNonce, setClases, setError]
    );

    const recargarClases = useCallback(async () => {
        await cargarClases();
    }, [cargarClases]);

    return {cargando, cargarClases, toggleBloqueoClase, recargarClases};
}
