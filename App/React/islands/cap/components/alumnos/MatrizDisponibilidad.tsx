/**
 * MatrizDisponibilidad
 *
 * Componente de grid interactivo para gestionar la disponibilidad horaria de un alumno.
 * Permite click individual, click en fila (hora), click en columna (día).
 */

import {useEffect} from 'react';
import {Boton, Spinner, Alerta} from '../ui';
import {IconoGuardar} from '../icons';
import {useDisponibilidad, DIAS_SEMANA, HORAS_DISPONIBLES, type DiaSemana} from '../../hooks/useDisponibilidad';

interface MatrizDisponibilidadProps {
    alumnoId: number;
    alumnoNombre?: string;
    onGuardadoExitoso?: () => void;
}

/* Nombres legibles para los días */
const NOMBRES_DIAS: Record<DiaSemana, string> = {
    lunes: 'Lun',
    martes: 'Mar',
    miercoles: 'Mié',
    jueves: 'Jue',
    viernes: 'Vie'
};

/* Formatea hora para mostrar */
function formatearHora(hora: string): string {
    return hora.replace(':00', 'h');
}

export function MatrizDisponibilidad({alumnoId, alumnoNombre, onGuardadoExitoso}: MatrizDisponibilidadProps) {
    const {slots, cargando, guardando, error, exito, hayCambios, toggleSlot, toggleFila, toggleColumna, seleccionarTodo, limpiarTodo, guardar, cargar, limpiarMensajes} = useDisponibilidad();

    /* Cargar disponibilidad cuando cambia el alumno */
    useEffect(() => {
        if (alumnoId) {
            cargar(alumnoId);
        }
    }, [alumnoId, cargar]);

    /* Limpiar mensajes después de 4s */
    useEffect(() => {
        if (exito || error) {
            const timer = setTimeout(limpiarMensajes, 4000);
            return () => clearTimeout(timer);
        }
    }, [exito, error, limpiarMensajes]);

    /* Verificar si un slot está disponible */
    const esDisponible = (dia: DiaSemana, hora: string): boolean => {
        const slot = slots.find(s => s.dia === dia && s.hora === hora);
        return slot?.disponible ?? false;
    };

    /* Verificar si toda la columna (día) está seleccionada */
    const columnaCompleta = (dia: DiaSemana): boolean => {
        return HORAS_DISPONIBLES.every(hora => esDisponible(dia, hora));
    };

    /* Verificar si toda la fila (hora) está seleccionada */
    const filaCompleta = (hora: string): boolean => {
        return DIAS_SEMANA.every(dia => esDisponible(dia, hora));
    };

    /* Contar slots seleccionados */
    const totalSeleccionados = slots.filter(s => s.disponible).length;
    const totalSlots = DIAS_SEMANA.length * HORAS_DISPONIBLES.length;

    const handleGuardar = async () => {
        const exito = await guardar();
        if (exito && onGuardadoExitoso) {
            onGuardadoExitoso();
        }
    };

    if (cargando) {
        return (
            <div className="capMatriz__cargando">
                <Spinner tamano="lg" />
                <span>Cargando disponibilidad...</span>
            </div>
        );
    }

    return (
        <div className="capMatriz">
            {/* Header con info y acciones */}
            <div className="capMatriz__header">
                <div className="capMatriz__info">
                    {alumnoNombre && <h3 className="capMatriz__titulo">Disponibilidad de {alumnoNombre}</h3>}
                    <p className="capMatriz__subtitulo">
                        {totalSeleccionados} de {totalSlots} horas seleccionadas
                    </p>
                </div>
                <div className="capMatriz__acciones">
                    <Boton variante="ghost" tamano="sm" onClick={seleccionarTodo} disabled={guardando}>
                        Seleccionar todo
                    </Boton>
                    <Boton variante="ghost" tamano="sm" onClick={limpiarTodo} disabled={guardando}>
                        Limpiar
                    </Boton>
                </div>
            </div>

            {/* Mensajes de feedback */}
            {error && (
                <Alerta variante="error" className="capMb--md capAnimSlideUp">
                    {error}
                </Alerta>
            )}
            {exito && (
                <Alerta variante="exito" className="capMb--md capAnimSlideUp">
                    {exito}
                </Alerta>
            )}

            {/* Grid de la matriz */}
            <div className="capMatriz__contenedor">
                <div className="capMatriz__grid">
                    {/* Celda esquina vacía */}
                    <div className="capMatriz__celdaEsquina" />

                    {/* Headers de días (columnas) */}
                    {DIAS_SEMANA.map(dia => (
                        <button key={dia} type="button" className={`capMatriz__headerDia ${columnaCompleta(dia) ? 'capMatriz__headerDia--activo' : ''}`} onClick={() => toggleColumna(dia)} disabled={guardando} title={`Toggle ${dia}`}>
                            {NOMBRES_DIAS[dia]}
                        </button>
                    ))}

                    {/* Filas de horas */}
                    {HORAS_DISPONIBLES.map(hora => (
                        <>
                            {/* Header de hora (fila) */}
                            <button key={`hora-${hora}`} type="button" className={`capMatriz__headerHora ${filaCompleta(hora) ? 'capMatriz__headerHora--activo' : ''}`} onClick={() => toggleFila(hora)} disabled={guardando} title={`Toggle ${hora}`}>
                                {formatearHora(hora)}
                            </button>

                            {/* Celdas de slots */}
                            {DIAS_SEMANA.map(dia => {
                                const disponible = esDisponible(dia, hora);
                                return <button key={`${dia}-${hora}`} type="button" className={`capMatriz__celda ${disponible ? 'capMatriz__celda--activa' : ''}`} onClick={() => toggleSlot(dia, hora)} disabled={guardando} aria-label={`${dia} ${hora}: ${disponible ? 'disponible' : 'no disponible'}`} aria-pressed={disponible} />;
                            })}
                        </>
                    ))}
                </div>
            </div>

            {/* Leyenda */}
            <div className="capMatriz__leyenda">
                <div className="capMatriz__leyendaItem">
                    <span className="capMatriz__leyendaColor capMatriz__leyendaColor--disponible" />
                    <span>Disponible</span>
                </div>
                <div className="capMatriz__leyendaItem">
                    <span className="capMatriz__leyendaColor capMatriz__leyendaColor--noDisponible" />
                    <span>No disponible</span>
                </div>
            </div>

            {/* Footer con botón guardar */}
            <div className="capMatriz__footer">
                <Boton variante="primario" onClick={handleGuardar} cargando={guardando} disabled={!hayCambios || guardando}>
                    <IconoGuardar />
                    {hayCambios ? 'Guardar cambios' : 'Sin cambios'}
                </Boton>
            </div>
        </div>
    );
}

export default MatrizDisponibilidad;
