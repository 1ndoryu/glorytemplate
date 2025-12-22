/*
 * ModalConfiguracionScratchpad
 * Modal para ajustar opciones del Scratchpad
 */

import {Modal} from '../shared/Modal';
import type {ConfiguracionScratchpad, TamanoFuente, AlturaScratchpad} from '../../hooks/useConfiguracionScratchpad';

interface ModalConfiguracionScratchpadProps {
    estaAbierto: boolean;
    onCerrar: () => void;
    configuracion: ConfiguracionScratchpad;
    onCambiarFuente: (t: TamanoFuente) => void;
    onCambiarAltura: (a: AlturaScratchpad) => void;
    onCambiarIntervalo: (i: number) => void;
}

export function ModalConfiguracionScratchpad({estaAbierto, onCerrar, configuracion, onCambiarFuente, onCambiarAltura, onCambiarIntervalo}: ModalConfiguracionScratchpadProps): JSX.Element {
    return (
        <Modal estaAbierto={estaAbierto} onCerrar={onCerrar} titulo="Configuración Scratchpad">
            <div className="contenedorOpcionesConfig">
                {/* Fuente */}
                <div className="itemOpcionConfig">
                    <div className="detallesOpcionConfig">
                        <span className="tituloOpcionConfig">Tamaño de fuente</span>
                        <span className="descripcionOpcionConfig">Ajustar legibilidad del texto</span>
                    </div>
                    {/* Reutilizamos selectOpcionConfig si existe, o definimos inline si es critico */}
                    <select className="selectOpcionConfig" value={configuracion.tamanoFuente} onChange={e => onCambiarFuente(e.target.value as TamanoFuente)}>
                        <option value="pequeno">Pequeño</option>
                        <option value="normal">Normal</option>
                        <option value="grande">Grande</option>
                    </select>
                </div>

                <div className="separadorOpcionesConfig" />

                {/* Altura */}
                <div className="itemOpcionConfig">
                    <div className="detallesOpcionConfig">
                        <span className="tituloOpcionConfig">Altura del editor</span>
                        <span className="descripcionOpcionConfig">Tamaño vertical del área de texto</span>
                    </div>
                    <select className="selectOpcionConfig" value={configuracion.altura} onChange={e => onCambiarAltura(e.target.value as AlturaScratchpad)}>
                        <option value="100%">Automático (Llenar)</option>
                        <option value="300px">Compacto (300px)</option>
                        <option value="500px">Amplio (500px)</option>
                    </select>
                </div>

                <div className="separadorOpcionesConfig" />

                {/* Intervalo Guardado */}
                <div className="itemOpcionConfig">
                    <div className="detallesOpcionConfig">
                        <span className="tituloOpcionConfig">Auto-guardado</span>
                        <span className="descripcionOpcionConfig">Tiempo de espera antes de guardar</span>
                    </div>
                    <select className="selectOpcionConfig" value={configuracion.autoGuardadoIntervalo} onChange={e => onCambiarIntervalo(Number(e.target.value))}>
                        <option value={500}>Rápido (0.5s)</option>
                        <option value={1500}>Normal (1.5s)</option>
                        <option value={3000}>Relax (3s)</option>
                    </select>
                </div>
            </div>
        </Modal>
    );
}
