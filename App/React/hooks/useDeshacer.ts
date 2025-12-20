/*
 * useDeshacer
 * Hook para manejar acciones reversibles con sistema de undo
 * Responsabilidad única: gestionar cola de acciones deshacer con timeout
 */

import {useState, useCallback, useRef, useEffect} from 'react';

interface AccionDeshacer {
    id: string;
    mensaje: string;
    ejecutarDeshacer: () => void;
    tiempoCreacion: number;
}

interface UsesDeshacerReturn {
    accionActual: AccionDeshacer | null;
    registrarAccion: (mensaje: string, ejecutarDeshacer: () => void) => void;
    deshacer: () => void;
    descartarAccion: () => void;
    tiempoRestante: number;
}

const TIEMPO_LIMITE_MS = 5000;
const INTERVALO_ACTUALIZACION_MS = 100;

export function useDeshacer(): UsesDeshacerReturn {
    const [accionActual, setAccionActual] = useState<AccionDeshacer | null>(null);
    const [tiempoRestante, setTiempoRestante] = useState(TIEMPO_LIMITE_MS);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    /*
     * Limpia los timers activos
     */
    const limpiarTimers = useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    }, []);

    /*
     * Descarta la acción actual sin ejecutar deshacer
     */
    const descartarAccion = useCallback(() => {
        limpiarTimers();
        setAccionActual(null);
        setTiempoRestante(TIEMPO_LIMITE_MS);
    }, [limpiarTimers]);

    /*
     * Ejecuta la acción de deshacer y limpia el estado
     */
    const deshacer = useCallback(() => {
        if (accionActual) {
            accionActual.ejecutarDeshacer();
            descartarAccion();
        }
    }, [accionActual, descartarAccion]);

    /*
     * Registra una nueva acción reversible
     * Reemplaza cualquier acción pendiente anterior
     */
    const registrarAccion = useCallback(
        (mensaje: string, ejecutarDeshacer: () => void) => {
            limpiarTimers();

            const nuevaAccion: AccionDeshacer = {
                id: Date.now().toString(),
                mensaje,
                ejecutarDeshacer,
                tiempoCreacion: Date.now()
            };

            setAccionActual(nuevaAccion);
            setTiempoRestante(TIEMPO_LIMITE_MS);

            /* Timer para auto-descartar después del tiempo límite */
            timeoutRef.current = setTimeout(() => {
                setAccionActual(null);
                setTiempoRestante(TIEMPO_LIMITE_MS);
            }, TIEMPO_LIMITE_MS);

            /* Interval para actualizar el tiempo restante */
            intervalRef.current = setInterval(() => {
                setTiempoRestante(prev => {
                    const nuevo = prev - INTERVALO_ACTUALIZACION_MS;
                    return nuevo > 0 ? nuevo : 0;
                });
            }, INTERVALO_ACTUALIZACION_MS);
        },
        [limpiarTimers]
    );

    /* Limpieza al desmontar */
    useEffect(() => {
        return () => {
            limpiarTimers();
        };
    }, [limpiarTimers]);

    return {
        accionActual,
        registrarAccion,
        deshacer,
        descartarAccion,
        tiempoRestante
    };
}
