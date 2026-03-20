/*
 * Hook: useArrastrarScroll — Kamples (183A-110-B)
 * Habilita drag-to-scroll horizontal con mouse y touch en un elemento
 * con overflow-x. Mouse drag no es nativo — esta implementación lo simula.
 * Touch ya funciona nativamente con overflow-x, pero se refuerza para
 * Capacitor WebView donde a veces falla.
 * [193A-69] Click prevention: si el usuario arrastra >5px, se intercepta el
 * click siguiente para evitar que EnlaceNavegacion/links naveguen.
 */

import { useEffect, useRef, type RefObject } from 'react';

const UMBRAL_DRAG = 5;

export function useArrastrarScroll<T extends HTMLElement>(): RefObject<T> {
    const ref = useRef<T>(null);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        let activo = false;
        let startX = 0;
        let scrollLeft = 0;
        let arrastrado = false;

        const iniciar = (clientX: number) => {
            activo = true;
            arrastrado = false;
            startX = clientX;
            scrollLeft = el.scrollLeft;
            el.style.cursor = 'grabbing';
            el.style.userSelect = 'none';
        };

        const mover = (clientX: number) => {
            if (!activo) return;
            const diff = clientX - startX;
            if (Math.abs(diff) > UMBRAL_DRAG) arrastrado = true;
            el.scrollLeft = scrollLeft - diff;
        };

        const terminar = () => {
            if (!activo) return;
            activo = false;
            el.style.cursor = '';
            el.style.userSelect = '';
        };

        const onMouseDown = (e: MouseEvent) => {
            iniciar(e.clientX);
        };
        const onMouseMove = (e: MouseEvent) => {
            if (!activo) return;
            e.preventDefault();
            mover(e.clientX);
        };
        const onTouchStart = (e: TouchEvent) => {
            iniciar(e.touches[0].clientX);
        };
        const onTouchMove = (e: TouchEvent) => {
            mover(e.touches[0].clientX);
        };

        /* [193A-69] Interceptar click tras drag real para evitar navegación */
        const onClickCapture = (e: MouseEvent) => {
            if (arrastrado) {
                e.preventDefault();
                e.stopPropagation();
                arrastrado = false;
            }
        };

        el.addEventListener('mousedown', onMouseDown);
        el.addEventListener('mousemove', onMouseMove);
        el.addEventListener('mouseup', terminar);
        el.addEventListener('mouseleave', terminar);
        el.addEventListener('touchstart', onTouchStart, { passive: true });
        el.addEventListener('touchmove', onTouchMove, { passive: true });
        el.addEventListener('touchend', terminar);
        el.addEventListener('click', onClickCapture, true);

        return () => {
            el.removeEventListener('mousedown', onMouseDown);
            el.removeEventListener('mousemove', onMouseMove);
            el.removeEventListener('mouseup', terminar);
            el.removeEventListener('mouseleave', terminar);
            el.removeEventListener('touchstart', onTouchStart);
            el.removeEventListener('touchmove', onTouchMove);
            el.removeEventListener('touchend', terminar);
            el.removeEventListener('click', onClickCapture, true);
        };
    }, []);

    return ref;
}
