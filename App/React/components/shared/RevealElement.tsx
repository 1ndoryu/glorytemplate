/**
 * RevealElement - Componente de animacion de scroll
 *
 * Usa Intersection Observer para animar elementos cuando entran en viewport.
 * Componente compartido usado por todos los bloques de la landing.
 */

import {useEffect, useRef, useState} from 'react';

interface RevealElementProps {
    children: React.ReactNode;
    delay?: number;
    className?: string;
}

export function RevealElement({children, delay = 0, className = ''}: RevealElementProps): JSX.Element {
    const ref = useRef<HTMLDivElement>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.disconnect();
                }
            },
            {threshold: 0.1}
        );

        if (ref.current) {
            observer.observe(ref.current);
        }

        return () => observer.disconnect();
    }, []);

    return (
        <div
            ref={ref}
            className={className}
            style={{
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
                transition: `all 0.8s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`
            }}>
            {children}
        </div>
    );
}

export default RevealElement;
