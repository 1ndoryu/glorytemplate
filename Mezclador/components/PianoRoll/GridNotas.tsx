/*
 * GridNotas — Grid principal del piano roll.
 * C310: Canvas para fondo (líneas, colores teclas negras) + DOM divs para notas.
 * Misma estrategia que FL Studio: overlay de notas interactivas sobre grid estático.
 */

import { useGridNotas } from '../../hooks/useGridNotas';

interface GridNotasProps {
    totalCompases: number;
    numerador?: number;
    notaHover: number | null;
}

export const GridNotas = ({
    totalCompases,
    numerador = 4,
    notaHover,
}: GridNotasProps): JSX.Element => {
    const {
        contenedorRef,
        canvasRef,
        handleGridMouseDown,
        handleWheel,
        cursorGrid,
        marquee,
        altTotal,
        anchoTotal,
        notasRenderizadas,
        hoverStyle,
    } = useGridNotas({ totalCompases, numerador, notaHover });

    return (
        <div
            ref={contenedorRef}
            className="pianoRollGrid"
            style={{ cursor: cursorGrid() }}
            onMouseDown={handleGridMouseDown}
            onWheel={handleWheel}
        >
            {/* Canvas: fondo del grid */}
            <canvas
                ref={canvasRef}
                className="pianoRollGridCanvas"
            />

            {/* Highlight de fila hover */}
            {hoverStyle && <div style={hoverStyle} />}

            {/* Contenedor de notas DOM */}
            <div
                className="pianoRollNotasContenedor"
                style={{
                    width: anchoTotal,
                    height: altTotal,
                }}
            >
                {notasRenderizadas}
            </div>

            {/* Marquee de selección */}
            {marquee && (
                <div
                    className="pianoRollMarquee"
                    style={{
                        left: marquee.x,
                        top: marquee.y,
                        width: marquee.ancho,
                        height: marquee.alto,
                    }}
                />
            )}
        </div>
    );
};
