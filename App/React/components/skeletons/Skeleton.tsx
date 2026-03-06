/*
 * Componente: Skeleton
 * Bloque de placeholder con animacion pulse.
 * Props: variante (rectangulo, circulo, texto), ancho, alto, className.
 */

import '../../styles/componentes/skeleton.css';

interface SkeletonProps {
    ancho?: string | number;
    alto?: string | number;
    circulo?: boolean;
    className?: string;
}

export function Skeleton({
    ancho,
    alto,
    circulo = false,
    className = '',
}: SkeletonProps): JSX.Element {
    const estilo: React.CSSProperties = {};
    if (ancho) estilo.width = typeof ancho === 'number' ? `${ancho}px` : ancho;
    if (alto) estilo.height = typeof alto === 'number' ? `${alto}px` : alto;

    return (
        <div
            className={`skeleton ${circulo ? 'skeletonCirculo' : ''} ${className}`.trim()}
            style={estilo}
            aria-hidden="true"
        />
    );
}
