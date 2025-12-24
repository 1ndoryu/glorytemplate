/*
 * ModalConfiguracionTareas
 * Modal para ajustar preferencias de visualización de tareas
 */

import {Modal} from '../shared/Modal';
import {ToggleSwitch} from '../shared/ToggleSwitch';
import type {ConfiguracionTareas} from '../../hooks/useConfiguracionTareas';

interface ModalConfiguracionTareasProps {
    estaAbierto: boolean;
    onCerrar: () => void;
    configuracion: ConfiguracionTareas;
    onToggleCompletadas: () => void;
    onToggleBadgeProyecto: () => void;
    onToggleEliminarCompletadas: () => void;
    onToggleMostrarHabitos: () => void;
}

export function ModalConfiguracionTareas({estaAbierto, onCerrar, configuracion, onToggleCompletadas, onToggleBadgeProyecto, onToggleEliminarCompletadas, onToggleMostrarHabitos}: ModalConfiguracionTareasProps): JSX.Element {
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

                {/* Opcion 3: Eliminar Completadas */}
                <div className="itemOpcionConfig">
                    <div className="detallesOpcionConfig">
                        <span className="tituloOpcionConfig">Limpieza automática</span>
                        <span className="descripcionOpcionConfig">Eliminar tareas completadas después de 24 horas</span>
                    </div>
                    <ToggleSwitch checked={configuracion.eliminarCompletadasDespuesDeUnDia} onChange={onToggleEliminarCompletadas} />
                </div>
                <div className="separadorOpcionesConfig" />

                {/* Opcion 4: Mostrar Hábitos en Ejecución */}
                <div className="itemOpcionConfig">
                    <div className="detallesOpcionConfig">
                        <span className="tituloOpcionConfig">Mostrar hábitos en Ejecución</span>
                        <span className="descripcionOpcionConfig">Los hábitos que tocan hoy aparecerán como tareas en la lista</span>
                    </div>
                    <ToggleSwitch checked={configuracion.mostrarHabitosEnEjecucion} onChange={onToggleMostrarHabitos} />
                </div>
            </div>
        </Modal>
    );
}
