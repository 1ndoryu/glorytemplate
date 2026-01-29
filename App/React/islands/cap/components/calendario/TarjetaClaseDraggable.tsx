/**
 * TarjetaClaseDraggable
 *
 * Wrapper que hace la TarjetaClase arrastrable usando @dnd-kit.
 * Separa la lógica de DnD de la presentación.
 */

import {useSortable} from '@dnd-kit/sortable';
import {CSS} from '@dnd-kit/utilities';
import type {Clase} from '../../types';
import {TarjetaClase} from './TarjetaClase';

interface TarjetaClaseDraggableProps {
    clase: Clase;
    onToggleBloqueo?: (claseId: number) => void;
    onClick?: (clase: Clase) => void;
    deshabilitado?: boolean;
    style?: React.CSSProperties;
}

export function TarjetaClaseDraggable({clase, onToggleBloqueo, onClick, deshabilitado = false, style}: TarjetaClaseDraggableProps) {
    /* Las clases bloqueadas no se pueden arrastrar */
    const estaDeshabilitado = deshabilitado || clase.bloqueada;

    const {attributes, listeners, setNodeRef, transform, transition, isDragging} = useSortable({
        id: `clase-${clase.id}`,
        data: {
            type: 'clase',
            clase
        },
        disabled: estaDeshabilitado
    });

    const estiloTransformacion = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        cursor: estaDeshabilitado ? 'default' : 'grab',
        zIndex: isDragging ? 999 : 1,
        ...style
    };

    return (
        <div ref={setNodeRef} style={estiloTransformacion} {...attributes} {...listeners} className={`capTarjetaClaseDraggable ${isDragging ? 'capTarjetaClaseDraggable--arrastrando' : ''} ${estaDeshabilitado ? 'capTarjetaClaseDraggable--deshabilitado' : ''}`}>
            <TarjetaClase clase={clase} onToggleBloqueo={onToggleBloqueo} onClick={isDragging ? undefined : onClick} />
        </div>
    );
}

export default TarjetaClaseDraggable;
