import React from 'react';

interface BloqueCitaProps {
    texto: string;
    autor: string;
    className?: string;
}

/*
 * Bloque de cita testimonial, usado en la pagina de Casos.
 * Fondo olive con icono de comillas y texto blanco.
 */
export function BloqueCita({
    texto,
    autor,
    className = '',
}: BloqueCitaProps): React.JSX.Element {
    return (
        <section className={`seccionCita ${className}`}>
            <div className="contenidoCita">
                <span className="iconoCita">
                    <svg viewBox="0 0 26.19 26.19" fill="currentColor">
                        <path d="m13.09,0l1.37,8.33c.29,1.74,1.65,3.11,3.39,3.39l8.33,1.37-8.33,1.37c-1.74.29-3.11,1.65-3.39,3.39l-1.37,8.33-1.37-8.33c-.29-1.74-1.65-3.11-3.39-3.39L0,13.09l8.33-1.37c1.74-.29,3.11-1.65,3.39-3.39L13.09,0Z" />
                    </svg>
                </span>
                <p className="textoCita">{texto}</p>
                <p className="autorCita">{autor}</p>
            </div>
        </section>
    );
}
