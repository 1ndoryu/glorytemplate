/*
 * Hook: useSelectorBPM
 * Lógica de dropdown BPM: estado abierto/cerrado, valores locales,
 * click fuera, aplicar/limpiar, keyboard Enter/Escape.
 * Extraído de SelectorBPM para cumplir SRP.
 */

import { useState, useRef, useEffect, useCallback } from 'react';

interface UseSelectorBPMParams {
    bpmMin: number | null;
    bpmMax: number | null;
    onCambiar: (min: number | null, max: number | null) => void;
}

export const useSelectorBPM = ({
    bpmMin,
    bpmMax,
    onCambiar,
}: UseSelectorBPMParams) => {
    const [abierto, setAbierto] = useState(false);
    const [minLocal, setMinLocal] = useState(bpmMin?.toString() ?? '');
    const [maxLocal, setMaxLocal] = useState(bpmMax?.toString() ?? '');
    const contenedorRef = useRef<HTMLDivElement>(null);

    /* Sync cuando el store cambie externamente */
    useEffect(() => {
        setMinLocal(bpmMin?.toString() ?? '');
        setMaxLocal(bpmMax?.toString() ?? '');
    }, [bpmMin, bpmMax]);

    /* Cerrar al hacer click fuera */
    useEffect(() => {
        if (!abierto) return;
        const cerrar = (e: MouseEvent) => {
            if (contenedorRef.current && !contenedorRef.current.contains(e.target as Node)) {
                setAbierto(false);
            }
        };
        document.addEventListener('mousedown', cerrar);
        return () => document.removeEventListener('mousedown', cerrar);
    }, [abierto]);

    const activo = bpmMin !== null || bpmMax !== null;

    const aplicar = useCallback(() => {
        const min = minLocal.trim() ? parseInt(minLocal, 10) : null;
        const max = maxLocal.trim() ? parseInt(maxLocal, 10) : null;
        onCambiar(
            min !== null && !isNaN(min) ? min : null,
            max !== null && !isNaN(max) ? max : null
        );
    }, [minLocal, maxLocal, onCambiar]);

    const limpiar = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        setMinLocal('');
        setMaxLocal('');
        onCambiar(null, null);
    }, [onCambiar]);

    const manejarKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            aplicar();
            setAbierto(false);
        } else if (e.key === 'Escape') {
            setAbierto(false);
        }
    }, [aplicar]);

    const etiquetaTexto = activo
        ? `BPM: ${bpmMin ?? '–'}–${bpmMax ?? '–'}`
        : 'BPM';

    const toggleAbierto = () => setAbierto(!abierto);

    const aplicarYCerrar = () => {
        aplicar();
        setAbierto(false);
    };

    return {
        abierto,
        minLocal,
        maxLocal,
        activo,
        etiquetaTexto,
        contenedorRef,
        setMinLocal,
        setMaxLocal,
        toggleAbierto,
        limpiar,
        manejarKeyDown,
        aplicarYCerrar,
    };
};
