/*
 * PanelScratchpad
 * Componente que renderiza el panel de notas rápidas (Scratchpad)
 * Responsabilidad única: renderizar el scratchpad con sus controles
 */

import {FileText, Eraser, Settings} from 'lucide-react';
import {SeccionEncabezado, Scratchpad} from '../dashboard';
import type {ConfiguracionScratchpad} from '../../hooks/useConfiguracionScratchpad';

interface PanelScratchpadProps {
    notas: string;
    configuracion: ConfiguracionScratchpad;
    onActualizarNotas: (notas: string) => void;
    onLimpiarScratchpad: () => void;
    onAbrirModalConfigScratchpad: () => void;
    onCambiarAltura: (altura: string) => void;
    handleArrastre: JSX.Element;
}

export function PanelScratchpad({notas, configuracion, onActualizarNotas, onLimpiarScratchpad, onAbrirModalConfigScratchpad, onCambiarAltura, handleArrastre}: PanelScratchpadProps): JSX.Element {
    return (
        <div className="panelDashboard internaColumna">
            <SeccionEncabezado
                icono={<FileText size={12} />}
                titulo="Scratchpad"
                subtitulo="markdown supported"
                acciones={
                    <>
                        {handleArrastre}
                        <button className="selectorBadgeBoton selectorBadgeBotonCompacto" onClick={onLimpiarScratchpad} title="Limpiar notas">
                            <span className="selectorBadgeIcono">
                                <Eraser size={10} />
                            </span>
                        </button>
                        <button className="selectorBadgeBoton" onClick={onAbrirModalConfigScratchpad} title="Configuración">
                            <span className="selectorBadgeIcono">
                                <Settings size={10} />
                            </span>
                        </button>
                    </>
                }
            />
            <Scratchpad valorInicial={notas} onChange={onActualizarNotas} tamanoFuente={configuracion.tamanoFuente} altura={configuracion.altura} delayGuardado={configuracion.autoGuardadoIntervalo} onCambiarAltura={onCambiarAltura} />
        </div>
    );
}
