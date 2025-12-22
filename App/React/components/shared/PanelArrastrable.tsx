/*
 * PanelArrastrable
 * Contenedor para los paneles del dashboard que soporta el sistema de arrastre personalizado
 */

import {ReactNode} from 'react';
import type {PanelId} from '../../hooks/useConfiguracionLayout';
import {IndicadorZonaDrop} from './IndicadorArrastre';

interface PanelArrastrableProps {
    panelId: PanelId;
    children: ReactNode;
    innerRef: (el: HTMLElement | null) => void;
    esArrastrando: boolean;
    esDestino: boolean;
    posicionDestino: 'antes' | 'despues' | null;
}

export function PanelArrastrable({panelId, children, innerRef, esArrastrando, esDestino, posicionDestino}: PanelArrastrableProps): JSX.Element {
    return (
        <div ref={innerRef} className={`panelArrastrable ${esArrastrando ? 'arrastrando' : ''}`} data-panel-id={panelId}>
            <IndicadorZonaDrop activo={esDestino && posicionDestino === 'antes'} posicion="antes" />

            <div className="panelArrastrableContenido">{children}</div>

            <IndicadorZonaDrop activo={esDestino && posicionDestino === 'despues'} posicion="despues" />
        </div>
    );
}
