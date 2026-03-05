/**
 * useClickFuera — Detecta clics fuera de un elemento referenciado.
 * Ideal para cerrar popups, dropdowns y menús contextuales.
 */

import { useEffect, type RefObject } from 'react';

export function useClickFuera<T extends HTMLElement>(
    ref: RefObject<T | null>,
    callback: () => void,
    activo = true,
): void {
    useEffect(() => {
        if (!activo) return;

        const manejarClick = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                callback();
            }
        };

        document.addEventListener('mousedown', manejarClick);
        return () => document.removeEventListener('mousedown', manejarClick);
    }, [ref, callback, activo]);
}
