/*
 * MinimapaPianoRoll — Vista miniatura de todas las notas del piano roll.
 * Componente de vista. Lógica en useMinimapaPianoRoll.
 */

import { memo } from 'react';
import { useMinimapaPianoRoll } from '../../hooks/useMinimapaPianoRoll';

interface MinimapaPianoRollProps {
    totalCompases: number;
    numerador?: number;
    altura?: number;
}

const ALTO_DEFAULT = 28;

export const MinimapaPianoRoll = memo(({
    totalCompases,
    numerador = 4,
    altura = ALTO_DEFAULT,
}: MinimapaPianoRollProps): JSX.Element => {
    const { contenedorRef, canvasRef, handleMouseDown } = useMinimapaPianoRoll({
        totalCompases, numerador, altura,
    });

    return (
        <div
            ref={contenedorRef}
            className="pianoRollMinimapa"
            onMouseDown={handleMouseDown}
        >
            <canvas
                ref={canvasRef}
                className="pianoRollMinimapaCanvas"
            />
        </div>
    );
});

MinimapaPianoRoll.displayName = 'MinimapaPianoRoll';
