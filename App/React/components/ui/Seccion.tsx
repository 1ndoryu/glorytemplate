import React from 'react';

/*
 * Seccion - Componente para secciones de página
 *
 * Estandariza padding vertical, altura mínima y centrado.
 * Se combina con Contenedor para layouts consistentes.
 */

interface SeccionProps {
    children: React.ReactNode;
    id?: string;
    alturaMinima?: boolean;
    centrada?: boolean;
    padding?: boolean;
    className?: string;
}

export const Seccion: React.FC<SeccionProps> = ({children, id, alturaMinima = false, centrada = false, padding = true, className = ''}) => {
    const clases = [padding && 'seccionBase', alturaMinima && 'seccionMinima', centrada && 'seccionCentrada', className].filter(Boolean).join(' ');

    return (
        <section id={id} className={clases}>
            {children}
        </section>
    );
};

export default Seccion;
