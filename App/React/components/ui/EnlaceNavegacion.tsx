/*
 * Componente: EnlaceNavegacion
 * Enlace con navegación SPA que soporta apertura en nueva pestaña.
 * Left-click → navegación SPA (sin recarga).
 * Middle-click, Ctrl+click, Cmd+click → apertura nativa en nueva pestaña.
 *
 * Centraliza el patrón repetido en TarjetaColeccion, TarjetaPublicacion,
 * EnlaceCreador, FilaColecciones y cualquier enlace interno.
 */

import { type AnchorHTMLAttributes, type MouseEvent, useCallback } from 'react';
import { useNavigationStore } from '@/core/router';
import '../../styles/componentes/enlaceNavegacion.css';

interface EnlaceNavegacionProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
    href: string;
    /** Si true, no usa SPA navigation — abre como enlace normal */
    externo?: boolean;
}

export const EnlaceNavegacion = ({
    href,
    externo = false,
    onClick,
    className = '',
    children,
    ...props
}: EnlaceNavegacionProps): JSX.Element => {
    const navegar = useNavigationStore(s => s.navegar);

    const manejarClick = useCallback((e: MouseEvent<HTMLAnchorElement>) => {
        onClick?.(e);
        if (e.defaultPrevented) return;

        /* Permitir que el navegador maneje: middle-click, Ctrl+click, Meta+click, Shift+click */
        if (externo || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) return;

        e.preventDefault();
        navegar(href);
    }, [href, externo, onClick, navegar]);

    return (
        <a
            href={href}
            className={`enlaceNavegacion ${className}`.trim()}
            onClick={manejarClick}
            {...props}
        >
            {children}
        </a>
    );
};

export default EnlaceNavegacion;
