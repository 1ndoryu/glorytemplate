/*
 * BarraPanelesOcultos
 * Barra lateral minimalista que muestra iconos de paneles ocultos
 * Click en un icono vuelve a mostrar el panel
 */

import {Target, Folder, Terminal, FileText} from 'lucide-react';
import type {PanelId} from '../../hooks/useConfiguracionLayout';

interface BarraPanelesOcultosProps {
    panelesOcultos: PanelId[];
    onMostrarPanel: (panel: PanelId) => void;
}

/* Mapeo de paneles a iconos y nombres */
const PANELES_INFO: Record<PanelId, {icono: JSX.Element; nombre: string}> = {
    focoPrioritario: {
        icono: <Target size={14} />,
        nombre: 'Foco Prioritario'
    },
    proyectos: {
        icono: <Folder size={14} />,
        nombre: 'Proyectos'
    },
    ejecucion: {
        icono: <Terminal size={14} />,
        nombre: 'Ejecución'
    },
    scratchpad: {
        icono: <FileText size={14} />,
        nombre: 'Scratchpad'
    }
};

export function BarraPanelesOcultos({panelesOcultos, onMostrarPanel}: BarraPanelesOcultosProps): JSX.Element | null {
    if (panelesOcultos.length === 0) return null;

    return (
        <div className="barraPanelesOcultos">
            <div className="barraPanelesOcultosContenido">
                {panelesOcultos.map(panelId => {
                    const info = PANELES_INFO[panelId];
                    return (
                        <button key={panelId} className="botonPanelOculto" onClick={() => onMostrarPanel(panelId)} title={`Mostrar ${info.nombre}`}>
                            {info.icono}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
