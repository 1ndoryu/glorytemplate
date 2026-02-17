/*
 * Timeline — Área principal con todas las pistas, compases y cursor
 * Contenedor scrollable que agrupa pistas, barra de compases y cursor
 */

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
}

export const Timeline = ({
    timelineRef,
    onSeek,
    onIniciarDrag,
    onDragOver,
    onDrop,
}: TimelineProps): JSX.Element => {
    const pistas = useMezcladorStore(s => s.pistas);
    const totalCompases = useMezcladorStore(s => s.totalCompases);
    const agregarPista = useMezcladorStore(s => s.agregarPista);

    return (
        <div className="mezcladorTimeline" ref={timelineRef}>
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
    );
};
