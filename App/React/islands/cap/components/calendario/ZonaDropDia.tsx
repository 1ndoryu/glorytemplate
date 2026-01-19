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

/*
 * Formatea una fecha a YYYY-MM-DD respetando la zona horaria local.
 * Evita el problema de toISOString() que convierte a UTC y puede
 * desplazar la fecha un día en zonas horarias negativas.
 */
function formatearFechaLocal(fecha: Date): string {
    const anio = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    return `${anio}-${mes}-${dia}`;
}

export function ZonaDropDia({dia, fecha, children, esActivo = false}: ZonaDropDiaProps) {
    const {setNodeRef, isOver} = useDroppable({
        id: `dia-${dia}`,
        data: {
            type: 'dia',
            dia,
            fecha: formatearFechaLocal(fecha)
        }
    });

    return (
        <div ref={setNodeRef} className={`capZonaDropDia ${isOver ? 'capZonaDropDia--sobre' : ''} ${esActivo ? 'capZonaDropDia--activo' : ''}`}>
            {children}
        </div>
    );
}

export default ZonaDropDia;
