/*
 * Hook: useFeedArrastreTags
 * Manejo del arrastre horizontal (drag-to-scroll) de la barra de tags del feed.
 * Extrae responsabilidad de interacción UI de useFeedSamples para cumplir SRP.
 */

import { useState, useCallback, useRef } from 'react';

export function useFeedArrastreTags() {
    const [arrastrandoTags, setArrastrandoTags] = useState(false);
    const inicioXRef = useRef(0);
    const scrollInicialRef = useRef(0);
    const listaTagsRef = useRef<HTMLDivElement | null>(null);

    const iniciarArrastre = useCallback((clientX: number) => {
        if (!listaTagsRef.current) return;
        setArrastrandoTags(true);
        inicioXRef.current = clientX;
        scrollInicialRef.current = listaTagsRef.current.scrollLeft;
    }, []);

    const moverArrastre = useCallback((clientX: number) => {
        if (!arrastrandoTags || !listaTagsRef.current) return;
        listaTagsRef.current.scrollLeft = scrollInicialRef.current - (clientX - inicioXRef.current);
    }, [arrastrandoTags]);

    const finalizarArrastre = useCallback(() => setArrastrandoTags(false), []);

    return { listaTagsRef, arrastrandoTags, iniciarArrastre, moverArrastre, finalizarArrastre };
}
