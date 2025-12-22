/*
 * IndicadorArrastre
 * Indicador visual que se muestra durante el arrastre de paneles
 * Incluye:
 * - Preview flotante siguiendo el cursor
 * - Indicador de zona de drop (linea brillante arriba/abajo del panel destino)
 */

import type {PanelId} from '../../hooks/useConfiguracionLayout';
import {Target, Folder, Terminal, FileText} from 'lucide-react';

/* Nombres e iconos de los paneles */
const INFO_PANELES: Record<PanelId, {nombre: string; icono: JSX.Element}> = {
    focoPrioritario: {
        nombre: 'Foco Prioritario',
        icono: <Target size={14} />
    },
    proyectos: {
        nombre: 'Proyectos',
        icono: <Folder size={14} />
    },
    ejecucion: {
        nombre: 'Ejecucion',
        icono: <Terminal size={14} />
    },
    scratchpad: {
        nombre: 'Scratchpad',
        icono: <FileText size={14} />
    }
};

interface IndicadorArrastreProps {
    panelArrastrando: PanelId | null;
    posicionMouse: {x: number; y: number} | null;
}

export function IndicadorArrastre({panelArrastrando, posicionMouse}: IndicadorArrastreProps): JSX.Element | null {
    if (!panelArrastrando || !posicionMouse) return null;

    const info = INFO_PANELES[panelArrastrando];

    return (
        <div
            className="indicadorArrastreFlotante"
            style={{
                left: posicionMouse.x + 15,
                top: posicionMouse.y - 10
            }}>
            <span className="indicadorArrastreIcono">{info.icono}</span>
            <span className="indicadorArrastreNombre">{info.nombre}</span>
        </div>
    );
}

/*
 * Componente para el indicador de zona de drop
 * Se renderiza dentro de cada panel
 */
interface IndicadorZonaDropProps {
    activo: boolean;
    posicion: 'antes' | 'despues';
}

export function IndicadorZonaDrop({activo, posicion}: IndicadorZonaDropProps): JSX.Element | null {
    if (!activo) return null;

    /* Ahora usamos un placeholder (caja fantasma) en lugar de una linea */
    return <div className="indicadorPlaceholder" />;
}
