/*
 * ReglaTemporal — Regla superior del piano roll con marcas de compás.
 * Componente de vista. Lógica en useReglaTemporal.
 */

import { memo } from 'react';
import { useReglaTemporal } from '../../hooks/useReglaTemporal';

interface ReglaTemporalProps {
    scrollX: number;
    zoomX: number;
    anchoVisible: number;
    totalCompases: number;
    numerador?: number;
    onClick?: (tickPos: number) => void;
}

export const ReglaTemporal = memo(({
    scrollX,
    zoomX,
    anchoVisible,
    totalCompases,
    numerador = 4,
    onClick,
}: ReglaTemporalProps): JSX.Element => {
    const { canvasRef, handleClick } = useReglaTemporal({
        scrollX, zoomX, anchoVisible, totalCompases, numerador, onClick,
    });

    return (
        <div className="pianoRollRegla">
            <canvas
                ref={canvasRef}
                className="pianoRollReglaCanvas"
                onClick={handleClick}
            />
        </div>
    );
});

ReglaTemporal.displayName = 'ReglaTemporal';
