/*
 * Timeline — Área principal con todas las pistas, compases y cursor
 * Contenedor scrollable que agrupa pistas, barra de compases y cursor
 */

import { useCallback } from 'react';
import { Plus } from 'lucide-react';
import { BarraCompases } from './BarraCompases';
import { CursorReproduccion } from './CursorReproduccion';
import { PistaTimeline } from './PistaTimeline';
import { useMezcladorStore } from '../stores/mezcladorStore';

interface TimelineProps {
    timelineRef: React.RefObject<HTMLDivElement>;
    onSeek: (compas: number) => void;
    onIniciarDrag: (bloqueId: string, pistaId: string, e: React.MouseEvent) => void;
    onDragOver: (e: React.DragEvent) => void;
    onDrop: (e: React.DragEvent, pistaId?: string) => void;
    pistaIdHover?: string | null;
    dragActivo?: boolean;
    bloqueIdDrag?: string | null;
}

export const Timeline = ({
    timelineRef,
    onSeek,
    onIniciarDrag,
    onDragOver,
    onDrop,
    pistaIdHover,
    dragActivo,
    bloqueIdDrag,
}: TimelineProps): JSX.Element => {
    const pistas = useMezcladorStore(s => s.pistas);
    const totalCompases = useMezcladorStore(s => s.totalCompases);
    const agregarPista = useMezcladorStore(s => s.agregarPista);
    const modoCortarActivo = useMezcladorStore(s => s.modoCortarActivo);
    const dividirBloque = useMezcladorStore(s => s.dividirBloque);
    const nivelZoom = useMezcladorStore(s => s.nivelZoom);

    const alCortar = useCallback((bloqueId: string, compas: number) => {
        dividirBloque(bloqueId, compas);
    }, [dividirBloque]);

    /* C217: El ancho del contenido se escala por nivelZoom */
    const estiloZoom = nivelZoom !== 1
        ? { width: `${nivelZoom * 100}%` } as React.CSSProperties
        : undefined;

    return (
        <div className="mezcladorTimeline" ref={timelineRef}>
            {/* C217: Contenedor de zoom — scrollable horizontalmente */}
            <div className="mezcladorTimelineZoom" style={estiloZoom}>
                {/* Barra de compases (regla superior) */}
                <div className="mezcladorTimelineEncabezado">
                    <div className="mezcladorPistaControlesEspaciador" />
                    <div className="mezcladorTimelineRegla">
                        <BarraCompases onSeek={onSeek} />
                    </div>
                </div>

                {/* Pistas */}
                <div className="mezcladorTimelinePistas">
                    {pistas.map(pista => (
                        <PistaTimeline
                            key={pista.id}
                            pista={pista}
                            totalCompases={totalCompases}
                            onIniciarDrag={onIniciarDrag}
                            onDragOver={onDragOver}
                            onDrop={(e, pistaId) => onDrop(e, pistaId)}
                            pistaIdHover={pistaIdHover}
                            dragActivo={dragActivo}
                            bloqueIdDrag={bloqueIdDrag}
                            modoCortarActivo={modoCortarActivo}
                            onCortar={alCortar}
                        />
                    ))}

                    {/* Botón añadir pista */}
                    <button className="mezcladorAgregarPista" onClick={agregarPista}>
                        <Plus size={14} />
                        <span>Añadir pista</span>
                    </button>
                </div>

                {/* Cursor de reproducción (se superpone a todas las pistas) */}
                <CursorReproduccion />
            </div>
        </div>
    );
};
