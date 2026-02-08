/**
 * Hook: useFocusTrap
 * Atrapa el foco dentro de un contenedor (modales, paneles).
 * Al activar: mueve foco al primer elemento focusable.
 * Al desactivar: restaura foco al elemento que lo abrió.
 * Tab/Shift+Tab ciclan dentro del contenedor.
 */
import {useEffect, useRef} from 'react';

const SELECTORES_FOCUSABLES = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'textarea:not([disabled])',
    'select:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
].join(', ');

export function useFocusTrap(contenedorRef: React.RefObject<HTMLElement | null>, activo: boolean): void {
    const elementoAnteriorRef = useRef<HTMLElement | null>(null);

    useEffect(() => {
        if (!activo) return;

        /* Guardar el elemento que tenía foco antes de abrir */
        elementoAnteriorRef.current = document.activeElement as HTMLElement;

        const contenedor = contenedorRef.current;
        if (!contenedor) return;

        /* Mover foco al primer elemento focusable dentro del contenedor */
        const enfocarPrimero = () => {
            const elementos = contenedor.querySelectorAll<HTMLElement>(SELECTORES_FOCUSABLES);
            if (elementos.length > 0) {
                elementos[0].focus();
            }
        };

        /* Pequeño delay para que el DOM se renderice */
        const timer = setTimeout(enfocarPrimero, 50);

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key !== 'Tab') return;

            const elementos = contenedor.querySelectorAll<HTMLElement>(SELECTORES_FOCUSABLES);
            if (elementos.length === 0) return;

            const primero = elementos[0];
            const ultimo = elementos[elementos.length - 1];

            if (e.shiftKey) {
                /* Shift+Tab: si está en el primero, ir al último */
                if (document.activeElement === primero) {
                    e.preventDefault();
                    ultimo.focus();
                }
            } else {
                /* Tab: si está en el último, ir al primero */
                if (document.activeElement === ultimo) {
                    e.preventDefault();
                    primero.focus();
                }
            }
        };

        document.addEventListener('keydown', handleKeyDown);

        return () => {
            clearTimeout(timer);
            document.removeEventListener('keydown', handleKeyDown);

            /* Restaurar foco al elemento anterior */
            if (elementoAnteriorRef.current && elementoAnteriorRef.current.focus) {
                elementoAnteriorRef.current.focus();
            }
        };
    }, [activo, contenedorRef]);
}
