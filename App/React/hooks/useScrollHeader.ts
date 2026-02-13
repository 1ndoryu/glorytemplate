import { useState, useEffect } from 'react';

/*
 * Hook para detectar scroll y aplicar clase al header.
 * Retorna true cuando el scroll supera el umbral.
 */
export function useScrollHeader(umbral = 50): boolean {
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = (): void => {
            setScrolled(window.scrollY > umbral);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        handleScroll();

        return () => window.removeEventListener('scroll', handleScroll);
    }, [umbral]);

    return scrolled;
}
