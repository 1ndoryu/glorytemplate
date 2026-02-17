/*
 * Componente: PanelLateral — Kamples (C86+C95+C111)
 * Panel derecho ~30% que muestra detalle de sample, comentarios o sugerencias.
 * Se renderiza condicionalmente dentro de LayoutPrincipal.
 * Solo activo en islas que habiliten el panel via panelLateralStore.
 */

import { usePanelLateralStore } from '@app/stores/panelLateralStore';
import { PanelDetalleSample } from '@app/components/feed/PanelDetalleSample';
import { PanelSugerencias } from '@app/components/feed/PanelSugerencias';
import '@app/styles/componentes/panelLateral.css';

export const PanelLateral = (): JSX.Element | null => {
    const { modo, sample, habilitado } = usePanelLateralStore();

    if (!habilitado || !modo || !sample) return null;

    return (
        <aside className="panelLateral">
            <div className="panelLateralInterno">
                {(modo === 'detalle' || modo === 'comentarios') && (
                    <PanelDetalleSample sample={sample} />
                )}
                {modo === 'sugerencias' && (
                    <PanelSugerencias sample={sample} />
                )}
            </div>
        </aside>
    );
};

export default PanelLateral;
