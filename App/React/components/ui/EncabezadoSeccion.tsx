import React from 'react';

interface EncabezadoSeccionProps {
    titulo: string;
    subtitulo?: string;
    /* Etiqueta con icono sparkle, ej: "Marketing Digital" */
    etiqueta?: string;
    /* Clase adicional para el contenedor */
    className?: string;
    /* Si true, el titulo usa font italic (heading) */
    italic?: boolean;
}

/*
 * Encabezado de seccion reutilizable: etiqueta + titulo + subtitulo.
 * Usado en Landing, Servicios, About, etc.
 */
export function EncabezadoSeccion({
    titulo,
    subtitulo,
    etiqueta,
    className = '',
    italic = false,
}: EncabezadoSeccionProps): React.JSX.Element {
    return (
        <div className={`encabezadoSeccion ${className}`}>
            {etiqueta && (
                <div className="etiquetaSeccion">
                    <svg viewBox="0 0 26.19 26.19" fill="currentColor">
                        <path d="m13.09,0l1.37,8.33c.29,1.74,1.65,3.11,3.39,3.39l8.33,1.37-8.33,1.37c-1.74.29-3.11,1.65-3.39,3.39l-1.37,8.33-1.37-8.33c-.29-1.74-1.65-3.11-3.39-3.39L0,13.09l8.33-1.37c1.74-.29,3.11-1.65,3.39-3.39L13.09,0Z" />
                    </svg>
                    <p className="textoEtiqueta">{etiqueta}</p>
                </div>
            )}
            <h2 className={italic ? 'tituloSeccion tituloSeccionItalic' : 'tituloSeccion'}>
                {titulo}
            </h2>
            {subtitulo && <p className="subtituloSeccion">{subtitulo}</p>}
        </div>
    );
}
