/**
 * ModalConflictoAforo Component
 *
 * Modal para resolver conflictos de aforo cuando la demanda de alumnos
 * excede la capacidad máxima por clase en determinados slots horarios.
 *
 * Permite al usuario seleccionar qué alumnos excluir de cada slot conflictivo.
 */

import { Modal } from '../ui';
import { Boton } from '../ui';
import type { ConflictoAforo, ExclusionesConflicto } from '../../types';
import { useConflictoAforo } from '../../hooks/useConflictoAforo';
import './ModalConflictoAforo.css';

interface ModalConflictoAforoProps {
    abierto: boolean;
    conflictos: ConflictoAforo[];
    onCerrar: () => void;
    onConfirmar: (exclusiones: ExclusionesConflicto) => void;
    cargando?: boolean;
}

export function ModalConflictoAforo({ abierto, conflictos, onCerrar, onConfirmar, cargando = false }: ModalConflictoAforoProps): JSX.Element {
    const {
        exclusiones, cargandoAlumnos, slotsAbiertos,
        toggleExclusion, toggleSlot, exclusionesValidas,
        getNombreAlumno, formatearFecha,
        resolverAleatoriamente, resolverPorProximidad,
        handleConfirmar, normalizarIdsAlumnos,
    } = useConflictoAforo({abierto, conflictos, onConfirmar});

    return (
        <Modal abierto={abierto} onCerrar={onCerrar} titulo="Conflictos de Aforo" tamano="lg" cerrarConEscape={!cargando}>
            <div className="conflictoAforo" id="modalConflictoAforo">
                <div className="conflictoAforo__descripcion">
                    <p>
                        Se han detectado <strong>{conflictos.length}</strong> slots horarios donde la demanda de alumnos <strong>supera la capacidad máxima</strong> por clase.
                    </p>
                    <p>Selecciona qué alumnos excluir de cada slot para resolver los conflictos, o usa una de las opciones automáticas:</p>
                    <div className="conflictoAforo__accionesRapidas">
                        <div className="conflictoAforo__opcionRapida">
                            <Boton variante="primario" onClick={resolverPorProximidad} disabled={cargando || cargandoAlumnos}>
                                Priorizar por proximidad
                            </Boton>
                            <span className="conflictoAforo__opcionDescripcion">
                                Prioriza alumnos cercanos a terminar y evita fragmentar horarios
                            </span>
                        </div>
                        <div className="conflictoAforo__opcionRapida">
                            <Boton variante="secundario" onClick={resolverAleatoriamente} disabled={cargando || cargandoAlumnos}>
                                Resolver aleatoriamente
                            </Boton>
                            <span className="conflictoAforo__opcionDescripcion">
                                Selecciona alumnos al azar
                            </span>
                        </div>
                    </div>
                </div>

                <div className="conflictoAforo__lista">
                    {conflictos.map(conflicto => {
                        const alumnosConflicto = normalizarIdsAlumnos(conflicto.alumnos);
                        const excluidos = exclusiones[conflicto.slotKey] || [];
                        const faltan = conflicto.exceso - excluidos.length;
                        const resuelto = faltan <= 0;
                        const slotAbierto = slotsAbiertos[conflicto.slotKey] ?? true;
                        const alumnosId = `conflictoAforo-alumnos-${conflicto.slotKey.replace(/[^a-zA-Z0-9_-]/g, '')}`;

                        return (
                            <div key={conflicto.slotKey} className={`conflictoAforo__slot ${resuelto ? 'conflictoAforo__slot--resuelto' : ''}`}>
                                <div className="conflictoAforo__slotHeader">
                                    <div className="conflictoAforo__slotInfo">
                                        <span className="conflictoAforo__fecha">{formatearFecha(conflicto.fecha)}</span>
                                        <span className="conflictoAforo__hora">
                                            {conflicto.horaInicio} - {conflicto.horaFin}
                                        </span>
                                    </div>
                                    <div className="conflictoAforo__stats">
                                        <span className="conflictoAforo__demanda">
                                            Demanda: <strong>{conflicto.demanda}</strong>
                                        </span>
                                        <span className="conflictoAforo__capacidad">
                                            Capacidad: <strong>{conflicto.capacidad}</strong>
                                        </span>
                                        {!resuelto && <span className="conflictoAforo__exceso">Excluir: {faltan} más</span>}
                                        {resuelto && <span className="conflictoAforo__ok">✓ Resuelto</span>}
                                        <button
                                            type="button"
                                            className="conflictoAforo__toggle"
                                            onClick={() => toggleSlot(conflicto.slotKey)}
                                            aria-expanded={slotAbierto}
                                            aria-controls={alumnosId}
                                        >
                                            {slotAbierto ? 'Ocultar alumnos' : `Mostrar alumnos (${alumnosConflicto.length})`}
                                        </button>
                                    </div>
                                </div>

                                {/* Ajuste UX: acordeón por slot para evitar listas infinitas y unificar scroll. */}
                                <div className={`conflictoAforo__slotContenido ${slotAbierto ? '' : 'conflictoAforo__slotContenido--colapsado'}`} id={alumnosId}>
                                    <div className="conflictoAforo__alumnos">
                                        {cargandoAlumnos ? (
                                            <span className="conflictoAforo__cargando">Cargando alumnos...</span>
                                        ) : alumnosConflicto.length === 0 ? (
                                            <span className="conflictoAforo__vacio">No hay alumnos disponibles en este slot.</span>
                                        ) : (
                                            alumnosConflicto.map(alumnoId => {
                                                const excluido = excluidos.includes(alumnoId);
                                                return (
                                                    <label key={alumnoId} className={`conflictoAforo__alumno ${excluido ? 'conflictoAforo__alumno--excluido' : ''}`}>
                                                        <input type="checkbox" checked={excluido} onChange={() => toggleExclusion(conflicto.slotKey, alumnoId)} className="conflictoAforo__checkbox" />
                                                        <span className="conflictoAforo__alumnoNombre">{getNombreAlumno(alumnoId)}</span>
                                                    </label>
                                                );
                                            })
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="conflictoAforo__acciones">
                    <Boton variante="ghost" onClick={onCerrar} disabled={cargando}>
                        Cancelar
                    </Boton>
                    <Boton variante="primario" onClick={handleConfirmar} disabled={!exclusionesValidas() || cargando} cargando={cargando}>
                        Generar con exclusiones
                    </Boton>
                </div>
            </div>
        </Modal>
    );
}

export default ModalConflictoAforo;
