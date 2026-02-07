import {useState, useEffect, useRef, useCallback} from 'react';

interface UseCarruselInfinitoProps {
    totalItems: number;
    tiempoEspera?: number;
    tiempoTransicion?: number;
}

export const useCarruselInfinito = ({totalItems, tiempoEspera = 6000, tiempoTransicion = 800}: UseCarruselInfinitoProps) => {
    const [indiceActual, setIndiceActual] = useState(0);
    const [conTransicion, setConTransicion] = useState(true);
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState(0);

    const startX = useRef(0);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const isPausedRef = useRef(false);

    // Iniciar autoplay
    const startAutoplay = useCallback(() => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = setInterval(() => {
            if (!isPausedRef.current && !isDragging) {
                nextSlide();
            }
        }, tiempoEspera);
    }, [tiempoEspera, isDragging]);

    // Pausar autoplay
    const stopAutoplay = useCallback(() => {
        if (intervalRef.current) clearInterval(intervalRef.current);
    }, []);

    const nextSlide = () => {
        setConTransicion(true);
        setIndiceActual(prev => prev + 1);
    };

    const prevSlide = () => {
        setConTransicion(true);
        setIndiceActual(prev => prev - 1);
    };

    // Efecto de Loop Infinito
    useEffect(() => {
        if (indiceActual === totalItems) {
            const timeout = setTimeout(() => {
                setConTransicion(false);
                setIndiceActual(0);
            }, tiempoTransicion);
            return () => clearTimeout(timeout);
        }
        // Manejo básico para retroceso infinito (si fuera necesario en drag hacia derecha desde 0)
        // Por simplicidad, el drag hacia derecha desde 0 se bloquea visualmente o se deja rebotar
    }, [indiceActual, totalItems, tiempoTransicion]);

    // Autoplay lifecycle
    useEffect(() => {
        startAutoplay();
        return () => stopAutoplay();
    }, [startAutoplay, stopAutoplay]);

    // Handlers de Drag
    const onPointerDown = (e: React.PointerEvent) => {
        setIsDragging(true);
        startX.current = e.clientX;
        setConTransicion(false); // Quitar transición para respuesta inmediata
        isPausedRef.current = true;
    };

    const onPointerMove = (e: React.PointerEvent) => {
        if (!isDragging) return;
        const diff = e.clientX - startX.current;
        setDragOffset(diff);
    };

    const onPointerUp = () => {
        if (!isDragging) return;
        setIsDragging(false);
        isPausedRef.current = false;

        // Umbral para cambiar de slide
        const umbral = 100; // px

        if (dragOffset < -umbral) {
            nextSlide();
        } else if (dragOffset > umbral && indiceActual > 0) {
            prevSlide();
        } else {
            // Revertir si no superó umbral
            setConTransicion(true);
        }

        setDragOffset(0);
    };

    // Si el cursor sale del componente mientras arrastra
    const onPointerLeave = () => {
        if (isDragging) onPointerUp();
    };

    return {
        indiceActual,
        conTransicion,
        dragOffset,
        handlers: {
            onPointerDown,
            onPointerMove,
            onPointerUp,
            onPointerLeave
        }
    };
};
