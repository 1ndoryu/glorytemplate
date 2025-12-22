/*
 * ModalConfiguracionProyectos
 * Modal para ajustar preferencias de visualización de proyectos
 */

import {Settings} from 'lucide-react';
import {Modal} from '../../shared/Modal';
import {ToggleSwitch} from '../../shared/ToggleSwitch';
import type {ConfiguracionProyectos, OrdenamientoProyectos} from '../../../hooks/useConfiguracionProyectos';

interface ModalConfiguracionProyectosProps {
    estaAbierto: boolean;
    onCerrar: () => void;
    configuracion: ConfiguracionProyectos;
    onToggleCompletados: () => void;

    onToggleProgreso: () => void;
}

export function ModalConfiguracionProyectos({estaAbierto, onCerrar, configuracion, onToggleCompletados, onToggleProgreso}: ModalConfiguracionProyectosProps): JSX.Element {
    return (
        <Modal estaAbierto={estaAbierto} onCerrar={onCerrar} titulo="Configuración de Proyectos">
            <div className="contenedorOpcionesConfig">
                {/* Ocultar Completados */}
                <div className="itemOpcionConfig">
                    <div className="detallesOpcionConfig">
                        <span className="tituloOpcionConfig">Ocultar proyectos completados</span>
                        <span className="descripcionOpcionConfig">Los proyectos finalizados no aparecerán en la lista principal</span>
                    </div>
                    <ToggleSwitch checked={configuracion.ocultarCompletados} onChange={onToggleCompletados} />
                </div>

                <div className="separadorOpcionesConfig" />

                {/* Mostrar Progreso */}
                <div className="itemOpcionConfig">
                    <div className="detallesOpcionConfig">
                        <span className="tituloOpcionConfig">Mostrar progreso</span>
                        <span className="descripcionOpcionConfig">Visualizar la barra de progreso de tareas</span>
                    </div>
                    <ToggleSwitch checked={configuracion.mostrarProgreso} onChange={onToggleProgreso} />
                </div>
            </div>
        </Modal>
    );
}
