/*
 * Hook: usePosicionTooltipPerfil — Kamples
 * Calcula la posicion optima del tooltip relativo al elemento ancla.
 * Prioriza debajo-izquierda; si no cabe, intenta arriba.
 * Ajusta horizontalmente si se sale del viewport.
 */

import { useState, useEffect, type RefObject } from 'react';
import type { AnclaRect } from '@app/stores/tooltipPerfilStore';

const MARGEN = 8;
const ANCHO_TOOLTIP = 340;

interface Posicion {
    top: number;
    left: number;
}

export function usePosicionTooltipPerfil(
    ancla: AnclaRect | null,
    tooltipRef: RefObject<HTMLDivElement | null>,
): Posicion {
    const [posicion, setPosicion] = useState<Posicion>({ top: -9999, left: -9999 });

    useEffect(() => {
        if (!ancla) {
            setPosicion({ top: -9999, left: -9999 });
            return;
        }

        /* Esperamos un frame para que el tooltip se renderice y podamos medir su alto */
        const raf = requestAnimationFrame(() => {
            const altoTooltip = tooltipRef.current?.offsetHeight ?? 300;
            const vh = window.innerHeight;
            const vw = window.innerWidth;

            /* Posicion debajo del ancla */
            let top = ancla.top + ancla.height + MARGEN;
            let left = ancla.left;

            /* Si no cabe abajo, colocar arriba */
            if (top + altoTooltip > vh - MARGEN) {
                top = ancla.top - altoTooltip - MARGEN;
            }

            /* Si se sale por la derecha, ajustar */
            if (left + ANCHO_TOOLTIP > vw - MARGEN) {
                left = vw - ANCHO_TOOLTIP - MARGEN;
            }

            /* No salirse por la izquierda */
            if (left < MARGEN) {
                left = MARGEN;
            }

            /* No salirse por arriba */
            if (top < MARGEN) {
                top = MARGEN;
            }

            setPosicion({ top, left });
        });

        return () => cancelAnimationFrame(raf);
    }, [ancla, tooltipRef]);

    return posicion;
}
