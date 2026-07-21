/*
 * TareaReorderItem
 * Componente interno que envuelve un Reorder.Item con un handle de arrastre dedicado.
 * Framer Motion requiere que useDragControls se use dentro de un componente renderizado
 * en cada ítem, no dentro del map, por eso se extrae a este componente.
 */

import {Reorder} from 'framer-motion';
import type {Tarea} from '../../../types/dashboard';

interface TareaReorderItemProps {
    tareaPadre: Tarea;
    subtareasVisibles: Tarea[];
    tareaArrastrandoId: number | null;
    esGestoSubtarea: boolean;
    UMBRAL_INDENT: number;
    seArrastroRef: React.RefObject<boolean>;
    dragStartXRef: React.RefObject<number>;
    dragCurrentXRef: React.RefObject<number>;
    setEsGestoSubtarea: (valor: boolean) => void;
    handleDragStart: (tareaId: number, evento: React.PointerEvent) => void;
    handleDragEnd: () => void;
    renderTareaItem: (tarea: Tarea, esSubtarea: boolean) => JSX.Element;
}

export function TareaReorderItem({
    tareaPadre,
    subtareasVisibles,
    tareaArrastrandoId,
    esGestoSubtarea,
    UMBRAL_INDENT,
    seArrastroRef,
    dragStartXRef,
    dragCurrentXRef,
    setEsGestoSubtarea,
    handleDragStart,
    handleDragEnd,
    renderTareaItem
}: TareaReorderItemProps): JSX.Element {
    return (
        <Reorder.Item
            value={tareaPadre}
            as="div"
            className={`posicionRelativa tareaPadreReorder ${tareaArrastrandoId === tareaPadre.id ? 'tareaPadreReorderArrastrando' : ''} ${tareaArrastrandoId === tareaPadre.id && esGestoSubtarea ? 'tareaPadreReorderGestoSubtarea' : ''}`}
            onPointerDown={(e: React.PointerEvent) => handleDragStart(tareaPadre.id, e)}
            onDragEnd={handleDragEnd}
            onClickCapture={(e: React.MouseEvent) => { if (seArrastroRef.current) { e.stopPropagation(); e.preventDefault(); } }}
            onDrag={(_: unknown, info: {offset: {x: number; y: number}}) => {
                /* [218A-2] Marcar que realmente se movió el ítem para que,
                 * si Framer Motion dispara un click posterior, el capture lo suprima.
                 * Se usa un pequeño umbral para no suprimir clicks por temblores. */
                if (Math.abs(info.offset.x) > 3 || Math.abs(info.offset.y) > 3) {
                    seArrastroRef.current = true;
                }

                dragCurrentXRef.current = dragStartXRef.current + info.offset.x;
                const nuevoEsGesto = info.offset.x > UMBRAL_INDENT;
                if (nuevoEsGesto !== esGestoSubtarea) {
                    setEsGestoSubtarea(nuevoEsGesto);
                }
            }}>
            {tareaArrastrandoId === tareaPadre.id && esGestoSubtarea && <div className="tareaDropIndicador tareaDropIndicadorSubtarea tareaDropIndicadorActivo" />}

            {renderTareaItem(tareaPadre, false)}

            {subtareasVisibles.map(subtarea => (
                <div key={subtarea.id} className="subtareaContenedor">
                    {renderTareaItem(subtarea, true)}
                </div>
            ))}
        </Reorder.Item>
    );
}
