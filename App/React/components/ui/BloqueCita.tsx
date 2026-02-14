import React from 'react';

interface BloqueCitaProps {
    texto: string;
    autor: string;
    className?: string;
}

/*
 * Bloque de cita testimonial.
 * Replica la estructura exacta de casos_quote() en casos.php.
 * Clases: quote-section, quote-content, quote-icon, quote-text, quote-author
 */
export function BloqueCita({
    texto,
    autor,
    className = '',
}: BloqueCitaProps): React.JSX.Element {
    return (
        <section className={`quote-section ${className}`}>
            <div className="quote-content">
                <span className="quote-icon">
                    <svg viewBox="0 0 26.19 26.19" fill="currentColor">
                        <path d="m13.09,0l1.37,8.33c.29,1.74,1.65,3.11,3.39,3.39l8.33,1.37-8.33,1.37c-1.74.29-3.11,1.65-3.39,3.39l-1.37,8.33-1.37-8.33c-.29-1.74-1.65-3.11-3.39-3.39L0,13.09l8.33-1.37c1.74-.29,3.11-1.65,3.39-3.39L13.09,0Z" />
                    </svg>
                </span>
                <p className="quote-text">{texto}</p>
                <p className="quote-author">{autor}</p>
            </div>
        </section>
    );
}
