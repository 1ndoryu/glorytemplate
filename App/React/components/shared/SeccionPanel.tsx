/*
 * SeccionPanel
 * Componente contenedor para secciones en formularios y paneles
 */

import {ReactNode} from 'react';

interface SeccionPanelProps {
    titulo: string;
    icono?: ReactNode;
    children: ReactNode;
    className?: string;
}

export function SeccionPanel({titulo, icono, children, className = ''}: SeccionPanelProps): JSX.Element {
    return (
        <div className={`seccionPanel ${className}`}>
            <div className="seccionPanelEncabezado">
                {icono && <span className="seccionPanelIcono">{icono}</span>}
                <span className="seccionPanelTitulo">{titulo}</span>
            </div>
            <div className="seccionPanelContenido">{children}</div>
        </div>
    );
}
