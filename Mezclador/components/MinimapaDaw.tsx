/*
 * MinimapaDaw — Minimapa estilo FL Studio para controlar scroll y zoom.
 * Componente de vista. Lógica en useMinimapaDaw.
 */

import { useMinimapaDaw } from '../hooks/useMinimapaDaw';

interface MinimapaDawProps {
    timelineRef: React.RefObject<HTMLDivElement>;
}

export const MinimapaDaw = ({ timelineRef }: MinimapaDawProps): JSX.Element => {
    const {
        minimapaRef, viewportRef, viewportFrac, viewportLeft,
        bloquesSimplificados, compasesVisibles,
        handleViewportMouseDown, alClickMinimapa, alWheel,
    } = useMinimapaDaw(timelineRef);

    return (
        <div
            ref={minimapaRef}
            className="minimapaDaw"
            onClick={alClickMinimapa}
            onWheel={alWheel}
        >
            {bloquesSimplificados.map((b) => (
                <div
                    key={`${b.left}-${b.top}`}
                    className="minimapaBloque"
                    style={{
                        left: `${b.left}%`,
                        width: `${b.width}%`,
                        top: `${b.top}%`,
                        height: `${b.height}%`,
                        backgroundColor: b.color,
                    }}
                />
            ))}

            <div
                ref={viewportRef}
                className="minimapaViewport"
                style={{
                    left: `${viewportLeft * 100}%`,
                    width: `${viewportFrac * 100}%`,
                }}
                onMouseDown={handleViewportMouseDown}
            >
                <div className="minimapaHandleIzq" />
                <div className="minimapaHandleDer" />
            </div>

            <span className="minimapaZoomInfo">
                {compasesVisibles < 1
                    ? `${compasesVisibles.toFixed(1)} comp.`
                    : `${Math.round(compasesVisibles)} comp.`
                }
            </span>
        </div>
    );
};
