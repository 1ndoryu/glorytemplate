/*
 * usePaginacionProgresiva
 * Throttle progresivo para infinite scroll que previene carga infinita.
 *
 * Comportamiento:
 *   - Primeras paginasRapidas: carga inmediata (0ms delay).
 *   - Siguientes paginas hasta maxAutoCarga: delay creciente.
 *   - Despues de maxAutoCarga: requiere accion manual (boton "Cargar mas").
 *
 * Cada feed que usa infinite scroll debe integrar este hook para proteger
 * contra scrolling pasivo que cargaria todo el catalogo.
 */

import { useRef, useState, useCallback, useEffect } from 'react';

interface ConfigPaginacionProgresiva {
    /** Paginas que cargan sin delay (default: 3) */
    paginasRapidas?: number;
    /** Maximo de paginas con auto-carga antes de requerir manual (default: 10) */
    maxAutoCarga?: number;
    /** Delay base en ms para la primera pagina con throttle (default: 800) */
    delayBaseMs?: number;
    /** Factor multiplicador por cada pagina adicional (default: 1.4) */
    factorIncremento?: number;
}

const DEFAULTS = {
    paginasRapidas: 3,
    maxAutoCarga: 10,
    delayBaseMs: 800,
    factorIncremento: 1.4,
} as const;

/**
 * Calcula el delay en ms para una pagina dada.
 * Retorna -1 si la pagina excede maxAutoCarga (requiere manual).
 */
function calcularDelay(
    pagina: number,
    paginasRapidas: number,
    maxAutoCarga: number,
    delayBaseMs: number,
    factorIncremento: number,
): number {
    if (pagina <= paginasRapidas) return 0;
    if (pagina > maxAutoCarga) return -1;
    const nivel = pagina - paginasRapidas;
    return Math.round(delayBaseMs * Math.pow(factorIncremento, nivel - 1));
}

export function usePaginacionProgresiva(config: ConfigPaginacionProgresiva = {}) {
    const paginasRapidas = config.paginasRapidas ?? DEFAULTS.paginasRapidas;
    const maxAutoCarga = config.maxAutoCarga ?? DEFAULTS.maxAutoCarga;
    const delayBaseMs = config.delayBaseMs ?? DEFAULTS.delayBaseMs;
    const factorIncremento = config.factorIncremento ?? DEFAULTS.factorIncremento;

    const timerRef = useRef<ReturnType<typeof setTimeout>>();
    const [requiereManual, setRequiereManual] = useState(false);

    /**
     * Programa la carga de la siguiente pagina con throttle progresivo.
     * Retorna true si se programo, false si requiere carga manual.
     */
    const programarCarga = useCallback((pagina: number, callback: () => void): boolean => {
        clearTimeout(timerRef.current);

        const delay = calcularDelay(pagina, paginasRapidas, maxAutoCarga, delayBaseMs, factorIncremento);

        if (delay === -1) {
            setRequiereManual(true);
            return false;
        }

        if (delay === 0) {
            callback();
        } else {
            timerRef.current = setTimeout(callback, delay);
        }

        return true;
    }, [paginasRapidas, maxAutoCarga, delayBaseMs, factorIncremento]);

    /** Ejecuta una carga manual y permite N paginas rapidas adicionales */
    const cargarManual = useCallback((callback: () => void) => {
        setRequiereManual(false);
        callback();
    }, []);

    /** Reset completo (cambio de orden, filtros, busqueda, claveCache) */
    const resetear = useCallback(() => {
        clearTimeout(timerRef.current);
        setRequiereManual(false);
    }, []);

    /* Cleanup al desmontar */
    useEffect(() => {
        return () => clearTimeout(timerRef.current);
    }, []);

    return { programarCarga, cargarManual, resetear, requiereManual };
}
