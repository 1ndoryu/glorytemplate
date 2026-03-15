/*
 * Hook: useScrollHorizontal
 * Scroll horizontal con flechas y arrastre mouse para secciones tipo carrusel.
 * Usado en SeccionHorizontal y cualquier contenedor con scroll-x.
 */

import { useRef, useState, useCallback, useEffect } from 'react';

export function useScrollHorizontal(cantidadScroll = 300) {
    const contenedorRef = useRef<HTMLDivElement>(null);
    const [puedeIzquierda, setPuedeIzquierda] = useState(false);
    const [puedeDerecha, setPuedeDerecha] = useState(false);
    const arrastreRef = useRef({ activo: false, inicioX: 0, scrollInicio: 0 });

    const actualizarFlechas = useCallback(() => {
        const el = contenedorRef.current;
        if (!el) return;
        setPuedeIzquierda(el.scrollLeft > 1);
        setPuedeDerecha(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
    }, []);

    useEffect(() => {
        const el = contenedorRef.current;
        if (!el) return;
        actualizarFlechas();
        el.addEventListener('scroll', actualizarFlechas, { passive: true });
        const resizeObs = new ResizeObserver(actualizarFlechas);
        resizeObs.observe(el);
        return () => {
            el.removeEventListener('scroll', actualizarFlechas);
            resizeObs.disconnect();
        };
    }, [actualizarFlechas]);

    const scrollearIzquierda = useCallback(() => {
        contenedorRef.current?.scrollBy({ left: -cantidadScroll, behavior: 'smooth' });
    }, [cantidadScroll]);

    const scrollearDerecha = useCallback(() => {
        contenedorRef.current?.scrollBy({ left: cantidadScroll, behavior: 'smooth' });
    }, [cantidadScroll]);

    const iniciarArrastre = useCallback((clientX: number) => {
        const el = contenedorRef.current;
        if (!el) return;
        arrastreRef.current = { activo: true, inicioX: clientX, scrollInicio: el.scrollLeft };
        el.style.cursor = 'grabbing';
        el.style.userSelect = 'none';
    }, []);

    const moverArrastre = useCallback((clientX: number) => {
        if (!arrastreRef.current.activo) return;
        const el = contenedorRef.current;
        if (!el) return;
        const delta = arrastreRef.current.inicioX - clientX;
        el.scrollLeft = arrastreRef.current.scrollInicio + delta;
    }, []);

    const finalizarArrastre = useCallback(() => {
        arrastreRef.current.activo = false;
        const el = contenedorRef.current;
        if (el) {
            el.style.cursor = '';
            el.style.userSelect = '';
        }
    }, []);

    return {
        contenedorRef,
        puedeIzquierda,
        puedeDerecha,
        scrollearIzquierda,
        scrollearDerecha,
        iniciarArrastre,
        moverArrastre,
        finalizarArrastre,
    };
}
