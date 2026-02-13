import React from 'react';
import '@app/styles/marquee.css';

interface MarqueeProps {
    textos: string[];
    /* Variante de color: 'light' (fondo claro, texto oscuro) o 'dark' (fondo oscuro, texto claro) */
    variante?: 'light' | 'dark';
    className?: string;
}

/*
 * Marquee de texto infinito horizontal.
 * Duplica los textos para lograr el efecto continuo.
 */
export function Marquee({
    textos,
    variante = 'dark',
    className = '',
}: MarqueeProps): React.JSX.Element {
    const claseVariante = variante === 'light' ? 'marquee--light' : 'marquee--dark';

    /* Duplicamos el contenido para el loop infinito */
    const contenidoRepetido = [...textos, ...textos];

    return (
        <div className={`marquee ${claseVariante} ${className}`}>
            <div className="marqueeTrack">
                {contenidoRepetido.map((texto, i) => (
                    <span key={i} className="marqueeItem">{texto}</span>
                ))}
            </div>
        </div>
    );
}
