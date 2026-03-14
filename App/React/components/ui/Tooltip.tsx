/*
 * Componente: Tooltip — Kamples (C323 / QK54)
 * Wrapper para agregar data-tooltip a children.
 * El tooltip real lo renderiza TooltipGlobal (delegación de eventos en document).
 * Mantiene la API de wrapper para retrocompatibilidad.
 */

import { type ReactElement, cloneElement, isValidElement, Children } from 'react';
import '../../styles/componentes/tooltip.css';

interface TooltipProps {
    texto: string;
    posicion?: 'top' | 'bottom' | 'left' | 'right';
    demora?: number;
    children: React.ReactNode;
}

export const Tooltip = ({
    texto,
    posicion = 'top',
    demora,
    children,
}: TooltipProps): JSX.Element => {
    if (!texto) return <>{children}</>;

    /* Si children es un solo elemento React, inyectar data-tooltip directamente */
    const child = Children.only(children);
    if (isValidElement(child)) {
        const props: Record<string, string> = {
            'data-tooltip': texto,
        };
        if (posicion !== 'top') props['data-tooltip-posicion'] = posicion;
        if (demora !== undefined) props['data-tooltip-demora'] = String(demora);
        return cloneElement(child as ReactElement, props);
    }

    /* Fallback: wrapping div si no es un elemento React clonable */
    return (
        <span
            data-tooltip={texto}
            data-tooltip-posicion={posicion !== 'top' ? posicion : undefined}
            data-tooltip-demora={demora !== undefined ? String(demora) : undefined}
            style={{ display: 'inline-flex' }}
        >
            {children}
        </span>
    );
};
