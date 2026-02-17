/*
 * BloqueSample — Bloque visual de un sample en la timeline
 * Muestra mini waveform + título. Draggeable, con menú contextual.
 */

import { X } from 'lucide-react';
import type { BloqueMezclador } from '../types/mezclador';
import { anchoBloquePorc, posicionBloquePorc } from '../utils/compasUtils';
import { useMezcladorStore } from '../stores/mezcladorStore';

interface BloqueSampleProps {
    bloque: BloqueMezclador;
    totalCompases: number;
    onIniciarDrag: (bloqueId: string, pistaId: string, e: React.MouseEvent) => void;
}

export const BloqueSample = ({ bloque, totalCompases, onIniciarDrag }: BloqueSampleProps): JSX.Element => {
    const eliminarBloque = useMezcladorStore(s => s.eliminarBloque);
    const ancho = anchoBloquePorc(bloque.duracionCompases, totalCompases);
    const izquierda = posicionBloquePorc(bloque.compasInicio, totalCompases);

    /* Mini waveform SVG */
    const waveformPath = bloque.waveformPeaks.length > 0
        ? bloque.waveformPeaks.map((peak, i) => {
            const x = (i / bloque.waveformPeaks.length) * 100;
            const y = 50 - peak * 40;
            const yEspejo = 50 + peak * 40;
            return `M${x},${y} L${x},${yEspejo}`;
        }).join(' ')
        : '';

    return (
        <div
            className="mezcladorBloque"
            style={{
                left: `${izquierda}%`,
                width: `${ancho}%`,
                '--colorBloque': bloque.color,
            } as React.CSSProperties}
            onMouseDown={(e) => onIniciarDrag(bloque.id, bloque.pistaId, e)}
            title={bloque.sample.titulo}
        >
            <div className="mezcladorBloqueCabecera">
                <span className="mezcladorBloqueTitulo">
                    {bloque.sample.titulo}
                </span>
                <button
                    className="mezcladorBloqueEliminar"
                    onClick={(e) => {
                        e.stopPropagation();
                        eliminarBloque(bloque.id);
                    }}
                >
                    <X size={10} />
                </button>
            </div>
            {bloque.waveformPeaks.length > 0 && (
                <svg className="mezcladorBloqueWaveform" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <path d={waveformPath} stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.7" />
                </svg>
            )}
        </div>
    );
};
