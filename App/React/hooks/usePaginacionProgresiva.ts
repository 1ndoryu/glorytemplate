/*
 * usePaginacionProgresiva
 * Throttle basado en velocidad para infinite scroll que previene carga descontrolada.
 *
 * QL79 — Comportamiento:
 *   - Primeras N paginas: carga inmediata sin deteccion.
 *   - Despues: mide el tiempo entre cargas recientes.
 *   - Si las cargas promedio son mas rapidas que el umbral: pausa 2 segundos
 *     y luego ejecuta la carga automaticamente. Sin boton manual.
 */

import { useRef, useCallback, useEffect } from 'react';

interface ConfigPaginacionProgresiva {
    /** Paginas iniciales sin chequeo de velocidad (default: 5) */
    paginasMinimasInicio?: number;
    /** Cuantas cargas recientes se analizan para deteccion (default: 3) */
    ventanaDeteccion?: number;
    /** Umbral en ms: si el promedio entre cargas es menor, se considera rapido (default: 1500) */
    umbralRapidoMs?: number;
    /** Duracion de la pausa en ms cuando se detecta scroll rapido (default: 2000) */
    pausaMs?: number;
}

const DEFAULTS = {
    paginasMinimasInicio: 5,
    ventanaDeteccion: 3,
    umbralRapidoMs: 1500,
    pausaMs: 2000,
} as const;

export function usePaginacionProgresiva(config: ConfigPaginacionProgresiva = {}) {
    const paginasMinimasInicio = config.paginasMinimasInicio ?? DEFAULTS.paginasMinimasInicio;
    const ventanaDeteccion = config.ventanaDeteccion ?? DEFAULTS.ventanaDeteccion;
    const umbralRapidoMs = config.umbralRapidoMs ?? DEFAULTS.umbralRapidoMs;
    const pausaMs = config.pausaMs ?? DEFAULTS.pausaMs;

    const timestampsRef = useRef<number[]>([]);
    const esperandoRef = useRef(false);
    const timerRef = useRef<ReturnType<typeof setTimeout>>();

    /**
     * Programa la carga de la siguiente pagina.
     * Retorna true si se ejecuta o se agenda, false si ya hay pausa activa.
     */
    const programarCarga = useCallback((pagina: number, callback: () => void): boolean => {
        /* Si ya hay una pausa activa, ignorar hasta que se resuelva */
        if (esperandoRef.current) return false;

        /* Primeras paginas: carga libre sin deteccion */
        if (pagina <= paginasMinimasInicio) {
            timestampsRef.current.push(Date.now());
            callback();
            return true;
        }

        const ahora = Date.now();
        const ts = timestampsRef.current;

        /* Verificar velocidad promedio ANTES de registrar timestamp.
         * Solo las cargas exitosas se registran; las bloqueadas no inflan
         * la deteccion de velocidad. */
        if (ts.length >= ventanaDeteccion) {
            const recientes = ts.slice(-ventanaDeteccion);
            let sumaGaps = 0;
            for (let i = 1; i < recientes.length; i++) {
                sumaGaps += recientes[i] - recientes[i - 1];
            }
            sumaGaps += ahora - recientes[recientes.length - 1];
            const promedioGap = sumaGaps / recientes.length;

            if (promedioGap < umbralRapidoMs) {
                /* Scroll rapido — pausar 2s y ejecutar automaticamente */
                esperandoRef.current = true;
                clearTimeout(timerRef.current);
                timerRef.current = setTimeout(() => {
                    esperandoRef.current = false;
                    timestampsRef.current = [];
                    callback();
                }, pausaMs);
                return true;
            }
        }

        /* Velocidad normal — registrar timestamp y ejecutar */
        timestampsRef.current.push(ahora);
        if (timestampsRef.current.length > ventanaDeteccion + 1) {
            timestampsRef.current = timestampsRef.current.slice(-(ventanaDeteccion + 1));
        }
        callback();
        return true;
    }, [paginasMinimasInicio, ventanaDeteccion, umbralRapidoMs, pausaMs]);

    /** Reset completo (cambio de filtros, busqueda, tab) */
    const resetear = useCallback(() => {
        clearTimeout(timerRef.current);
        timestampsRef.current = [];
        esperandoRef.current = false;
    }, []);

    /* Cleanup al desmontar */
    useEffect(() => {
        return () => clearTimeout(timerRef.current);
    }, []);

    return { programarCarga, resetear };
}
