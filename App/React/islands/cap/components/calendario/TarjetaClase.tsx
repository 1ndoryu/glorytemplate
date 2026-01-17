/**
 * TarjetaClase
 *
 * Tarjeta visual para representar una clase en el calendario.
 * Muestra asignatura, hora, alumnos y estado de bloqueo.
 */

import type {Clase} from '../../types';
import {getAsignatura, getAsignaturaPorCodigo} from '../../constants';
import {IconoCandado, IconoReloj, IconoUsuarios} from '../icons';

interface TarjetaClaseProps {
    clase: Clase;
    onToggleBloqueo?: (claseId: number) => void;
    onClick?: (clase: Clase) => void;
}

export function TarjetaClase({clase, onToggleBloqueo, onClick}: TarjetaClaseProps) {
    /*
     * Soporte dual: asignaturaId puede ser número (ID) o string (código)
     * El seeder PHP usa códigos snake_case, el algoritmo usa IDs numéricos
     */
    const asignatura = typeof clase.asignaturaId === 'number' ? getAsignatura(clase.asignaturaId) : getAsignaturaPorCodigo(String(clase.asignaturaId));
    const numAlumnos = clase.alumnosIds?.length || 0;

    const handleBloqueoClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onToggleBloqueo?.(clase.id);
    };

    const handleClick = () => {
        onClick?.(clase);
    };

    return (
        <div className={`capTarjetaClase ${clase.bloqueada ? 'capTarjetaClase--bloqueada' : ''}`} data-asignatura={clase.asignaturaId} onClick={handleClick} role="button" tabIndex={0} onKeyDown={e => e.key === 'Enter' && handleClick()}>
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

                <button className="capTarjetaClase__bloqueo" onClick={handleBloqueoClick} title={clase.bloqueada ? 'Desbloquear clase' : 'Bloquear clase'} aria-label={clase.bloqueada ? 'Desbloquear clase' : 'Bloquear clase'}>
                    <IconoCandado size={14} />
                </button>
            </div>

            {clase.bloqueada && <span className="capTarjetaClase__tooltip">Clase bloqueada (no se regenerará)</span>}
        </div>
    );
}

export default TarjetaClase;
