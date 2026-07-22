/*
 * TareaReorderItem
 * Componente interno que envuelve un Reorder.Item para el arrastre de tareas.
 * Framer Motion permite arrastrar desde cualquier punto del item.
 *
 * [218A-fix] Se usa ID primitivo (number) como value para estabilidad de referencias.
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
            /* [218A-fix] Usar ID primitivo (number) como value en vez del objeto Tarea.
             * Framer Motion usa Object.is (===) para emparejar items entre renders.
             * Los números son inmutables: 1 === 1 siempre, sin importar re-renders. */
            value={tareaPadre.id}
            as="div"
            className={`posicionRelativa tareaPadreReorder ${tareaArrastrandoId === tareaPadre.id ? 'tareaPadreReorderArrastrando' : ''} ${tareaArrastrandoId === tareaPadre.id && esGestoSubtarea ? 'tareaPadreReorderGestoSubtarea' : ''}`}
            onPointerDown={(e: React.PointerEvent) => handleDragStart(tareaPadre.id, e)}
            onDragEnd={handleDragEnd}
            onClickCapture={(e: React.MouseEvent) => { if (seArrastroRef.current) { e.stopPropagation(); e.preventDefault(); } }}
            onDrag={(_: unknown, info: {offset: {x: number; y: number}}) => {
                /* Marcar que realmente se movió el ítem para suprimir clicks posteriores */
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
