import React from 'react';

/**
 * Props para el componente SeccionPanel
 */
interface SeccionPanelProps {
    /** Título principal de la sección */
    titulo?: string;
    /** Subtítulo descriptivo */
    subtitulo?: string;
    /** Icono opcional junto al título */
    icono?: React.ReactNode;
    /** Botón o acción a la derecha del título (ej: "Ver todo") */
    accion?: React.ReactNode;
    /** Contenido de la sección */
    children: React.ReactNode;
    /** Clases adicionales para el contenedor */
    className?: string;
    /** ID para anclajes o testing */
    id?: string;
}

/**
 * Componente estructural para secciones del panel de administración/cliente.
 * Unifica estilos de espaciado, titulación y estructura para el Dashboard.
 */
export const SeccionPanel: React.FC<SeccionPanelProps> = ({titulo, subtitulo, icono, accion, children, className = '', id}) => {
    // Solo renderizamos el header si hay elementos para mostrar en él
    const mostrarHeader = titulo || subtitulo || icono || accion;

    return (
        <section className={`seccionPanel ${className}`} id={id}>
            {mostrarHeader && (
                <header className="seccionPanelCabecera">
                    <div className="seccionPanelTituloContenedor">
                        {icono && <span className="seccionPanelIcono">{icono}</span>}
                        <div className="seccionPanelTextos">
                            {titulo && <h3 className="seccionPanelTitulo">{titulo}</h3>}
                            {subtitulo && <p className="seccionPanelSubtitulo">{subtitulo}</p>}
                        </div>
                    </div>
                    {accion && <div className="seccionPanelAccion">{accion}</div>}
                </header>
            )}
            <div className="seccionPanelContenido">{children}</div>
        </section>
    );
};
