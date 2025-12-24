/*
 * BotonMinimizarPanel
 * Botón para minimizar/ocultar un panel del dashboard
 * Responsabilidad única: ocultar panel usando el sistema de layout existente
 */

import {Minus} from 'lucide-react';
import type {PanelId} from '../../hooks/useConfiguracionLayout';

interface BotonMinimizarPanelProps {
    panelId: PanelId;
    onMinimizar: (panelId: PanelId) => void;
}

export function BotonMinimizarPanel({panelId, onMinimizar}: BotonMinimizarPanelProps): JSX.Element {
    return (
        <button className="selectorBadgeBoton botonMinimizarPanel" onClick={() => onMinimizar(panelId)} title="Minimizar panel">
            <span className="selectorBadgeIcono">
                <Minus size={10} />
            </span>
        </button>
    );
}
