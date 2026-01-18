/**
 * DragOverlayClase
 *
 * Componente visual que se muestra mientras se arrastra una clase.
 * Replica el estilo de TarjetaClase pero con estilos de arrastre.
 */

import type {Clase} from '../../types';
import {getAsignatura, getAsignaturaPorCodigo} from '../../constants';
import {IconoReloj, IconoUsuarios} from '../icons';

interface DragOverlayClaseProps {
    clase: Clase;
}

export function DragOverlayClase({clase}: DragOverlayClaseProps) {
    const asignatura = typeof clase.asignaturaId === 'number' ? getAsignatura(clase.asignaturaId) : getAsignaturaPorCodigo(String(clase.asignaturaId));
    const numAlumnos = clase.alumnosIds?.length || 0;

    return (
        <div className="capTarjetaClase capDragOverlay" data-asignatura={clase.asignaturaId}>
            <div className="capTarjetaClase__header">
                <span className="capTarjetaClase__asignatura">{asignatura?.nombre || 'Sin asignar'}</span>
                <span className="capTarjetaClase__codigo">{asignatura?.codigo || '—'}</span>
            </div>

            <div className="capTarjetaClase__horario">
                <IconoReloj size={12} />
                <span>
                    {clase.horaInicio} - {clase.horaFin}
                </span>
            </div>

            <div className="capTarjetaClase__footer">
                <div className="capTarjetaClase__alumnos">
                    <IconoUsuarios size={12} />
                    <span>
                        {numAlumnos} alumno{numAlumnos !== 1 ? 's' : ''}
                    </span>
                </div>
            </div>
        </div>
    );
}

export default DragOverlayClase;
