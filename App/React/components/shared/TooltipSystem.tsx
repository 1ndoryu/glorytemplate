/*
 * TooltipSystem
 * Sistema global de tooltips que intercepta atributos title nativos
 */

import {useState, useEffect, useRef} from 'react';
import {createPortal} from 'react-dom';

interface TooltipState {
    visible: boolean;
    content: string;
    x: number;
    y: number;
}

export function TooltipSystem(): JSX.Element | null {
    const [tooltip, setTooltip] = useState<TooltipState>({
        visible: false,
        content: '',
        x: 0,
        y: 0
    });

    const targetRef = useRef<HTMLElement | null>(null);

    useEffect(() => {
        const handleMouseOver = (e: MouseEvent) => {
            const target = (e.target as HTMLElement).closest('[title], [data-tooltip-content]');
            if (!target) return;

            const element = target as HTMLElement;
            let content = element.getAttribute('data-tooltip-content');
            const title = element.getAttribute('title');

            if (title) {
                content = title;
                element.setAttribute('data-tooltip-content', title);
                element.removeAttribute('title');
            }

            if (!content) return;

            targetRef.current = element;

            // Calcular posicion inicial
            const rect = element.getBoundingClientRect();
            const x = rect.left + rect.width / 2;
            const y = rect.top; // Arriba del elemento por defecto

            setTooltip({
                visible: true,
                content,
                x,
                y
            });
        };

        const handleMouseOut = (e: MouseEvent) => {
            const target = (e.target as HTMLElement).closest('[data-tooltip-content]');
            if (target && target === targetRef.current) {
                setTooltip(prev => ({...prev, visible: false}));
                targetRef.current = null;
            }
        };

        const handleScroll = () => {
            if (tooltip.visible) {
                setTooltip(prev => ({...prev, visible: false}));
            }
        };

        document.addEventListener('mouseover', handleMouseOver);
        document.addEventListener('mouseout', handleMouseOut);
        window.addEventListener('scroll', handleScroll, {capture: true});

        return () => {
            document.removeEventListener('mouseover', handleMouseOver);
            document.removeEventListener('mouseout', handleMouseOut);
            window.removeEventListener('scroll', handleScroll, {capture: true});
        };
    }, [tooltip.visible]);

    /* Recalcular posición exacta antes de renderizar (si fuera necesario, pero CSS lo maneja mejor con transform) */

    if (!tooltip.visible && !tooltip.content) return null;

    // Usamos portal para que siempre este encima de todo
    const tooltipElement = (
        <div
            className={`tooltipContainer ${tooltip.visible ? 'tooltipVisible' : ''}`}
            style={{
                left: tooltip.x,
                top: tooltip.y,
                transform: 'translate(-50%, -100%) translateY(-8px)' // Centrado horizontal, y arriba del punto Y con margen
            }}>
            <div className="tooltipContent">{tooltip.content}</div>
        </div>
    );

    // Intentamos renderizar en body
    if (typeof document !== 'undefined') {
        return createPortal(tooltipElement, document.body);
    }

    return null;
}
