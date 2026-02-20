/**
 * ModalDetalleClase
 *
 * Modal para ver y editar los detalles de una clase.
 * Permite cambiar hora, asignatura y ver alumnos asignados.
 * Al cambiar hora de inicio, recalcula automáticamente la hora fin
 * para mantener la duración original de la asignatura.
 */

import type {Clase, DiaSemana} from '../../types';
import {ASIGNATURAS_CAP, getAsignatura, SLOTS_HORARIOS} from '../../constants';
import {Modal, Boton} from '../ui';
import {IconoReloj, IconoUsuarios, IconoCandado, IconoGuardar, IconoLibro, IconoEliminar} from '../icons';
import {ModalConflictoDrag} from './ModalConflictoDrag';
import {useDetalleClase} from '../../hooks/useDetalleClase';
import type {CambiosClase} from '../../hooks/useDetalleClase';

interface ModalDetalleClaseProps {
    clase: Clase | null;
    abierto: boolean;
    onCerrar: () => void;
    onGuardar: (claseId: number, cambios: CambiosClase) => Promise<void>;
    onToggleBloqueo: (claseId: number) => void;
    onMoverClase?: (claseId: number, nuevaFecha: string) => Promise<void>;
    fechasSemana?: Date[];
    clasesPorDia?: Record<DiaSemana, Clase[]>;
    onMoverMultiplesClases?: (cambios: {clase: Clase; nuevoInicio: string; nuevoFin: string; nuevaFecha?: string}[]) => Promise<void>;
    guardando?: boolean;
    onEliminar?: (claseId: number, forzar: boolean) => Promise<void>;
    eliminando?: boolean;
}

export function ModalDetalleClase({clase, abierto, onCerrar, onGuardar, onToggleBloqueo, onMoverClase, fechasSemana, clasesPorDia, onMoverMultiplesClases, guardando = false, onEliminar, eliminando = false}: ModalDetalleClaseProps) {
    const {
        horaInicio, horaFin, asignaturaId, setAsignaturaId, setHoraFin,
        confirmandoEliminar, conflictoData, setConflictoData,
        hayCambios, alumnosClase, duracionOriginalMinutos,
        handleCambioHoraInicio, handleGuardar, handleBloqueo,
        handleDesplazarClases, handleMoverCercano, handleCerrar, handleEliminar,
        formatearHora,
    } = useDetalleClase({clase, onGuardar, onToggleBloqueo, onCerrar, onMoverMultiplesClases, clasesPorDia, onEliminar});

    if (!clase) return null;

    /* Obtener información de asignatura actual */
    const asignaturaActual = getAsignatura(asignaturaId);

    return (
        <>
            <Modal abierto={abierto} onCerrar={handleCerrar} titulo="Detalles de la Clase" subtitulo={`${clase.fecha} • ${formatearHora(clase.horaInicio)} - ${formatearHora(clase.horaFin)}`}>
                <div className="capModalDetalleClase">
                {/* Sección: Información de la clase */}
                <div className="capModalDetalleClase__seccion">
                    <h4 className="capModalDetalleClase__seccionTitulo">
                        <IconoLibro size={16} />
                        Asignatura
                    </h4>
                    <select className="capModalDetalleClase__select" value={asignaturaId} onChange={e => setAsignaturaId(Number(e.target.value))} disabled={clase.bloqueada}>
                        {ASIGNATURAS_CAP.map(asig => (
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
                            <select
                                className="capModalDetalleClase__select capModalDetalleClase__select--hora"
                                value={horaInicio}
                                onChange={e => handleCambioHoraInicio(e.target.value)}
                                disabled={clase.bloqueada}
                            >
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
                            <select
                                className="capModalDetalleClase__select capModalDetalleClase__select--hora"
                                value={horaFin}
                                onChange={e => {
                                    setHoraFin(e.target.value);
                                    setConflictoData(null);
                                }}
                                disabled={clase.bloqueada}
                            >
                                {SLOTS_HORARIOS.map(hora => (
                                    <option key={hora} value={hora}>
                                        {hora}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <p className="capModalDetalleClase__infoAsignatura">
                        Duración: <strong>{Math.round(duracionOriginalMinutos / 60 * 10) / 10}h</strong> (se mantiene al cambiar hora de inicio)
                    </p>
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
                                    <span className="capModalDetalleClase__alumnoNombre">
                                        {alumno.nombre}
                                        {alumno.asistio && <span className="capModalDetalleClase__asistioMarca"> ✓</span>}
                                    </span>
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
                    <Boton variante={clase.bloqueada ? 'secundario' : 'ghost'} tamano="sm" onClick={handleBloqueo}>
                        {clase.bloqueada ? 'Desbloquear' : 'Bloquear'}
                    </Boton>
                </div>

                {clase.bloqueada && <p className="capModalDetalleClase__advertenciaBloqueo">Las clases bloqueadas no se modifican al regenerar el calendario.</p>}

                {/* Acciones */}
                <div className="capModalDetalleClase__acciones">
                    {onEliminar && (
                        <Boton variante="peligro" onClick={handleEliminar} disabled={eliminando} cargando={eliminando} icono={<IconoEliminar size={16} />}>
                            {confirmandoEliminar ? '¡Click para confirmar!' : 'Eliminar'}
                        </Boton>
                    )}
                    <div className="capModalDetalleClase__accionesPrincipales">
                        <Boton variante="secundario" onClick={handleCerrar}>
                            Cancelar
                        </Boton>
                        <Boton variante="primario" onClick={handleGuardar} disabled={!hayCambios || guardando || clase.bloqueada} cargando={guardando} icono={<IconoGuardar size={16} />}>
                            Guardar cambios
                        </Boton>
                    </div>
                </div>
                </div>
            </Modal>
            <ModalConflictoDrag
                abierto={conflictoData !== null}
                conflicto={conflictoData}
                onCancelar={() => setConflictoData(null)}
                onDesplazar={handleDesplazarClases}
                onMoverCercano={handleMoverCercano}
            />
        </>
    );
}

export default ModalDetalleClase;
