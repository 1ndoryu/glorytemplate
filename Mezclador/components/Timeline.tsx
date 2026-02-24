/*
 * Timeline — Área principal con todas las pistas, compases y cursor.
 * C285: Incluye MinimapaDaw encima del área scrollable.
 * Contenedor scrollable que agrupa pistas, barra de compases y cursor.
 */

import { useCallback } from 'react';
import { Plus } from 'lucide-react';
import { BarraCompases } from './BarraCompases';
import { CursorReproduccion } from './CursorReproduccion';
import { MinimapaDaw } from './MinimapaDaw';
import { PistaTimeline } from './PistaTimeline';
import { useMezcladorStore } from '../stores/mezcladorStore';
import { BotonBase } from '@app/components/ui/BotonBase';

interface TimelineProps {
    timelineRef: React.RefObject<HTMLDivElement>;
    onSeek: (compas: number) => void;
    onIniciarDrag: (bloqueId: string, pistaId: string, e: React.MouseEvent) => void;
    onDragOver: (e: React.DragEvent) => void;
    onDrop: (e: React.DragEvent, pistaId?: string) => void;
    pistaIdHover?: string | null;
    dragActivo?: boolean;
    bloqueIdDrag?: string | null;
    /* C242: Ghost preview durante drag */
    posicionDragFantasma?: number | null;
    duracionBloqueDrag?: number;
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
    posicionDragFantasma,
    duracionBloqueDrag,
}: TimelineProps): JSX.Element => {
    const pistas = useMezcladorStore(s => s.pistas);
    /* C285: Usar totalExtendido en vez de totalCompases para rendering */
    const totalExtendido = useMezcladorStore(s => s.obtenerTotalExtendido());
    const agregarPista = useMezcladorStore(s => s.agregarPista);
    const modoCortarActivo = useMezcladorStore(s => s.modoCortarActivo);
    const dividirBloque = useMezcladorStore(s => s.dividirBloque);
    const toggleModoCortar = useMezcladorStore(s => s.toggleModoCortar);
    const nivelZoom = useMezcladorStore(s => s.nivelZoom);

    /* C227: Desactivar modo cortar después del primer uso */
    const alCortar = useCallback((bloqueId: string, compas: number) => {
        dividirBloque(bloqueId, compas);
        toggleModoCortar();
    }, [dividirBloque, toggleModoCortar]);

    /* C217: El ancho del contenido se escala por nivelZoom */
    const estiloZoom = nivelZoom !== 1
        ? { width: `${nivelZoom * 100}%` } as React.CSSProperties
        : undefined;

    return (
        <div className="mezcladorTimelineWrapper">
            {/* C285: Minimapa — control de scroll y zoom */}
            <MinimapaDaw timelineRef={timelineRef} />

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
                                totalCompases={totalExtendido}
                                onIniciarDrag={onIniciarDrag}
                                onDragOver={onDragOver}
                                onDrop={(e, pistaId) => onDrop(e, pistaId)}
                                pistaIdHover={pistaIdHover}
                                dragActivo={dragActivo}
                                bloqueIdDrag={bloqueIdDrag}
                                modoCortarActivo={modoCortarActivo}
                                onCortar={alCortar}
                                posicionDragFantasma={posicionDragFantasma}
                                duracionBloqueDrag={duracionBloqueDrag}
                            />
                        ))}

                        {/* Botón añadir pista */}
                        <BotonBase variante="ghost" className="mezcladorAgregarPista" onClick={agregarPista}>
                            <Plus size={14} />
                            <span>Añadir pista</span>
                        </BotonBase>
                    </div>

                    {/* Cursor de reproducción (se superpone a todas las pistas) */}
                    <CursorReproduccion />
                </div>
            </div>
        </div>
    );
};
