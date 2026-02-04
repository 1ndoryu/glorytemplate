/**
 * TarjetaClase
 *
 * Tarjeta visual para representar una clase en el calendario.
 * Muestra asignatura, hora, alumnos y estado de bloqueo.
 * Adapta su contenido según la duración de la clase:
 * - >= 45 min: Vista completa con todas las secciones
 * - 30-44 min: Oculta horario (está implícito en posición)
 * - 20-29 min: Vista compacta en una fila
 * - < 20 min: Solo código de asignatura con tooltip
 */

import type {Clase} from '../../types';
import {getAsignatura, getAsignaturaPorCodigo} from '../../constants';
import {IconoCandado, IconoReloj, IconoUsuarios} from '../icons';

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
    return (hF * 60 + mF) - (hI * 60 + mI);
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
     * Determinar modo de visualización según duración:
     * - completo: >= 45 min (todas las secciones)
     * - sinHorario: 30-44 min (sin línea de horario)
     * - compacto: 20-29 min (una fila)
     * - minimo: < 20 min (solo código)
     */
    const modoVisualizacion = duracionMinutos >= 46 ? 'completo' : duracionMinutos >= 35 ? 'sinHorario' : duracionMinutos >= 20 ? 'compacto' : 'minimo';

    const handleBloqueoClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onToggleBloqueo?.(clase.id);
    };

    const handleClick = () => {
        onClick?.(clase);
    };

    /* Tooltip con información completa para modos reducidos */
    const tooltipInfo = `${asignatura?.nombre || 'Sin asignar'}\n${clase.horaInicio} - ${clase.horaFin}\n${numAlumnos} alumno${numAlumnos !== 1 ? 's' : ''}`;

    /* Vista mínima: código + nombre abreviado + candado a la derecha */
    if (modoVisualizacion === 'minimo') {
        /* Nombre muy corto para encajar en espacio reducido */
        const nombreMini = asignatura?.nombre
            ? (asignatura.nombre.length > 8 ? asignatura.nombre.substring(0, 6) + '..' : asignatura.nombre)
            : '—';
        return (
            <div
                className={`capTarjetaClase capTarjetaClase--minimo ${clase.bloqueada ? 'capTarjetaClase--bloqueada' : ''}`}
                data-asignatura={clase.asignaturaId}
                onClick={handleClick}
                role="button"
                tabIndex={0}
                onKeyDown={e => e.key === 'Enter' && handleClick()}
                title={tooltipInfo}
            >
                <span className="capTarjetaClase__codigo">{asignatura?.codigo || '—'}</span>
                <span className="capTarjetaClase__nombreMini">{nombreMini}</span>
                {clase.bloqueada && <IconoCandado size={10} className="capTarjetaClase__miniCandado" />}
            </div>
        );
    }

    /* Vista compacta: una fila con código y nombre abreviado */
    if (modoVisualizacion === 'compacto') {
        const nombreCorto = asignatura?.nombre ? (asignatura.nombre.length > 12 ? asignatura.nombre.substring(0, 10) + '...' : asignatura.nombre) : 'Sin asignar';
        return (
            <div
                className={`capTarjetaClase capTarjetaClase--compacto ${clase.bloqueada ? 'capTarjetaClase--bloqueada' : ''}`}
                data-asignatura={clase.asignaturaId}
                onClick={handleClick}
                role="button"
                tabIndex={0}
                onKeyDown={e => e.key === 'Enter' && handleClick()}
                title={tooltipInfo}
            >
                <span className="capTarjetaClase__codigo">{asignatura?.codigo || '—'}</span>
                <span className="capTarjetaClase__nombreCorto">{nombreCorto}</span>
                {clase.bloqueada && <IconoCandado size={12} className="capTarjetaClase__miniCandado" />}
            </div>
        );
    }

    /* Vista sin horario o completa */
    return (
        <div className={`capTarjetaClase ${modoVisualizacion === 'sinHorario' ? 'capTarjetaClase--sinHorario' : ''} ${clase.bloqueada ? 'capTarjetaClase--bloqueada' : ''}`} data-asignatura={clase.asignaturaId} onClick={handleClick} role="button" tabIndex={0} onKeyDown={e => e.key === 'Enter' && handleClick()}>
            <div className="capTarjetaClase__header">
                <span className="capTarjetaClase__asignatura">{asignatura?.nombre || 'Sin asignar'}</span>
                <span className="capTarjetaClase__codigo">{asignatura?.codigo || '—'}</span>
            </div>

            {modoVisualizacion === 'completo' && (
                <div className="capTarjetaClase__horario">
                    <IconoReloj size={12} />
                    <span>
                        {clase.horaInicio} - {clase.horaFin}
                    </span>
                </div>
            )}

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
