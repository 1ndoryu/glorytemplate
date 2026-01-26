import React from 'react';

/**
 * Props para el componente CabeceraVista
 */
interface CabeceraVistaProps {
    /** Título principal de la vista */
    titulo: string | React.ReactNode;
    /** Subtítulo descriptivo */
    subtitulo?: string | React.ReactNode;
    /** Elementos de acción (botones) a la derecha */
    accion?: React.ReactNode;
    /** Clases adicionales */
    className?: string;
}

/**
 * CabeceraVista: Componente estandarizado para el encabezado de las vistas del panel.
 * Muestra un título, un subtítulo opcional y acciones a la derecha.
 * Reemplaza el patrón repetido de .vistaHeader
 */
export const CabeceraVista: React.FC<CabeceraVistaProps> = ({titulo, subtitulo, accion, className = ''}) => {
    return (
        <header className={`cabeceraVista ${className}`}>
            <div className="cabeceraVistaContenido">
                <h2 className="cabeceraVistaTitulo">{titulo}</h2>
                {subtitulo && <div className="cabeceraVistaSubtitulo">{subtitulo}</div>}
            </div>
            {accion && <div className="cabeceraVistaAccion">{accion}</div>}
        </header>
    );
};
