/*
 * ModalConfiguracionTareas
 * Modal para ajustar preferencias de visualización de tareas
 */

import {Modal} from '../shared/Modal';
import {ToggleSwitch} from '../shared/ToggleSwitch';
import type {ConfiguracionTareas} from '../../hooks/useConfiguracionTareas';
import {useGruposTareasStore} from '../../stores/gruposTareasStore';
import {useShallow} from 'zustand/react/shallow';

interface ModalConfiguracionTareasProps {
    estaAbierto: boolean;
    onCerrar: () => void;
    configuracion: ConfiguracionTareas;
    onToggleCompletadas: () => void;
    onToggleBadgeProyecto: () => void;
    onToggleEliminarCompletadas: () => void;
    onToggleEstilos?: () => void;
    onToggleMostrarHabitos: () => void;
    onToggleModoCompacto: () => void;
    onToggleOcultarSubtareas: () => void;
    onToggleIgnorarUrgencia: () => void;
}

export function ModalConfiguracionTareas({estaAbierto, onCerrar, configuracion, onToggleCompletadas, onToggleBadgeProyecto, onToggleEliminarCompletadas, onToggleMostrarHabitos, onToggleModoCompacto, onToggleOcultarSubtareas, onToggleIgnorarUrgencia}: ModalConfiguracionTareasProps): JSX.Element {
    const {seccionesActivas: _seccionesActivas, toggleSecciones: _toggleSecciones, ordenamientoGrupos: _ordenamientoGrupos, setOrdenamientoGrupos: _setOrdenamientoGrupos} = useGruposTareasStore(useShallow(s => ({seccionesActivas: s.seccionesActivas, toggleSecciones: s.toggleSecciones, ordenamientoGrupos: s.ordenamientoGrupos, setOrdenamientoGrupos: s.setOrdenamientoGrupos})));

    return (
        <Modal estaAbierto={estaAbierto} onCerrar={onCerrar} titulo="Configuracion de Vista">
            <div className="contenedorOpcionesConfig">
                {/* Opcion 1: Ocultar Completadas */}
                <div className="itemOpcionConfig">
                    <div className="detallesOpcionConfig">
                        <span className="tituloOpcionConfig">Ocultar tareas completadas</span>
                        <span className="descripcionOpcionConfig">Las tareas finalizadas no apareceran en la lista principal</span>
                    </div>
                    <ToggleSwitch checked={configuracion.ocultarCompletadas} onChange={onToggleCompletadas} />
                </div>

                <div className="separadorOpcionesConfig" />

                {/* Opcion 2: Ocultar Badge Proyecto */}
                <div className="itemOpcionConfig">
                    <div className="detallesOpcionConfig">
                        <span className="tituloOpcionConfig">Ocultar nombre de proyecto</span>
                        <span className="descripcionOpcionConfig">No mostrar el badge del proyecto en las tareas de la lista</span>
                    </div>
                    <ToggleSwitch checked={configuracion.ocultarBadgeProyecto} onChange={onToggleBadgeProyecto} />
                </div>
                <div className="separadorOpcionesConfig" />

                {/* Opcion 3: Ocultar Subtareas Automáticamente */}
                <div className="itemOpcionConfig">
                    <div className="detallesOpcionConfig">
                        <span className="tituloOpcionConfig">Colapsar subtareas automáticamente</span>
                        <span className="descripcionOpcionConfig">Las subtareas estarán colapsadas por defecto</span>
                    </div>
                    <ToggleSwitch checked={configuracion.ocultarSubtareasAutomaticamente} onChange={onToggleOcultarSubtareas} />
                </div>
                <div className="separadorOpcionesConfig" />

                {/* Opcion 4: Eliminar Completadas */}
                <div className="itemOpcionConfig">
                    <div className="detallesOpcionConfig">
                        <span className="tituloOpcionConfig">Limpieza automática</span>
                        <span className="descripcionOpcionConfig">Eliminar tareas completadas después de 24 horas</span>
                    </div>
                    <ToggleSwitch checked={configuracion.eliminarCompletadasDespuesDeUnDia} onChange={onToggleEliminarCompletadas} />
                </div>
                <div className="separadorOpcionesConfig" />

                {/* Opcion 5: Mostrar Hábitos en Ejecución */}
                <div className="itemOpcionConfig">
                    <div className="detallesOpcionConfig">
                        <span className="tituloOpcionConfig">Mostrar hábitos en Ejecución</span>
                        <span className="descripcionOpcionConfig">Los hábitos que tocan hoy aparecerán como tareas en la lista</span>
                    </div>
                    <ToggleSwitch checked={configuracion.mostrarHabitosEnEjecucion} onChange={onToggleMostrarHabitos} />
                </div>

                <div className="separadorOpcionesConfig" />

                {/* Opcion 6: Modo Compacto */}
                <div className="itemOpcionConfig">
                    <div className="detallesOpcionConfig">
                        <span className="tituloOpcionConfig">Modo Compacto</span>
                        <span className="descripcionOpcionConfig">Reducir el tamaño de la fuente y el espaciado</span>
                    </div>
                    <ToggleSwitch checked={configuracion.modoCompacto} onChange={onToggleModoCompacto} />
                </div>

                <div className="separadorOpcionesConfig" />

                {/* Opcion 7: Ignorar urgencia en ordenamiento por prioridad */}
                <div className="itemOpcionConfig">
                    <div className="detallesOpcionConfig">
                        <span className="tituloOpcionConfig">Ignorar urgencia en Prioridad</span>
                        <span className="descripcionOpcionConfig">Permite reordenar tareas (y hábitos) de igual prioridad sin que la urgencia altere el orden</span>
                    </div>
                    <ToggleSwitch checked={configuracion.ignorarUrgenciaEnPrioridad} onChange={onToggleIgnorarUrgencia} />
                </div>

                <div className="separadorOpcionesConfig" />

                {/* Opcion 8 y 9: Secciones y Ordenamiento (DESACTIVADO TEMPORALMENTE)
                   TO-DO: Reactivar cuando se corrija la lógica de grupos
                <div className="itemOpcionConfig">
                    <div className="detallesOpcionConfig">
                        <span className="tituloOpcionConfig">Activar secciones</span>
                        <span className="descripcionOpcionConfig">Permite agrupar tareas en secciones con Ctrl+Click y "Agrupar"</span>
                    </div>
                    <ToggleSwitch checked={seccionesActivas} onChange={toggleSecciones} />
                </div>

                {seccionesActivas && (
                    <>
                        <div className="separadorOpcionesConfig" />
                        <div className="itemOpcionConfig">
                            <div className="detallesOpcionConfig">
                                <span className="tituloOpcionConfig">Ordenar secciones por</span>
                                <span className="descripcionOpcionConfig">Criterio para ordenar las secciones entre sí</span>
                            </div>
                            <Select
                                claseAdicional="selectorOrdenamiento"
                                value={ordenamientoGrupos}
                                onChange={e => setOrdenamientoGrupos(e.target.value as OrdenamientoGrupos)}
                                opciones={opcionesOrdenamiento}
                            />
                        </div>
                    </>
                )}
                */}
            </div>
        </Modal>
    );
}
