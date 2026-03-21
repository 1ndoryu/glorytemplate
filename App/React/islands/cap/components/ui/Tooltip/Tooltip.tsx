/* [2003A-16] Tooltip con portal: renderiza en document.body para evitar el
 * clipping de overflow:hidden en tablas y contenedores. Calcula posición
 * con getBoundingClientRect() y position:fixed para coordenadas de viewport.
 * Gotcha: usar position:fixed (no absolute) porque los scrollY ya están en el viewport. */

import React, {useState, useRef, useEffect, useCallback} from 'react';
import {createPortal} from 'react-dom';
import './tooltip.css';

interface TooltipProps {
    content: React.ReactNode;
    children: React.ReactElement;
    position?: 'top' | 'bottom' | 'left' | 'right';
    delay?: number;
    className?: string;
}

interface TooltipCoords {
    top: number;
    left: number;
}

export const Tooltip: React.FC<TooltipProps> = ({content, children, position = 'top', delay = 200, className = ''}) => {
    const [visible, setVisible] = useState(false);
    const [coords, setCoords] = useState<TooltipCoords>({top: 0, left: 0});
    const wrapperRef = useRef<HTMLSpanElement>(null);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const calcularCoordenadas = useCallback((): TooltipCoords => {
        if (!wrapperRef.current) return {top: 0, left: 0};
        const rect = wrapperRef.current.getBoundingClientRect();
        const GAP = 8;

        switch (position) {
            case 'bottom':
                return {top: rect.bottom + GAP, left: rect.left + rect.width / 2};
            case 'left':
                return {top: rect.top + rect.height / 2, left: rect.left - GAP};
            case 'right':
                return {top: rect.top + rect.height / 2, left: rect.right + GAP};
            case 'top':
            default:
                return {top: rect.top - GAP, left: rect.left + rect.width / 2};
        }
    }, [position]);

    const showTooltip = useCallback(() => {
        timeoutRef.current = setTimeout(() => {
            setCoords(calcularCoordenadas());
            setVisible(true);
        }, delay);
    }, [delay, calcularCoordenadas]);

    const hideTooltip = useCallback(() => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setVisible(false);
    }, []);

    useEffect(() => {
        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, []);

    const tooltipEl = visible ? (
        <div
            className={`capTooltip-content capTooltip-content--${position} capAnimFadeIn`}
            style={{top: coords.top, left: coords.left}}
        >
            {content}
            <div className="capTooltip-arrow" />
        </div>
    ) : null;

    return (
        <span
            ref={wrapperRef}
            className={`capTooltip-wrapper${className ? ` ${className}` : ''}`}
            onMouseEnter={showTooltip}
            onMouseLeave={hideTooltip}
        >
            {children}
            {visible && createPortal(tooltipEl, document.body)}
        </span>
    );
};

export default Tooltip;

