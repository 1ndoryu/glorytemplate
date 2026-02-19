/*
 * NotaRect — Representa visualmente una nota en el piano roll.
 * C310: Div posicionado absoluto con handles de resize L/R.
 * La interacción (drag, resize) se delega al hook usePianoRoll.
 */

import { memo } from 'react';
import type { NotaPianoRoll } from '../../types/pianoRoll';
import { PALETA_NOTAS, CONSTANTES_PIANO_ROLL } from '../../types/pianoRoll';

interface NotaRectProps {
    nota: NotaPianoRoll;
    x: number;
    y: number;
    ancho: number;
    alto: number;
    seleccionada: boolean;
    onMouseDown: (e: React.MouseEvent, notaId: string, zona: 'cuerpo' | 'izq' | 'der') => void;
}

/*
 * Calcula opacidad basada en velocity (0.4 base + 0.6 * velocity).
 * Notas con más velocity se ven más brillantes.
 */
function opacidadPorVelocity(velocity: number): number {
    return 0.4 + velocity * 0.6;
}

export const NotaRect = memo(({
    nota,
    x,
    y,
    ancho,
    alto,
    seleccionada,
    onMouseDown,
}: NotaRectProps): JSX.Element => {
    const color = PALETA_NOTAS[nota.color % PALETA_NOTAS.length];
    const anchoVisible = Math.max(CONSTANTES_PIANO_ROLL.ANCHO_MINIMO_NOTA_PX, ancho);
    const opacidad = opacidadPorVelocity(nota.velocity);

    const clases = [
        'pianoRollNota',
        seleccionada ? 'pianoRollNotaSeleccionada' : '',
        nota.silenciada ? 'pianoRollNotaSilenciada' : '',
    ].filter(Boolean).join(' ');

    return (
        <div
            className={clases}
            style={{
                left: x,
                top: y,
                width: anchoVisible,
                height: alto - 1,
                background: color,
                opacity: nota.silenciada ? undefined : opacidad,
            }}
            data-nota-id={nota.id}
            onMouseDown={(e) => {
                e.stopPropagation();
                /* Detectar zona: handle izq (5px), handle der (5px), o cuerpo */
                const rect = e.currentTarget.getBoundingClientRect();
                const posRelativa = e.clientX - rect.left;

                if (posRelativa <= CONSTANTES_PIANO_ROLL.HANDLE_RESIZE_PX) {
                    onMouseDown(e, nota.id, 'izq');
                } else if (posRelativa >= rect.width - CONSTANTES_PIANO_ROLL.HANDLE_RESIZE_PX) {
                    onMouseDown(e, nota.id, 'der');
                } else {
                    onMouseDown(e, nota.id, 'cuerpo');
                }
            }}
        >
            {/* Handle resize izquierdo */}
            <div className="pianoRollNotaHandleIzq" />

            {/* Cuerpo visual */}
            <div className="pianoRollNotaCuerpo" />

            {/* Handle resize derecho */}
            <div className="pianoRollNotaHandleDer" />

            {/* Indicador de velocity (barra inferior) */}
            <div
                className="pianoRollNotaVelocity"
                style={{ opacity: nota.velocity }}
            />
        </div>
    );
});

NotaRect.displayName = 'NotaRect';
