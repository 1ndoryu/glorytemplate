/*
 * Componente: Tooltip — Kamples (C323)
 * Tooltip global reutilizable. Muestra un texto al hover sobre el children.
 * Posiciones: top (default), bottom, left, right.
 * No usa lógica compleja — CSS puro con pseudo-elementos.
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import '../../styles/componentes/tooltip.css';

interface TooltipProps {
    texto: string;
    posicion?: 'top' | 'bottom' | 'left' | 'right';
    demora?: number;
    children: React.ReactNode;
}

interface PosicionTooltip {
    top: number;
    left: number;
}

export const Tooltip = ({
    texto,
    posicion = 'top',
    demora = 300,
    children,
}: TooltipProps): JSX.Element => {
    const [visible, setVisible] = useState(false);
    const [coords, setCoords] = useState<PosicionTooltip>({ top: 0, left: 0 });
    const refTrigger = useRef<HTMLDivElement>(null);
    const refTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const calcularPosicion = useCallback(() => {
        if (!refTrigger.current) return;
        const rect = refTrigger.current.getBoundingClientRect();
        const gap = 8;

        switch (posicion) {
            case 'bottom':
                setCoords({ top: rect.bottom + gap, left: rect.left + rect.width / 2 });
                break;
            case 'left':
                setCoords({ top: rect.top + rect.height / 2, left: rect.left - gap });
                break;
            case 'right':
                setCoords({ top: rect.top + rect.height / 2, left: rect.right + gap });
                break;
            default:
                setCoords({ top: rect.top - gap, left: rect.left + rect.width / 2 });
                break;
        }
    }, [posicion]);

    const mostrar = useCallback(() => {
        refTimer.current = setTimeout(() => {
            calcularPosicion();
            setVisible(true);
        }, demora);
    }, [demora, calcularPosicion]);

    const ocultar = useCallback(() => {
        if (refTimer.current) {
            clearTimeout(refTimer.current);
            refTimer.current = null;
        }
        setVisible(false);
    }, []);

    useEffect(() => {
        return () => {
            if (refTimer.current) clearTimeout(refTimer.current);
        };
    }, []);

    if (!texto) return <>{children}</>;

    const claseTransform = {
        top: 'tooltipTop',
        bottom: 'tooltipBottom',
        left: 'tooltipLeft',
        right: 'tooltipRight',
    }[posicion];

    return (
        <div
            ref={refTrigger}
            className="tooltipWrapper"
            onMouseEnter={mostrar}
            onMouseLeave={ocultar}
            onFocus={mostrar}
            onBlur={ocultar}
        >
            {children}
            {visible && createPortal(
                <div
                    className={`tooltipContenido ${claseTransform}`}
                    style={{ top: coords.top, left: coords.left }}
                    role="tooltip"
                >
                    {texto}
                </div>,
                document.body
            )}
        </div>
    );
};
