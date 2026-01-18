import {useEffect, useRef, useState, RefObject} from 'react';

/*
 * useIntersectionReveal: Hook para animar elementos al entrar en viewport.
 * Retorna ref para el contenedor y array de estados de visibilidad.
 * Simplifica la lógica duplicada de animación por intersección.
 */

interface UseIntersectionRevealOptions {
    cantidadElementos: number;
    delayEntreCada?: number;
    threshold?: number;
    disparaUnaVez?: boolean;
}

interface UseIntersectionRevealReturn<T extends HTMLElement> {
    ref: RefObject<T>;
    visibles: boolean[];
    resetear: () => void;
}

export function useIntersectionReveal<T extends HTMLElement = HTMLDivElement>(opciones: UseIntersectionRevealOptions): UseIntersectionRevealReturn<T> {
    const {cantidadElementos, delayEntreCada = 150, threshold = 0.2, disparaUnaVez = true} = opciones;

    const ref = useRef<T>(null);
    const [visibles, setVisibles] = useState<boolean[]>(Array(cantidadElementos).fill(false));

    const resetear = () => {
        setVisibles(Array(cantidadElementos).fill(false));
    };

    useEffect(() => {
        const observer = new IntersectionObserver(
            entries => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        /* Anima cada elemento con delay escalonado */
                        Array.from({length: cantidadElementos}).forEach((_, index) => {
                            setTimeout(() => {
                                setVisibles(prev => {
                                    const nuevo = [...prev];
                                    nuevo[index] = true;
                                    return nuevo;
                                });
                            }, index * delayEntreCada);
                        });

                        if (disparaUnaVez) {
                            observer.disconnect();
                        }
                    }
                });
            },
            {threshold}
        );

        if (ref.current) {
            observer.observe(ref.current);
        }

        return () => observer.disconnect();
    }, [cantidadElementos, delayEntreCada, threshold, disparaUnaVez]);

    return {ref, visibles, resetear};
}

export default useIntersectionReveal;
