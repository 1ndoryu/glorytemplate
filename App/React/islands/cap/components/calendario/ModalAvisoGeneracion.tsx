/**
 * ModalAvisoGeneracion
 *
 * Modal informativo que aparece después de generar el calendario
 * cuando no se han podido cubrir todas las horas disponibles del día.
 * Explica detalladamente por qué faltan horas y qué acciones puede tomar el usuario.
 */

import {Modal, Boton} from '../ui';
import {IconoInfo, IconoUsuarios, IconoReloj} from '../icons';
import type {AvisoGeneracion} from '../../types';
import './ModalAvisoGeneracion.css';

/* Re-exportamos el tipo desde types para mantener compatibilidad */
export type InfoHorasNoCubiertas = AvisoGeneracion;

interface ModalAvisoGeneracionProps {
    abierto: boolean;
    avisos: AvisoGeneracion[];
    onCerrar: () => void;
}

export function ModalAvisoGeneracion({abierto, avisos, onCerrar}: ModalAvisoGeneracionProps) {
    if (!avisos || avisos.length === 0) return null;

    /* Calcular resumen total */
    const horasTotalesSinCubrir = avisos.reduce((sum, a) => sum + a.horasSinCubrir, 0);

    return (
        <Modal abierto={abierto} onCerrar={onCerrar} titulo="Aviso: Horas sin Cubrir" tamano="lg">
            <div className="avisoGeneracion">
                {/* Explicación general */}
                <div className="avisoGeneracion__intro">
                    <div className="avisoGeneracion__iconoInfo">
                        <IconoInfo size={24} />
                    </div>
                    <div>
                        <p className="avisoGeneracion__mensaje">
                            El calendario se ha generado correctamente, pero <strong>{horasTotalesSinCubrir.toFixed(1)} horas</strong> no pudieron ser asignadas debido a la disponibilidad de alumnos.
                        </p>
                        <p className="avisoGeneracion__submensaje">
                            Esto es normal cuando hay pocos alumnos o su disponibilidad no cubre todo el horario del centro.
                        </p>
                    </div>
                </div>

                {/* Detalles por día */}
                <div className="avisoGeneracion__lista">
                    <h4 className="avisoGeneracion__listaTitulo">Detalle por día:</h4>
                    {avisos.map((aviso, idx) => (
                        <div key={idx} className="avisoGeneracion__dia">
                            <div className="avisoGeneracion__diaHeader">
                                <span className="avisoGeneracion__diaNombre">{aviso.diaSemana}</span>
                                <span className="avisoGeneracion__diaFecha">{aviso.fecha}</span>
                            </div>
                            <div className="avisoGeneracion__diaStats">
                                <div className="avisoGeneracion__stat">
                                    <IconoReloj size={14} />
                                    <span>
                                        <strong>{aviso.horasAsignadas}h</strong> de {aviso.horasDisponiblesCentro}h cubiertas
                                    </span>
                                </div>
                                <div className="avisoGeneracion__stat avisoGeneracion__stat--alerta">
                                    <span>
                                        Faltan <strong>{aviso.horasSinCubrir.toFixed(1)}h</strong> por cubrir
                                    </span>
                                </div>
                            </div>
                            {/* Mostrar rangos horarios específicos si existen */}
                            {aviso.rangosNoCubiertos && aviso.rangosNoCubiertos.length > 0 && (
                                <div className="avisoGeneracion__rangos">
                                    <span className="avisoGeneracion__rangosLabel">Huecos sin cubrir:</span>
                                    <div className="avisoGeneracion__rangosList">
                                        {aviso.rangosNoCubiertos.map((rango, ridx) => (
                                            <span key={ridx} className="avisoGeneracion__rango">{rango}</span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Explicación y sugerencias */}
                <div className="avisoGeneracion__explicacion">
                    <h4 className="avisoGeneracion__explicacionTitulo">¿Por qué sucede esto?</h4>
                    <ul className="avisoGeneracion__explicacionLista">
                        <li>
                            <IconoUsuarios size={14} />
                            <span>
                                <strong>Número de alumnos:</strong> El sistema solo puede asignar clases en horarios donde hay alumnos disponibles. Si hay pocos alumnos, es normal que algunos slots queden vacíos.
                            </span>
                        </li>
                        <li>
                            <IconoReloj size={14} />
                            <span>
                                <strong>Disponibilidad limitada:</strong> Los alumnos solo asisten en los horarios que marcaron como disponibles. Si ningún alumno está disponible en un horario, no se puede crear clase.
                            </span>
                        </li>
                    </ul>
                </div>

                {/* Sugerencias de acción */}
                <div className="avisoGeneracion__sugerencias">
                    <h4 className="avisoGeneracion__sugerenciasTitulo">¿Qué puedes hacer?</h4>
                    <ol className="avisoGeneracion__sugerenciasLista">
                        <li>Añadir más alumnos al curso para aumentar las horas disponibles.</li>
                        <li>Revisar la disponibilidad de los alumnos actuales y ampliarla si es posible.</li>
                        <li>Ajustar los horarios del centro para que coincidan mejor con la disponibilidad de los alumnos.</li>
                    </ol>
                </div>

                {/* Acciones */}
                <div className="avisoGeneracion__acciones">
                    <Boton variante="primario" onClick={onCerrar}>
                        Entendido
                    </Boton>
                </div>
            </div>
        </Modal>
    );
}

export default ModalAvisoGeneracion;
