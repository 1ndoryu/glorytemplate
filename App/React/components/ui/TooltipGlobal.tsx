/*
 * Componente: TooltipGlobal — Kamples (QK54)
 * Un solo tooltip global que escucha delegación de eventos en document.
 * Cualquier elemento con data-tooltip="texto" mostrará un tooltip al hover.
 * Opcionalmente: data-tooltip-posicion="top|bottom|left|right" (default: top).
 * data-tooltip-demora="500" para delay personalizado (default: 300ms).
 *
 * Se renderiza UNA VEZ en LayoutPrincipal — sin wrappers, sin stores.
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import '../../styles/componentes/tooltip.css';

type PosicionTooltip = 'top' | 'bottom' | 'left' | 'right';

interface EstadoTooltip {
    texto: string;
    top: number;
    left: number;
    posicion: PosicionTooltip;
}

const GAP = 8;
const DEMORA_DEFAULT = 300;

function calcularCoordenadas(
    rect: DOMRect,
    posicion: PosicionTooltip,
): { top: number; left: number } {
    switch (posicion) {
        case 'bottom':
            return { top: rect.bottom + GAP, left: rect.left + rect.width / 2 };
        case 'left':
            return { top: rect.top + rect.height / 2, left: rect.left - GAP };
        case 'right':
            return { top: rect.top + rect.height / 2, left: rect.right + GAP };
        default:
            return { top: rect.top - GAP, left: rect.left + rect.width / 2 };
    }
}

function obtenerElementoTooltip(target: EventTarget | null): HTMLElement | null {
    if (!target || !(target instanceof HTMLElement)) return null;
    return target.closest('[data-tooltip]') as HTMLElement | null;
}

export const TooltipGlobal = (): JSX.Element | null => {
    const [estado, setEstado] = useState<EstadoTooltip | null>(null);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const elementoActualRef = useRef<HTMLElement | null>(null);

    const limpiarTimer = useCallback(() => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
    }, []);

    const ocultar = useCallback(() => {
        limpiarTimer();
        setEstado(null);
        elementoActualRef.current = null;
    }, [limpiarTimer]);

    useEffect(() => {
        const manejarEntrada = (e: MouseEvent) => {
            const el = obtenerElementoTooltip(e.target);
            if (!el) return;

            const texto = el.getAttribute('data-tooltip');
            if (!texto) return;

            /* Evitar reactivar el mismo elemento */
            if (elementoActualRef.current === el) return;

            limpiarTimer();
            elementoActualRef.current = el;

            const posicion = (el.getAttribute('data-tooltip-posicion') || 'top') as PosicionTooltip;
            const demoraStr = el.getAttribute('data-tooltip-demora');
            const demora = demoraStr ? parseInt(demoraStr, 10) || DEMORA_DEFAULT : DEMORA_DEFAULT;

            timerRef.current = setTimeout(() => {
                const rect = el.getBoundingClientRect();
                const coords = calcularCoordenadas(rect, posicion);
                setEstado({ texto, ...coords, posicion });
            }, demora);
        };

        const manejarSalida = (e: MouseEvent) => {
            const el = obtenerElementoTooltip(e.target);
            const relEl = obtenerElementoTooltip(e.relatedTarget);
            /* Solo ocultar si realmente salimos del elemento tooltip */
            if (el && el !== relEl) {
                ocultar();
            }
        };

        /* Scroll oculta tooltip inmediatamente */
        const manejarScroll = () => ocultar();

        document.addEventListener('mouseover', manejarEntrada, true);
        document.addEventListener('mouseout', manejarSalida, true);
        window.addEventListener('scroll', manejarScroll, true);

        return () => {
            document.removeEventListener('mouseover', manejarEntrada, true);
            document.removeEventListener('mouseout', manejarSalida, true);
            window.removeEventListener('scroll', manejarScroll, true);
            limpiarTimer();
        };
    }, [limpiarTimer, ocultar]);

    if (!estado) return null;

    const claseTransform = {
        top: 'tooltipTop',
        bottom: 'tooltipBottom',
        left: 'tooltipLeft',
        right: 'tooltipRight',
    }[estado.posicion];

    return createPortal(
        <div
            className={`tooltipContenido ${claseTransform}`}
            style={{ top: estado.top, left: estado.left }}
            role="tooltip"
        >
            {estado.texto}
        </div>,
        document.body,
    );
};
