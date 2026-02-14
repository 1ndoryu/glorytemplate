import React from 'react';
import '@app/styles/marquee.css';

interface MarqueeProps {
    texto: string;
    variante?: 'light' | 'dark';
    className?: string;
}

/*
 * Marquee de texto infinito horizontal.
 * Replica la estructura exacta de Marquee.php de App1.
 * Clases: marquee, marquee--light/dark, marquee-track, marquee-text, marquee-icon
 */
export function Marquee({
    texto,
    variante = 'dark',
    className = '',
}: MarqueeProps): React.JSX.Element {
    const claseVariante = variante === 'light' ? 'marquee--light' : 'marquee--dark';

    /* Icono sparkle igual al original */
    const iconoSparkle = (
        <svg className="marquee-icon" viewBox="0 0 26.19 26.19" fill="currentColor">
            <path d="m13.09,0l1.37,8.33c.29,1.74,1.65,3.11,3.39,3.39l8.33,1.37-8.33,1.37c-1.74.29-3.11,1.65-3.39,3.39l-1.37,8.33-1.37-8.33c-.29-1.74-1.65-3.11-3.39-3.39L0,13.09l8.33-1.37c1.74-.29,3.11-1.65,3.39-3.39L13.09,0Z" />
        </svg>
    );

    /* Repetimos 4 veces x 2 sets como el original (REPEAT_COUNT = 4, 2 sets) */
    const repeticiones = [];
    for (let set = 0; set < 2; set++) {
        for (let i = 0; i < 4; i++) {
            repeticiones.push(
                <React.Fragment key={`${set}-${i}`}>
                    <span className="marquee-text">{texto}</span>
                    {iconoSparkle}
                </React.Fragment>
            );
        }
    }

    return (
        <div className={`marquee ${claseVariante} ${className}`}>
            <div className="marquee-track">
                {repeticiones}
            </div>
        </div>
    );
}
