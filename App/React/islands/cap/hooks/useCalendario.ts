/**
 * Hook useCalendario
 *
 * Gestión del estado del calendario CAP:
 * - Navegación entre semanas
 * - Clases de la semana actual
 * - Bloqueo/desbloqueo de clases
 * - Comunicación con API
 */

import {useState, useCallback, useEffect} from 'react';
import type {Clase, DiaSemana} from '../types';
import {getLunesDeSemana, getFechasSemana, DIAS_SEMANA} from '../constants';

interface EstadoCalendario {
    clases: Clase[];
    semanaActual: Date;
    fechasSemana: Date[];
    cargando: boolean;
    error: string | null;
    generando: boolean;
}

interface AccionesCalendario {
    irSemanaAnterior: () => void;
    irSemanaSiguiente: () => void;
    irASemana: (fecha: Date) => void;
    irASemanaActual: () => void;
    toggleBloqueoClase: (claseId: number) => void;
    recargarClases: () => Promise<void>;
    generarCalendario: () => Promise<void>;
}

export function useCalendario(): EstadoCalendario & AccionesCalendario {
    /* Estado principal */
    const [clases, setClases] = useState<Clase[]>([]);
    const [semanaActual, setSemanaActual] = useState(() => getLunesDeSemana(new Date()));
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [generando, setGenerando] = useState(false);

    /* Fechas de la semana actual */
    const fechasSemana = getFechasSemana(semanaActual);

    /* Obtener nonce de WordPress */
    const getNonce = useCallback((): string => {
        if (typeof window !== 'undefined' && (window as any).wpApiSettings?.nonce) {
            return (window as any).wpApiSettings.nonce;
        }
        return '';
    }, []);

    /* Cargar clases de la semana desde API */
    const cargarClases = useCallback(async () => {
        setCargando(true);
        setError(null);

        try {
            const fechaInicio = semanaActual.toISOString().split('T')[0];
            const fechaFin = new Date(semanaActual);
            fechaFin.setDate(fechaFin.getDate() + 4);
            const fechaFinStr = fechaFin.toISOString().split('T')[0];

            const response = await fetch(`/wp-json/cap/v1/clases?fecha_inicio=${fechaInicio}&fecha_fin=${fechaFinStr}`, {
                headers: {
                    'X-WP-Nonce': getNonce()
                }
            });

            if (!response.ok) {
                throw new Error('Error al cargar las clases');
            }

            const data = await response.json();
            setClases(data.clases || []);
        } catch (err) {
            console.error('Error cargando clases:', err);
            setError(err instanceof Error ? err.message : 'Error desconocido');
            /* No limpiar clases existentes si hay error */
        } finally {
            setCargando(false);
        }
    }, [semanaActual, getNonce]);

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
                const response = await fetch(`/wp-json/cap/v1/clases/${claseId}/bloqueo`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-WP-Nonce': getNonce()
                    },
                    body: JSON.stringify({bloqueada: !clase.bloqueada})
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

        try {
            const response = await fetch('/wp-json/cap/v1/generar', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-WP-Nonce': getNonce()
                },
                body: JSON.stringify({
                    semana_inicio: semanaActual.toISOString().split('T')[0]
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al generar calendario');
            }

            /* Recargar clases tras generación exitosa */
            await cargarClases();
        } catch (err) {
            console.error('Error generando calendario:', err);
            setError(err instanceof Error ? err.message : 'Error al generar');
        } finally {
            setGenerando(false);
        }
    }, [semanaActual, getNonce, cargarClases]);

    /* Obtener clases agrupadas por día */
    const getClasesPorDia = useCallback(
        (dia: DiaSemana): Clase[] => {
            const indiceDia = DIAS_SEMANA.indexOf(dia);
            const fechaDia = fechasSemana[indiceDia];
            const fechaStr = fechaDia.toISOString().split('T')[0];

            return clases.filter(c => c.fecha === fechaStr).sort((a, b) => a.horaInicio.localeCompare(b.horaInicio));
        },
        [clases, fechasSemana]
    );

    return {
        clases,
        semanaActual,
        fechasSemana,
        cargando,
        error,
        generando,
        irSemanaAnterior,
        irSemanaSiguiente,
        irASemana,
        irASemanaActual,
        toggleBloqueoClase,
        recargarClases,
        generarCalendario
    };
}
