/*
 * useDebounce
 * Hook para demorar la ejecución de funciones
 * Útil para evitar llamadas excesivas durante escritura
 */

import {useState, useEffect, useRef, useCallback} from 'react';

/*
 * Hook que retorna un valor debounceado
 * El valor solo se actualiza después de que pasa el delay sin cambios
 */
export function useDebounceValue<T>(valor: T, delay: number): T {
    const [valorDebounceado, setValorDebounceado] = useState<T>(valor);

    useEffect(() => {
        const timer = setTimeout(() => {
            setValorDebounceado(valor);
        }, delay);

        return () => {
            clearTimeout(timer);
        };
    }, [valor, delay]);

    return valorDebounceado;
}

/*
 * Hook que retorna una función debounceada
 * La función solo se ejecuta después de que pasa el delay sin llamadas
 */
export function useDebounceCallback<T extends (...args: Parameters<T>) => void>(callback: T, delay: number): {ejecutar: (...args: Parameters<T>) => void; pendiente: boolean} {
    const [pendiente, setPendiente] = useState(false);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const callbackRef = useRef(callback);

    /* Mantener referencia actualizada del callback */
    useEffect(() => {
        callbackRef.current = callback;
    }, [callback]);

    /* Limpiar timeout al desmontar */
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    const ejecutar = useCallback(
        (...args: Parameters<T>) => {
            setPendiente(true);

            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }

            timeoutRef.current = setTimeout(() => {
                callbackRef.current(...args);
                setPendiente(false);
            }, delay);
        },
        [delay]
    );

    return {ejecutar, pendiente};
}
