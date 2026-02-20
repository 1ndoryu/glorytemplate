/**
 * useCalendarioGeneracion
 * 
 * Generación del calendario con detección de conflictos y avisos.
 * Responsabilidad: comunicación con API para generar/regenerar.
 */

import {useState, useCallback} from 'react';
import type {ConflictoAforo, ExclusionesConflicto, ResultadoGeneracion, AvisoGeneracion} from '../../types';
import {API_BASE} from '../../constants';
import {obtenerMensajeContextual, procesarErrorApi} from '../../constants/cap-errores';
import type {EstadoBase} from './tipos';

interface Props {
    base: EstadoBase;
    cargarClases: () => Promise<void>;
}

export function useCalendarioGeneracion({base, cargarClases}: Props) {
    const {semanaActual, setError, getNonce, formatearFechaApi, guardarSnapshot} = base;

    const [generando, setGenerando] = useState(false);
    const [conflictos, setConflictos] = useState<ConflictoAforo[]>([]);
    const [mostrarModalConflictos, setMostrarModalConflictos] = useState(false);
    const [avisosGeneracion, setAvisosGeneracion] = useState<AvisoGeneracion[]>([]);
    const [mostrarModalAvisos, setMostrarModalAvisos] = useState(false);

    /* Generar calendario con soporte para generación parcial */
    const generarCalendario = useCallback(async (fechaDesde?: string) => {
        guardarSnapshot();
        setGenerando(true);
        setError(null);
        setConflictos([]);
        setAvisosGeneracion([]);

        try {
            const body: any = {semana: formatearFechaApi(semanaActual)};
            if (fechaDesde) body.fechaDesde = fechaDesde;

            const response = await fetch(`${API_BASE}/generar`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-WP-Nonce': getNonce()
                },
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                const mensajeError = await procesarErrorApi(response, 'calendario', 'generar');
                throw new Error(mensajeError);
            }

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

            /* Mapear avisos (ej: horas no cubiertas) */
            const avisosFormateados = (resultado.avisos || []).map((a: any) => ({
                tipo: 'horas_no_cubiertas' as const,
                fecha: a.fecha,
                diaSemana: a.diaNombre || a.dia_nombre,
                horasDisponiblesCentro: a.horasDisponibles ?? a.horas_disponibles ?? 0,
                horasAsignadas: a.horasCubiertas ?? a.horas_cubiertas ?? 0,
                horasSinCubrir: a.horasNoCubiertas ?? a.horas_no_cubiertas ?? 0,
                rangosNoCubiertos: a.rangosNoCubiertos ?? a.rangos_no_cubiertos ?? [],
                alumnosActivos: a.alumnosActivos ?? a.alumnos_activos ?? 0,
                maxHorasDiaAlumno: a.maxHorasDiaAlumno ?? a.max_horas_dia_alumno ?? 9,
                capacidadClase: a.capacidadClase ?? a.capacidad_clase ?? 20
            }));

            if (!resultado.exito && conflictosFormateados.length > 0) {
                setConflictos(conflictosFormateados);
                setMostrarModalConflictos(true);
            } else if (resultado.exito) {
                await cargarClases();
                if (avisosFormateados.length > 0) {
                    setAvisosGeneracion(avisosFormateados);
                    setMostrarModalAvisos(true);
                }
            } else {
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
    }, [semanaActual, getNonce, formatearFechaApi, cargarClases, guardarSnapshot, setError]);

    /* Generar con exclusiones (después de resolver conflictos) */
    const generarConExclusiones = useCallback(
        async (exclusiones: ExclusionesConflicto) => {
            setGenerando(true);
            setError(null);

            try {
                const response = await fetch(`${API_BASE}/generar/con-exclusiones`, {
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

                if (!response.ok) {
                    const mensajeError = await procesarErrorApi(response, 'calendario', 'generar');
                    throw new Error(mensajeError);
                }

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
        [semanaActual, getNonce, formatearFechaApi, cargarClases, setError]
    );

    const cerrarModalConflictos = useCallback(() => {
        setMostrarModalConflictos(false);
        setConflictos([]);
    }, []);

    const cerrarModalAvisos = useCallback(() => {
        setMostrarModalAvisos(false);
        setAvisosGeneracion([]);
    }, []);

    return {
        generando,
        conflictos,
        mostrarModalConflictos,
        avisosGeneracion,
        mostrarModalAvisos,
        generarCalendario,
        generarConExclusiones,
        cerrarModalConflictos,
        cerrarModalAvisos,
        /* Reutilizado por borrarSemanaCompleta */
        setGenerando
    };
}
