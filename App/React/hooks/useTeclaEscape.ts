/**
 * useTeclaEscape — Ejecuta un callback cuando se presiona la tecla Escape.
 * Útil para cerrar modales, popups y overlays con accesibilidad de teclado.
 */

import { useEffect } from 'react';

export function useTeclaEscape(callback: () => void, activo = true): void {
    useEffect(() => {
        if (!activo) return;

        const manejarTecla = (e: KeyboardEvent) => {
            if (e.key === 'Escape') callback();
        };

        document.addEventListener('keydown', manejarTecla);
        return () => document.removeEventListener('keydown', manejarTecla);
    }, [callback, activo]);
}
