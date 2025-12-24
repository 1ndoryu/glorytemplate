/*
 * TooltipSystem
 * Sistema global de tooltips que intercepta atributos title nativos
 * Incluye detección de bordes para evitar desbordamiento
 */

import {useState, useEffect, useRef, useCallback} from 'react';
import {createPortal} from 'react-dom';

interface TooltipState {
    visible: boolean;
    content: string;
    x: number;
    y: number;
    posicion: 'arriba' | 'abajo' | 'izquierda' | 'derecha';
}

/* Constantes para cálculo de posición */
const MARGEN_BORDE = 10;
const TOOLTIP_ALTURA_ESTIMADA = 40;
const TOOLTIP_ANCHO_ESTIMADO = 250;
const OFFSET_ELEMENTO = 8;

export function TooltipSystem(): JSX.Element | null {
    const [tooltip, setTooltip] = useState<TooltipState>({
        visible: false,
        content: '',
        x: 0,
        y: 0,
        posicion: 'arriba'
    });

    const targetRef = useRef<HTMLElement | null>(null);
    const tooltipRef = useRef<HTMLDivElement | null>(null);

    /**
     * Calcula la mejor posición para el tooltip evitando desbordamiento
     */
    const calcularPosicion = useCallback((rect: DOMRect, contenidoAncho: number = TOOLTIP_ANCHO_ESTIMADO) => {
        const viewportAncho = window.innerWidth;
        const viewportAlto = window.innerHeight;
        
        let x = rect.left + rect.width / 2;
        let y = rect.top;
        let posicion: TooltipState['posicion'] = 'arriba';

        /* Verificar espacio arriba */
        const espacioArriba = rect.top;
        const espacioAbajo = viewportAlto - rect.bottom;
        const espacioIzquierda = rect.left;
        const espacioDerecha = viewportAncho - rect.right;

        /* Decidir posición vertical */
        if (espacioArriba < TOOLTIP_ALTURA_ESTIMADA + MARGEN_BORDE) {
            /* No hay espacio arriba, mostrar abajo */
            y = rect.bottom;
            posicion = 'abajo';
        }

        /* Ajustar posición horizontal para no salirse de la pantalla */
        const mitadTooltip = contenidoAncho / 2;
        
        if (x - mitadTooltip < MARGEN_BORDE) {
            /* Se sale por la izquierda */
            x = Math.max(MARGEN_BORDE + mitadTooltip, rect.left + rect.width / 2);
        } else if (x + mitadTooltip > viewportAncho - MARGEN_BORDE) {
            /* Se sale por la derecha */
            x = Math.min(viewportAncho - MARGEN_BORDE - mitadTooltip, rect.left + rect.width / 2);
        }

        /* Caso especial: si el espacio horizontal es muy limitado, mostrar lateral */
        if (espacioArriba < TOOLTIP_ALTURA_ESTIMADA && espacioAbajo < TOOLTIP_ALTURA_ESTIMADA) {
            if (espacioDerecha > espacioIzquierda && espacioDerecha > contenidoAncho) {
                x = rect.right;
                y = rect.top + rect.height / 2;
                posicion = 'derecha';
            } else if (espacioIzquierda > contenidoAncho) {
                x = rect.left;
                y = rect.top + rect.height / 2;
                posicion = 'izquierda';
            }
        }

        return {x, y, posicion};
    }, []);

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

            /* Calcular posición con detección de bordes */
            const rect = element.getBoundingClientRect();
            const {x, y, posicion} = calcularPosicion(rect);

            setTooltip({
                visible: true,
                content,
                x,
                y,
                posicion
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
    }, [tooltip.visible, calcularPosicion]);

    if (!tooltip.visible && !tooltip.content) return null;

    /* Calcular transform según posición */
    const obtenerTransform = (): string => {
        switch (tooltip.posicion) {
            case 'arriba':
                return `translate(-50%, -100%) translateY(-${OFFSET_ELEMENTO}px)`;
            case 'abajo':
                return `translate(-50%, 0) translateY(${OFFSET_ELEMENTO}px)`;
            case 'izquierda':
                return `translate(-100%, -50%) translateX(-${OFFSET_ELEMENTO}px)`;
            case 'derecha':
                return `translate(0, -50%) translateX(${OFFSET_ELEMENTO}px)`;
            default:
                return `translate(-50%, -100%) translateY(-${OFFSET_ELEMENTO}px)`;
        }
    };

    const tooltipElement = (
        <div
            ref={tooltipRef}
            className={`tooltipContainer ${tooltip.visible ? 'tooltipVisible' : ''} tooltipPosicion${tooltip.posicion.charAt(0).toUpperCase() + tooltip.posicion.slice(1)}`}
            style={{
                left: tooltip.x,
                top: tooltip.y,
                transform: obtenerTransform()
            }}>
            <div className="tooltipContent">{tooltip.content}</div>
        </div>
    );

    if (typeof document !== 'undefined') {
        return createPortal(tooltipElement, document.body);
    }

    return null;
}
