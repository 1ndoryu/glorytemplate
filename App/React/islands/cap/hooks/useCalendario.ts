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

interface EstadoCalendario {
    clases: Clase[];
    semanaActual: Date;
    fechasSemana: Date[];
    cargando: boolean;
    error: string | null;
    generando: boolean;
    conflictos: ConflictoAforo[];
    mostrarModalConflictos: boolean;
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
                throw new Error('Error al cargar las clases');
            }

            const data = await response.json();

            /* Mapear respuesta del backend a formato frontend */
            const clasesFormateadas = (data.clases || []).map((c: any) => ({
                id: c.id,
                centroId: c.centro_id,
                fecha: c.fecha,
                horaInicio: c.hora_inicio,
                horaFin: c.hora_fin,
                asignaturaId: c.asignatura,
                bloqueada: Boolean(c.bloqueada),
                alumnosIds: (c.alumnos || []).map((a: any) => a.id)
            }));

            setClases(clasesFormateadas);
        } catch (err) {
            console.error('Error cargando clases:', err);
            setError(err instanceof Error ? err.message : 'Error desconocido');
        } finally {
            setCargando(false);
        }
    }, [semanaActual, getNonce, formatearFechaApi]);

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
                    throw new Error('Error al actualizar bloqueo');
                }
            } catch (err) {
                /* Revertir cambio optimista */
                setClases(prev => prev.map(c => (c.id === claseId ? {...c, bloqueada: clase.bloqueada} : c)));
                setError('Error al cambiar el bloqueo de la clase');
            }
        },
        [clases, getNonce]
    );

    /* Recargar clases manualmente */
    const recargarClases = useCallback(async () => {
        await cargarClases();
    }, [cargarClases]);

    /* Generar calendario */
    const generarCalendario = useCallback(async () => {
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
                setError(resultado.mensaje || 'Error al generar calendario');
            }
        } catch (err) {
            console.error('Error generando calendario:', err);
            setError(err instanceof Error ? err.message : 'Error al generar');
        } finally {
            setGenerando(false);
        }
    }, [semanaActual, getNonce, formatearFechaApi, cargarClases]);

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
                    setError(resultado.mensaje || 'Error al generar con exclusiones');
                }
            } catch (err) {
                console.error('Error generando con exclusiones:', err);
                setError(err instanceof Error ? err.message : 'Error al generar');
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

    return {
        clases,
        semanaActual,
        fechasSemana,
        cargando,
        error,
        generando,
        conflictos,
        mostrarModalConflictos,
        irSemanaAnterior,
        irSemanaSiguiente,
        irASemana,
        irASemanaActual,
        toggleBloqueoClase,
        recargarClases,
        generarCalendario,
        generarConExclusiones,
        cerrarModalConflictos,
        limpiarError
    };
}
