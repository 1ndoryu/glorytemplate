/**
 * useCalendarioMovimiento
 * 
 * Mover clases (drag & drop individual y batch).
 * Responsabilidad: comunicación con API para cambiar fecha/hora de clases.
 */

import {useState, useCallback} from 'react';
import type {Clase} from '../../types';
import {API_BASE, getAsignatura} from '../../constants';
import {obtenerMensajeContextual, procesarErrorApi} from '../../constants/cap-errores';
import type {EstadoBase} from './tipos';

interface Props {
    base: EstadoBase;
}

export function useCalendarioMovimiento({base}: Props) {
    const {clases, setClases, setError, getNonce, normalizarHora, guardarSnapshot, historialClases, setHistorialClases} = base;
    const [moviendo, setMoviendo] = useState(false);

    /* Mover clase a otro día o cambiar hora (update optimista con rollback) */
    const moverClase = useCallback(
        async (claseId: number, nuevaFecha: string, nuevaHoraInicio?: string, nuevaHoraFin?: string) => {
            const clase = clases.find(c => c.id === claseId);
            if (!clase) return;

            if (clase.bloqueada) {
                setError('No se puede mover una clase bloqueada. Desbloquéala primero si necesitas cambiarla de día.');
                return;
            }

            setMoviendo(true);
            setError(null);
            guardarSnapshot();

            /* Update optimista */
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

                const response = await fetch(`${API_BASE}/clases/${claseId}`, {
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
                /* Rollback */
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
        [clases, getNonce, guardarSnapshot, historialClases, normalizarHora, setClases, setError, setHistorialClases]
    );

    /* Mover múltiples clases en paralelo (resolución de conflictos en cascada) */
    const moverMultiplesClases = useCallback(
        async (cambios: {clase: Clase; nuevoInicio: string; nuevoFin: string; nuevaFecha?: string}[]) => {
            if (cambios.length === 0) return;

            const claseBloqueada = cambios.find(c => c.clase.bloqueada);
            if (claseBloqueada) {
                const asignatura = getAsignatura(claseBloqueada.clase.asignaturaId);
                setError(`No se puede desplazar la clase "${asignatura?.nombre}" porque está bloqueada. Desbloquéala primero si necesitas cambiar su horario.`);
                return;
            }

            setMoviendo(true);
            setError(null);
            guardarSnapshot();

            /* Update optimista masivo */
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
                const promesas = cambios.map(cambio => {
                    const body: any = {
                        hora_inicio: cambio.nuevoInicio,
                        hora_fin: cambio.nuevoFin
                    };
                    if (cambio.nuevaFecha) body.fecha = cambio.nuevaFecha;

                    return fetch(`${API_BASE}/clases/${cambio.clase.id}`, {
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
                /* Rollback total si falla algo */
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
        [getNonce, guardarSnapshot, historialClases, normalizarHora, setClases, setError, setHistorialClases]
    );

    return {moviendo, moverClase, moverMultiplesClases};
}
