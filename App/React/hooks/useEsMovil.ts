/*
 * Hook: useEsMovil
 * Detecta si el viewport esta en breakpoint movil (768px).
 * Reutilizable en cualquier componente que necesite logica condicional por plataforma.
 * Usa matchMedia para sincronizar con los media queries CSS.
 */

import { useState, useEffect } from 'react';

const BREAKPOINT_MOVIL = 768;
const mediaQuery = `(max-width: ${BREAKPOINT_MOVIL}px)`;

export const useEsMovil = (): boolean => {
    const [esMovil, setEsMovil] = useState(() => {
        if (typeof window === 'undefined') return false;
        return window.matchMedia(mediaQuery).matches;
    });

    useEffect(() => {
        const mql = window.matchMedia(mediaQuery);
        const manejarCambio = (e: MediaQueryListEvent) => setEsMovil(e.matches);
        mql.addEventListener('change', manejarCambio);
        return () => mql.removeEventListener('change', manejarCambio);
    }, []);

    return esMovil;
};
