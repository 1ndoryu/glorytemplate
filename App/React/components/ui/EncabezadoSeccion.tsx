import React from 'react';

interface EncabezadoSeccionProps {
    titulo: string;
    subtitulo?: string;
    etiqueta?: string;
    className?: string;
    italic?: boolean;
}

/*
 * Encabezado de seccion reutilizable.
 * Replica las clases del patron section-header de App1.
 * Clases: section-header, section-tag, section-tag-text, section-title,
 * section-title-italic, section-subtitle
 */
export function EncabezadoSeccion({
    titulo,
    subtitulo,
    etiqueta,
    className = '',
    italic = false,
}: EncabezadoSeccionProps): React.JSX.Element {
    return (
        <div className={`section-header ${className}`}>
            {etiqueta && (
                <div className="section-tag">
                    <svg viewBox="0 0 26.19 26.19" fill="currentColor">
                        <path d="m13.09,0l1.37,8.33c.29,1.74,1.65,3.11,3.39,3.39l8.33,1.37-8.33,1.37c-1.74.29-3.11,1.65-3.39,3.39l-1.37,8.33-1.37-8.33c-.29-1.74-1.65-3.11-3.39-3.39L0,13.09l8.33-1.37c1.74-.29,3.11-1.65,3.39-3.39L13.09,0Z" />
                    </svg>
                    <p className="section-tag-text">{etiqueta}</p>
                </div>
            )}
            <h2 className={italic ? 'section-title section-title-italic' : 'section-title'}>
                {titulo}
            </h2>
            {subtitulo && <p className="section-subtitle">{subtitulo}</p>}
        </div>
    );
}
