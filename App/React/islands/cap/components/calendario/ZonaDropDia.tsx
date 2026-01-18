/**
 * ZonaDropDia
 *
 * Zona de drop para un día del calendario.
 * Permite soltar clases arrastrándolas a este día.
 */

import {useDroppable} from '@dnd-kit/core';
import type {DiaSemana} from '../../types';

interface ZonaDropDiaProps {
    dia: DiaSemana;
    fecha: Date;
    children: React.ReactNode;
    esActivo?: boolean;
}

export function ZonaDropDia({dia, fecha, children, esActivo = false}: ZonaDropDiaProps) {
    const {setNodeRef, isOver} = useDroppable({
        id: `dia-${dia}`,
        data: {
            type: 'dia',
            dia,
            fecha: fecha.toISOString().split('T')[0]
        }
    });

    return (
        <div ref={setNodeRef} className={`capZonaDropDia ${isOver ? 'capZonaDropDia--sobre' : ''} ${esActivo ? 'capZonaDropDia--activo' : ''}`}>
            {children}
        </div>
    );
}

export default ZonaDropDia;
