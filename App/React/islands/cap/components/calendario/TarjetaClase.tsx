/**
 * TarjetaClase
 *
 * Tarjeta visual para representar una clase en el calendario.
 * Muestra asignatura, hora, alumnos y estado de bloqueo.
 *
 * Niveles de visualización según altura disponible:
 * - Nivel 1 (compacto): Nombre completo + 3 badges (código, alumnos, horario)
 * - Nivel 2 (completo): Todas las secciones con icono de bloqueo separado
 *
 * TO-DO: Los umbrales se ajustarán según el zoom vertical del calendario
 */

import type {Clase} from '../../types';
import {getAsignatura, getAsignaturaPorCodigo} from '../../constants';
import {IconoCandado} from '../icons';

interface TarjetaClaseProps {
    clase: Clase;
    onToggleBloqueo?: (claseId: number) => void;
    onClick?: (clase: Clase) => void;
}

/*
 * Calcula la duración de la clase en minutos.
 */
function calcularDuracionMinutos(horaInicio: string, horaFin: string): number {
    const [hI, mI] = horaInicio.split(':').map(Number);
    const [hF, mF] = horaFin.split(':').map(Number);
    return hF * 60 + mF - (hI * 60 + mI);
}

/*
 * Formatea la hora para el badge compacto (sin segundos)
 */
function formatearHoraBadge(horaInicio: string, horaFin: string): string {
    const inicio = horaInicio.substring(0, 5);
    const fin = horaFin.substring(0, 5);
    return `${inicio}-${fin}`;
}

export function TarjetaClase({clase, onToggleBloqueo, onClick}: TarjetaClaseProps) {
    /*
     * Soporte dual: asignaturaId puede ser número (ID) o string (código)
     * El seeder PHP usa códigos snake_case, el algoritmo usa IDs numéricos
     */
    const asignatura = typeof clase.asignaturaId === 'number' ? getAsignatura(clase.asignaturaId) : getAsignaturaPorCodigo(String(clase.asignaturaId));
    const numAlumnos = clase.alumnosIds?.length || 0;
    const duracionMinutos = calcularDuracionMinutos(clase.horaInicio, clase.horaFin);

    /*
     * Determinar modo de visualización según duración (con zoom +30% por defecto):
     * - compacto: < 52 min (equivale a ~40 sin zoom) - badges compactos
     * - completo: >= 52 min - todas las secciones
     *
     * El umbral se incrementó un 30% (40 * 1.3 = 52) para dar más espacio
     */
    const modoVisualizacion = duracionMinutos >= 52 ? 'completo' : 'compacto';

    const handleBloqueoClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onToggleBloqueo?.(clase.id);
    };

    const handleClick = () => {
        onClick?.(clase);
    };

    /* Tooltip con información completa para todos los modos */
    const tooltipInfo = `${asignatura?.nombre || 'Sin asignar'}\n${clase.horaInicio} - ${clase.horaFin}\n${numAlumnos} alumno${numAlumnos !== 1 ? 's' : ''}`;

    /* Vista compacta: Nombre + 3 badges */
    if (modoVisualizacion === 'compacto') {
        return (
            <div className={`capTarjetaClase capTarjetaClase--badges ${clase.bloqueada ? 'capTarjetaClase--bloqueada' : ''}`} data-asignatura={clase.asignaturaId} onClick={handleClick} role="button" tabIndex={0} onKeyDown={e => e.key === 'Enter' && handleClick()} title={tooltipInfo}>
                {/* Línea 1: Nombre completo de asignatura (sin truncar, con wrap) */}
                <span className="capTarjetaClase__nombreCompleto">{asignatura?.nombre || 'Sin asignar'}</span>

                {/* Línea 2: 3 badges compactos */}
                <div className="capTarjetaClase__badgesContainer">
                    <span className="capTarjetaClase__badge capTarjetaClase__badge--codigo">{asignatura?.codigo || '—'}</span>
                    <span className="capTarjetaClase__badge capTarjetaClase__badge--alumnos">{numAlumnos}</span>
                    <span className="capTarjetaClase__badge capTarjetaClase__badge--horario">{formatearHoraBadge(clase.horaInicio, clase.horaFin)}</span>
                    {clase.bloqueada && <IconoCandado size={10} className="capTarjetaClase__badgeCandado" />}
                </div>
            </div>
        );
    }

    /* Vista completa */
    return (
        <div className={`capTarjetaClase ${clase.bloqueada ? 'capTarjetaClase--bloqueada' : ''}`} data-asignatura={clase.asignaturaId} onClick={handleClick} role="button" tabIndex={0} onKeyDown={e => e.key === 'Enter' && handleClick()}>
            <div className="capTarjetaClase__header">
                <span className="capTarjetaClase__asignatura">{asignatura?.nombre || 'Sin asignar'}</span>
                <span className="capTarjetaClase__codigo">{asignatura?.codigo || '—'}</span>
            </div>

            <div className="capTarjetaClase__horario">
                <span>
                    {clase.horaInicio} - {clase.horaFin}
                </span>
            </div>

            <div className="capTarjetaClase__footer">
                <div className="capTarjetaClase__alumnos">
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
