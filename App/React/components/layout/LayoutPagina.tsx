/**
 * Componente: LayoutPagina
 * Wrapper reutilizable que envuelve el contenido con Header y Footer.
 * Elimina la duplicación de importar Header/Footer en cada Island (DRY).
 */
import React from 'react';
import {Header} from './Header';
import {Footer} from './Footer';

interface LayoutPaginaProps {
    children: React.ReactNode;
    className?: string;
    id?: string;
}

export const LayoutPagina: React.FC<LayoutPaginaProps> = ({children, className = '', id}) => {
    return (
        <>
            <a href="#contenido-principal" className="enlaceSaltarContenido">
                Ir al contenido principal
            </a>
            <Header />
            <main className={className} id={id || 'contenido-principal'} role="main">
                {children}
            </main>
            <Footer />
        </>
    );
};
