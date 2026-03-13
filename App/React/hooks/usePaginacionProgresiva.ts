/*
 * usePaginacionProgresiva
 * Throttle basado en velocidad para infinite scroll que previene carga descontrolada.
 *
 * QQ118 — Comportamiento:
 *   - Primeras N paginas: carga inmediata sin deteccion.
 *   - Despues: mide el tiempo entre cargas recientes.
 *   - Si las cargas promedio son mas rapidas que el umbral: pausa y muestra boton.
 *   - El boton desaparece automaticamente despues de unos segundos.
 *   - Si el usuario vuelve a scrollear rapido: reaparece.
 *
 * La API externa es compatible con la version anterior (programarCarga, cargarManual, resetear, requiereManual).
 */

import { useRef, useState, useCallback, useEffect } from 'react';

interface ConfigPaginacionProgresiva {
    /** Paginas iniciales sin chequeo de velocidad (default: 3) */
    paginasMinimasInicio?: number;
    /** Cuantas cargas recientes se analizan para deteccion (default: 3) */
    ventanaDeteccion?: number;
    /** Umbral en ms: si el promedio entre cargas es menor, se considera rapido (default: 2000) */
    umbralRapidoMs?: number;
    /** Tiempo en ms para auto-ocultar el boton (default: 6000) */
    tiempoAutoOcultarMs?: number;
}

const DEFAULTS = {
    paginasMinimasInicio: 3,
    ventanaDeteccion: 3,
    umbralRapidoMs: 2000,
    tiempoAutoOcultarMs: 6000,
} as const;

export function usePaginacionProgresiva(config: ConfigPaginacionProgresiva = {}) {
    const paginasMinimasInicio = config.paginasMinimasInicio ?? DEFAULTS.paginasMinimasInicio;
    const ventanaDeteccion = config.ventanaDeteccion ?? DEFAULTS.ventanaDeteccion;
    const umbralRapidoMs = config.umbralRapidoMs ?? DEFAULTS.umbralRapidoMs;
    const tiempoAutoOcultarMs = config.tiempoAutoOcultarMs ?? DEFAULTS.tiempoAutoOcultarMs;

    const timestampsRef = useRef<number[]>([]);
    const autoOcultarRef = useRef<ReturnType<typeof setTimeout>>();
    const [requiereManual, setRequiereManual] = useState(false);

    /**
     * Programa la carga de la siguiente pagina.
     * Retorna true si se ejecuta, false si se bloquea por velocidad excesiva.
     */
    const programarCarga = useCallback((pagina: number, callback: () => void): boolean => {
        /* Primeras paginas: carga libre sin deteccion */
        if (pagina <= paginasMinimasInicio) {
            timestampsRef.current.push(Date.now());
            callback();
            return true;
        }

        const ahora = Date.now();
        timestampsRef.current.push(ahora);

        /* Mantener solo las ultimas N timestamps */
        if (timestampsRef.current.length > ventanaDeteccion + 1) {
            timestampsRef.current = timestampsRef.current.slice(-(ventanaDeteccion + 1));
        }

        /* Verificar velocidad promedio entre cargas recientes */
        const ts = timestampsRef.current;
        if (ts.length >= ventanaDeteccion + 1) {
            let sumaGaps = 0;
            const numGaps = Math.min(ventanaDeteccion, ts.length - 1);
            for (let i = ts.length - numGaps; i < ts.length; i++) {
                sumaGaps += ts[i] - ts[i - 1];
            }
            const promedioGap = sumaGaps / numGaps;

            if (promedioGap < umbralRapidoMs) {
                /* Carga demasiado rapida — pausar y mostrar boton */
                setRequiereManual(true);
                clearTimeout(autoOcultarRef.current);
                autoOcultarRef.current = setTimeout(() => {
                    setRequiereManual(false);
                    /* Reset timestamps para que no se dispare inmediatamente al reanudar */
                    timestampsRef.current = [];
                }, tiempoAutoOcultarMs);
                return false;
            }
        }

        /* Velocidad normal — ejecutar */
        callback();
        return true;
    }, [paginasMinimasInicio, ventanaDeteccion, umbralRapidoMs, tiempoAutoOcultarMs]);

    /** Carga manual (click en boton) — resetea deteccion y ejecuta */
    const cargarManual = useCallback((callback: () => void) => {
        clearTimeout(autoOcultarRef.current);
        setRequiereManual(false);
        timestampsRef.current = [];
        callback();
    }, []);

    /** Reset completo (cambio de filtros, busqueda, tab) */
    const resetear = useCallback(() => {
        clearTimeout(autoOcultarRef.current);
        timestampsRef.current = [];
        setRequiereManual(false);
    }, []);

    /* Cleanup al desmontar */
    useEffect(() => {
        return () => clearTimeout(autoOcultarRef.current);
    }, []);

    return { programarCarga, cargarManual, resetear, requiereManual };
}
