/*
 * TecladoPiano — Teclado vertical del piano roll (C0 a B8).
 * C310: Muestra teclas blancas/negras con labels en las notas C.
 * Click = preview del sample a ese pitch. Scroll sync con el grid.
 */

import { memo, useCallback } from 'react';
import { CONSTANTES_PIANO_ROLL } from '../../types/pianoRoll';
import { midiANombre, esTeclaNegra, esNotaC, notaAPx } from '../../utils/pianoRollUtils';

interface TecladoPianoProps {
    scrollY: number;
    zoomY: number;
    alturaNota: number;
    anchoPiano: number;
    alturaVisible: number;
    onClickTecla: (midi: number) => void;
    onHoverTecla: (midi: number | null) => void;
    notaHover: number | null;
}

export const TecladoPiano = memo(({
    scrollY,
    zoomY,
    alturaNota,
    anchoPiano,
    alturaVisible,
    onClickTecla,
    onHoverTecla,
    notaHover,
}: TecladoPianoProps): JSX.Element => {
    const altoPorNota = alturaNota * zoomY;

    /* Solo renderizar teclas visibles en el viewport */
    const notaVisSuperior = 127 - Math.floor(scrollY / altoPorNota);
    const notasVisibles = Math.ceil(alturaVisible / altoPorNota) + 2;
    const notaInferior = Math.max(0, notaVisSuperior - notasVisibles);

    const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        const target = e.target as HTMLElement;
        const midi = target.dataset.midi;
        if (midi != null) {
            onClickTecla(parseInt(midi, 10));
        }
    }, [onClickTecla]);

    const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        const target = e.target as HTMLElement;
        const midi = target.dataset.midi;
        onHoverTecla(midi != null ? parseInt(midi, 10) : null);
    }, [onHoverTecla]);

    const handleMouseLeave = useCallback(() => {
        onHoverTecla(null);
    }, [onHoverTecla]);

    /* Generar teclas visibles */
    const teclas: JSX.Element[] = [];

    for (let midi = notaVisSuperior; midi >= notaInferior; midi--) {
        if (midi < 0 || midi > 127) continue;

        const y = notaAPx(midi, alturaNota, zoomY) - scrollY;
        const negra = esTeclaNegra(midi);
        const esC = esNotaC(midi);
        const nombre = midiANombre(midi);
        const esHover = notaHover === midi;

        const claseTecla = [
            'pianoRollTecla',
            negra ? 'pianoRollTeclaNegra' : 'pianoRollTeclaBlanca',
            esHover ? 'pianoRollTeclaActiva' : '',
        ].filter(Boolean).join(' ');

        teclas.push(
            <div
                key={midi}
                className={claseTecla}
                style={{
                    top: y,
                    height: altoPorNota,
                }}
                data-midi={midi}
            >
                {/* Solo mostrar label en C y notas no-negras cada octava */}
                {esC && (
                    <span className="pianoRollTeclaLabel">{nombre}</span>
                )}
            </div>
        );
    }

    return (
        <div
            className="pianoRollTeclado"
            style={{ width: anchoPiano }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
        >
            <div
                className="pianoRollTecladoInner"
                style={{
                    height: CONSTANTES_PIANO_ROLL.TOTAL_NOTAS * altoPorNota,
                    top: -scrollY,
                }}
            >
                {teclas}
            </div>
        </div>
    );
});

TecladoPiano.displayName = 'TecladoPiano';
