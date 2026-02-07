/**
 * Componente: SeccionHeader
 * Encabezado reutilizable para las secciones (Showcase, Clientes, Servicios, Testimonios).
 * Mantiene consistencia visual y aplica el borde inferior solicitado.
 */
import React from 'react';
import './SeccionHeader.css';

interface SeccionHeaderProps {
    titulo: string;
    className?: string;
}

export const SeccionHeader: React.FC<SeccionHeaderProps> = ({titulo, className = ''}) => {
    return (
        <header className={`seccionHeader ${className}`}>
            <span className="seccionTitulo">{titulo}</span>
        </header>
    );
};
