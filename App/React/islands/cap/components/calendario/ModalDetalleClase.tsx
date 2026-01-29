/**
 * ModalDetalleClase
 *
 * Modal para ver y editar los detalles de una clase.
 * Permite cambiar hora, asignatura y ver alumnos asignados.
 */

import {useState, useCallback} from 'react';
import type {Clase, DiaSemana, AlumnoClase} from '../../types';
import {ASIGNATURAS_CAP, getAsignatura, getAsignaturaPorCodigo, SLOTS_HORARIOS} from '../../constants';
import {Modal, Boton} from '../ui';
import {IconoReloj, IconoUsuarios, IconoCandado, IconoGuardar, IconoLibro, IconoEliminar} from '../icons';
import {detectarColision, resolverDesplazamientoCascada, encontrarHorarioDisponibleMasCercano} from '../../utils/collisionUtils';
import {ModalConflictoDrag} from './ModalConflictoDrag';

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

export interface CambiosClase {
    horaInicio?: string;
    horaFin?: string;
    asignaturaId?: number;
}

export function ModalDetalleClase({clase, abierto, onCerrar, onGuardar, onToggleBloqueo, onMoverClase, fechasSemana, clasesPorDia, onMoverMultiplesClases, guardando = false, onEliminar, eliminando = false}: ModalDetalleClaseProps) {
    /*
     * Función helper para formatear hora (quita segundos).
     * Ej: "10:00:00" -> "10:00"
     */
    const formatearHora = (hora: string | undefined | null): string => {
        if (!hora) return '08:00';
        return hora.substring(0, 5);
    };

    /* Obtener ID de asignatura inicial de la clase */
    const obtenerAsignaturaIdInicial = (): number => {
        if (!clase) return 1;
        if (typeof clase.asignaturaId === 'number') {
            return clase.asignaturaId;
        }
        return getAsignaturaPorCodigo(String(clase.asignaturaId))?.id || 1;
    };

    /*
     * Estado local para edición.
     * Gracias a la key en el componente padre (SeccionCalendario),
     * el componente se remonta cuando cambia la clase seleccionada.
     * Por eso podemos inicializar directamente con los valores de la clase.
     */
    const [horaInicio, setHoraInicio] = useState(() => formatearHora(clase?.horaInicio));
    const [horaFin, setHoraFin] = useState(() => formatearHora(clase?.horaFin));
    const [asignaturaId, setAsignaturaId] = useState<number>(obtenerAsignaturaIdInicial);
    const [confirmandoEliminar, setConfirmandoEliminar] = useState(false);
    const [conflictoData, setConflictoData] = useState<{
        claseMoviendo: Clase;
        claseExistente: Clase;
        nuevaHoraInicio: string;
        nuevaHoraFin: string;
    } | null>(null);

    /* Detectar cambios comparando con valores originales */
    const hayCambios = (() => {
        if (!clase) return false;

        const horaInicioOriginal = formatearHora(clase.horaInicio);
        const horaFinOriginal = formatearHora(clase.horaFin);
        const asigOriginal = obtenerAsignaturaIdInicial();

        return horaInicio !== horaInicioOriginal || horaFin !== horaFinOriginal || asignaturaId !== asigOriginal;
    })();

    /*
     * Usamos alumnosData que viene directamente de la API con cada clase.
     * Esto evita el problema de paginación del hook useAlumnos.
     */
    const alumnosClase: AlumnoClase[] = clase?.alumnosData || [];

    /* Resolver clases del día actual para validar conflictos de horario */
    const obtenerClasesDiaActual = (): Clase[] => {
        if (!clase || !clasesPorDia) return [];

        const fechaClase = new Date(`${clase.fecha}T00:00:00`);
        const diaIndices: Record<number, DiaSemana> = {
            1: 'lunes',
            2: 'martes',
            3: 'miercoles',
            4: 'jueves',
            5: 'viernes'
        };
        const diaKey = diaIndices[fechaClase.getDay()];
        return diaKey ? clasesPorDia[diaKey] || [] : [];
    };

    /* Manejar guardado */
    const handleGuardar = async () => {
        if (!clase || !hayCambios) return;

        const cambios: CambiosClase = {};

        /* Validación rápida para evitar solapamientos en el modal */
        const horaInicioOriginal = formatearHora(clase.horaInicio);
        const horaFinOriginal = formatearHora(clase.horaFin);
        const cambiaHorario = horaInicio !== horaInicioOriginal || horaFin !== horaFinOriginal;
        if (cambiaHorario) {
            const clasesDia = obtenerClasesDiaActual();
            const conflicto = detectarColision(horaInicio, horaFin, clasesDia, clase.id);
            if (conflicto) {
                setConflictoData({
                    claseMoviendo: clase,
                    claseExistente: conflicto,
                    nuevaHoraInicio: horaInicio,
                    nuevaHoraFin: horaFin
                });
                return;
            }
        }

        if (horaInicio !== horaInicioOriginal) {
            cambios.horaInicio = horaInicio;
        }
        if (horaFin !== horaFinOriginal) {
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

    /* Resolver conflicto desplazando clases */
    const handleDesplazarClases = async () => {
        if (!clase || !conflictoData || !onMoverMultiplesClases) return;

        const clasesDia = obtenerClasesDiaActual();
        const cambios = resolverDesplazamientoCascada(clase, conflictoData.nuevaHoraInicio, conflictoData.nuevaHoraFin, clasesDia);

        setConflictoData(null);
        await onMoverMultiplesClases(cambios);
        onCerrar();
    };

    /* Resolver conflicto moviendo al horario más cercano */
    const handleMoverCercano = async () => {
        if (!clase || !conflictoData) return;

        const clasesDia = obtenerClasesDiaActual();
        const horario = encontrarHorarioDisponibleMasCercano(
            conflictoData.nuevaHoraInicio,
            conflictoData.nuevaHoraFin,
            clasesDia,
            clase.id
        );

        if (!horario) {
            setConflictoData(null);
            return;
        }

        setConflictoData(null);
        await onGuardar(clase.id, {horaInicio: horario.horaInicio, horaFin: horario.horaFin});
    };

    /* Cerrar modal y limpiar alerta interna */
    const handleCerrar = () => {
        setConflictoData(null);
        onCerrar();
    };

    /* Manejar eliminación con doble confirmación */
    const handleEliminar = useCallback(async () => {
        if (!clase || !onEliminar) return;

        if (!confirmandoEliminar) {
            /* Primera vez: mostrar confirmación */
            setConfirmandoEliminar(true);
            /* Reset automático después de 3 segundos */
            setTimeout(() => setConfirmandoEliminar(false), 3000);
            return;
        }

        /* Segunda vez: eliminar */
        await onEliminar(clase.id, clase.bloqueada);
    }, [clase, onEliminar, confirmandoEliminar]);

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
                                onChange={e => {
                                    setHoraInicio(e.target.value);
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
