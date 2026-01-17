/**
 * ModalDetalleClase
 *
 * Modal para ver y editar los detalles de una clase.
 * Permite cambiar hora, asignatura y ver alumnos asignados.
 */

import {useState, useEffect} from 'react';
import type {Clase, Alumno, Asignatura} from '../../types';
import {CAP_ASIGNATURAS, getAsignatura, getAsignaturaPorCodigo, SLOTS_HORARIOS} from '../../constants';
import {Modal} from '../ui';
import {IconoReloj, IconoUsuarios, IconoCandado, IconoGuardar, IconoLibro} from '../icons';

interface ModalDetalleClaseProps {
    clase: Clase | null;
    alumnos: Alumno[];
    abierto: boolean;
    onCerrar: () => void;
    onGuardar: (claseId: number, cambios: CambiosClase) => Promise<void>;
    onToggleBloqueo: (claseId: number) => void;
    guardando?: boolean;
}

export interface CambiosClase {
    horaInicio?: string;
    horaFin?: string;
    asignaturaId?: number;
}

export function ModalDetalleClase({clase, alumnos, abierto, onCerrar, onGuardar, onToggleBloqueo, guardando = false}: ModalDetalleClaseProps) {
    /* Estado local para edición */
    const [horaInicio, setHoraInicio] = useState('');
    const [horaFin, setHoraFin] = useState('');
    const [asignaturaId, setAsignaturaId] = useState<number>(1);
    const [hayCambios, setHayCambios] = useState(false);

    /* Sincronizar estado local con la clase seleccionada */
    useEffect(() => {
        if (clase) {
            setHoraInicio(clase.horaInicio);
            setHoraFin(clase.horaFin);

            /* Obtener asignatura (puede ser número o string) */
            const asig = typeof clase.asignaturaId === 'number' ? getAsignatura(clase.asignaturaId) : getAsignaturaPorCodigo(String(clase.asignaturaId));
            setAsignaturaId(asig?.id || 1);
            setHayCambios(false);
        }
    }, [clase]);

    /* Detectar cambios */
    useEffect(() => {
        if (!clase) return;

        const asigOriginal = typeof clase.asignaturaId === 'number' ? clase.asignaturaId : getAsignaturaPorCodigo(String(clase.asignaturaId))?.id || 1;

        const cambiosDetectados = horaInicio !== clase.horaInicio || horaFin !== clase.horaFin || asignaturaId !== asigOriginal;

        setHayCambios(cambiosDetectados);
    }, [clase, horaInicio, horaFin, asignaturaId]);

    /* Obtener alumnos asignados a esta clase */
    const alumnosClase = alumnos.filter(a => clase?.alumnosIds?.includes(a.id));

    /* Manejar guardado */
    const handleGuardar = async () => {
        if (!clase || !hayCambios) return;

        const cambios: CambiosClase = {};

        if (horaInicio !== clase.horaInicio) {
            cambios.horaInicio = horaInicio;
        }
        if (horaFin !== clase.horaFin) {
            cambios.horaFin = horaFin;
        }

        const asigOriginal = typeof clase.asignaturaId === 'number' ? clase.asignaturaId : getAsignaturaPorCodigo(String(clase.asignaturaId))?.id || 1;
        if (asignaturaId !== asigOriginal) {
            cambios.asignaturaId = asignaturaId;
        }

        await onGuardar(clase.id, cambios);
    };

    /* Manejar bloqueo */
    const handleBloqueo = () => {
        if (clase) {
            onToggleBloqueo(clase.id);
        }
    };

    if (!clase) return null;

    /* Obtener información de asignatura actual */
    const asignaturaActual = getAsignatura(asignaturaId);

    return (
        <Modal abierto={abierto} onCerrar={onCerrar} titulo="Detalles de la Clase" subtitulo={`${clase.fecha} • ${clase.horaInicio} - ${clase.horaFin}`}>
            <div className="capModalDetalleClase">
                {/* Sección: Información de la clase */}
                <div className="capModalDetalleClase__seccion">
                    <h4 className="capModalDetalleClase__seccionTitulo">
                        <IconoLibro size={16} />
                        Asignatura
                    </h4>
                    <select className="capModalDetalleClase__select" value={asignaturaId} onChange={e => setAsignaturaId(Number(e.target.value))} disabled={clase.bloqueada}>
                        {CAP_ASIGNATURAS.map(asig => (
                            <option key={asig.id} value={asig.id}>
                                {asig.codigo} - {asig.nombre}
                            </option>
                        ))}
                    </select>
                    {asignaturaActual && (
                        <p className="capModalDetalleClase__infoAsignatura">
                            Duración: <strong>{asignaturaActual.duracionHoras}h</strong>
                        </p>
                    )}
                </div>

                {/* Sección: Horario */}
                <div className="capModalDetalleClase__seccion">
                    <h4 className="capModalDetalleClase__seccionTitulo">
                        <IconoReloj size={16} />
                        Horario
                    </h4>
                    <div className="capModalDetalleClase__horarios">
                        <div className="capModalDetalleClase__campoHora">
                            <label className="capModalDetalleClase__label">Inicio</label>
                            <select className="capModalDetalleClase__select capModalDetalleClase__select--hora" value={horaInicio} onChange={e => setHoraInicio(e.target.value)} disabled={clase.bloqueada}>
                                {SLOTS_HORARIOS.map(hora => (
                                    <option key={hora} value={hora}>
                                        {hora}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <span className="capModalDetalleClase__separadorHora">—</span>
                        <div className="capModalDetalleClase__campoHora">
                            <label className="capModalDetalleClase__label">Fin</label>
                            <select className="capModalDetalleClase__select capModalDetalleClase__select--hora" value={horaFin} onChange={e => setHoraFin(e.target.value)} disabled={clase.bloqueada}>
                                {SLOTS_HORARIOS.map(hora => (
                                    <option key={hora} value={hora}>
                                        {hora}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Sección: Alumnos */}
                <div className="capModalDetalleClase__seccion">
                    <h4 className="capModalDetalleClase__seccionTitulo">
                        <IconoUsuarios size={16} />
                        Alumnos asignados ({alumnosClase.length})
                    </h4>
                    {alumnosClase.length > 0 ? (
                        <ul className="capModalDetalleClase__listaAlumnos">
                            {alumnosClase.map(alumno => (
                                <li key={alumno.id} className="capModalDetalleClase__alumnoItem">
                                    <span className="capModalDetalleClase__alumnoNombre">{alumno.nombre}</span>
                                    <span className="capModalDetalleClase__alumnoProgreso">{alumno.horasCompletadas}/35h</span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="capModalDetalleClase__sinAlumnos">No hay alumnos asignados a esta clase</p>
                    )}
                </div>

                {/* Estado de bloqueo */}
                <div className="capModalDetalleClase__estadoBloqueo">
                    <div className={`capModalDetalleClase__bloqueoIndicador ${clase.bloqueada ? 'capModalDetalleClase__bloqueoIndicador--bloqueada' : ''}`}>
                        <IconoCandado size={14} />
                        <span>{clase.bloqueada ? 'Clase bloqueada' : 'Clase editable'}</span>
                    </div>
                    <button type="button" className={`capBoton capBoton--sm ${clase.bloqueada ? 'capBoton--secundario' : 'capBoton--ghost'}`} onClick={handleBloqueo}>
                        {clase.bloqueada ? 'Desbloquear' : 'Bloquear'}
                    </button>
                </div>

                {clase.bloqueada && <p className="capModalDetalleClase__advertenciaBloqueo">Las clases bloqueadas no se modifican al regenerar el calendario.</p>}

                {/* Acciones */}
                <div className="capModalDetalleClase__acciones">
                    <button type="button" className="capBoton capBoton--secundario" onClick={onCerrar}>
                        Cancelar
                    </button>
                    <button type="button" className="capBoton capBoton--primario" onClick={handleGuardar} disabled={!hayCambios || guardando || clase.bloqueada}>
                        <IconoGuardar size={16} />
                        {guardando ? 'Guardando...' : 'Guardar cambios'}
                    </button>
                </div>
            </div>
        </Modal>
    );
}

export default ModalDetalleClase;
