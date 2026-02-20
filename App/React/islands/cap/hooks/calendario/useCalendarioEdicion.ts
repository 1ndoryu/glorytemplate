/**
 * useCalendarioEdicion
 * 
 * Edición inline de clases: selección, modal, actualización.
 * Responsabilidad: comunicación con API para modificar una clase.
 */

import {useState, useCallback} from 'react';
import type {Clase} from '../../types';
import {API_BASE} from '../../constants';
import {detectarColision} from '../../utils/collisionUtils';
import {obtenerMensajeContextual, procesarErrorApi} from '../../constants/cap-errores';
import type {EstadoBase, CambiosClase} from './tipos';

interface Props {
    base: EstadoBase;
}

export function useCalendarioEdicion({base}: Props) {
    const {clases, setClases, setError, getNonce, normalizarHora, guardarSnapshot, historialClases, setHistorialClases} = base;

    const [claseSeleccionada, setClaseSeleccionada] = useState<Clase | null>(null);
    const [mostrarModalEdicion, setMostrarModalEdicion] = useState(false);
    const [guardandoEdicion, setGuardandoEdicion] = useState(false);

    const seleccionarClase = useCallback((clase: Clase) => {
        setClaseSeleccionada(clase);
        setMostrarModalEdicion(true);
    }, []);

    const cerrarModalEdicion = useCallback(() => {
        setMostrarModalEdicion(false);
        setClaseSeleccionada(null);
    }, []);

    /* Actualizar clase con cambios (update optimista con rollback) */
    const actualizarClase = useCallback(
        async (claseId: number, cambios: CambiosClase) => {
            const claseActual = clases.find(c => c.id === claseId);
            if (!claseActual) return;

            const horaInicioOriginal = normalizarHora(claseActual.horaInicio);
            const horaFinOriginal = normalizarHora(claseActual.horaFin);
            const horaInicioNueva = normalizarHora(cambios.horaInicio ?? horaInicioOriginal);
            const horaFinNueva = normalizarHora(cambios.horaFin ?? horaFinOriginal);
            const cambiaHorario = horaInicioNueva !== horaInicioOriginal || horaFinNueva !== horaFinOriginal;

            /* Validar conflictos de horario al editar */
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
            guardarSnapshot();

            /* Update optimista */
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
                const response = await fetch(`${API_BASE}/clases/${claseId}`, {
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

                cerrarModalEdicion();
            } catch (err) {
                /* Rollback usando último snapshot */
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
        [clases, getNonce, guardarSnapshot, cerrarModalEdicion, historialClases, normalizarHora, setClases, setError, setHistorialClases]
    );

    /* Deshacer último cambio */
    const deshacer = useCallback(() => {
        if (historialClases.length === 0) return;
        const estadoAnterior = historialClases[historialClases.length - 1];
        setClases(estadoAnterior);
        setHistorialClases(prev => prev.slice(0, -1));
    }, [historialClases, setClases, setHistorialClases]);

    return {
        claseSeleccionada,
        mostrarModalEdicion,
        guardandoEdicion,
        seleccionarClase,
        cerrarModalEdicion,
        actualizarClase,
        deshacer
    };
}
