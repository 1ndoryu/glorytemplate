/*
 * Hook: useInputBusqueda
 * Lógica de input con debounce, sincronización de valor externo y limpieza.
 * Extraído de InputBusqueda para cumplir SRP.
 */

import { useState, useEffect, useRef, type ChangeEvent } from 'react';

interface UseInputBusquedaParams {
    valorExterno?: string;
    onChange: (valor: string) => void;
    debounceMs: number;
    autoFocus: boolean;
}

export const useInputBusqueda = ({
    valorExterno,
    onChange,
    debounceMs,
    autoFocus,
}: UseInputBusquedaParams) => {
    const [valorInterno, setValorInterno] = useState(valorExterno ?? '');
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    /* Sincronizar valor externo */
    useEffect(() => {
        if (valorExterno !== undefined) {
            setValorInterno(valorExterno);
        }
    }, [valorExterno]);

    /* AutoFocus */
    useEffect(() => {
        if (autoFocus && inputRef.current) {
            inputRef.current.focus();
        }
    }, [autoFocus]);

    const manejarCambio = (e: ChangeEvent<HTMLInputElement>) => {
        const nuevoValor = e.target.value;
        setValorInterno(nuevoValor);

        if (timerRef.current) {
            clearTimeout(timerRef.current);
        }

        timerRef.current = setTimeout(() => {
            onChange(nuevoValor);
        }, debounceMs);
    };

    const limpiar = () => {
        setValorInterno('');
        onChange('');
        inputRef.current?.focus();
    };

    /* Limpiar timer al desmontar */
    useEffect(() => {
        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }
        };
    }, []);

    return {
        valorInterno,
        inputRef,
        manejarCambio,
        limpiar,
    };
};
