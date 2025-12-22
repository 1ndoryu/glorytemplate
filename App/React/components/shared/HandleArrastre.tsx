/*
 * HandleArrastre
 * Botón de arrastre para mover paneles del dashboard
 * Se coloca en el SeccionEncabezado de cada panel
 */

import type {PanelId} from '../../hooks/useConfiguracionLayout';

interface HandleArrastreProps {
    panelId: PanelId;
    onMouseDown: (panelId: PanelId, evento: React.MouseEvent) => void;
    estaArrastrando: boolean;
}

export function HandleArrastre({panelId, onMouseDown, estaArrastrando}: HandleArrastreProps): JSX.Element {
    const manejarMouseDown = (evento: React.MouseEvent) => {
        onMouseDown(panelId, evento);
    };

    return (
        <button className={`handleArrastre ${estaArrastrando ? 'activo' : ''}`} onMouseDown={manejarMouseDown} title="Arrastrar para mover panel" type="button">
            <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
                <circle cx="2" cy="2" r="1.2" />
                <circle cx="2" cy="5" r="1.2" />
                <circle cx="2" cy="8" r="1.2" />
                <circle cx="5" cy="2" r="1.2" />
                <circle cx="5" cy="5" r="1.2" />
                <circle cx="5" cy="8" r="1.2" />
            </svg>
        </button>
    );
}
