/*
 * Componente: PanelLateral — Kamples (C86+C95+C111+C184)
 * Panel derecho ~30% que muestra detalle de sample, comentarios, sugerencias o mezclador.
 * Se renderiza condicionalmente dentro de LayoutPrincipal.
 * Solo activo en islas que habiliten el panel via panelLateralStore.
 * C184: Soporte para modo 'mezclador' + handle de resize.
 */

import { PanelDetalleSample } from '@app/components/feed/PanelDetalleSample';
import { PanelSugerencias } from '@app/components/feed/PanelSugerencias';
import { PanelColeccionSamples } from '@app/components/feed/PanelColeccionSamples';
/* PanelLibreria: sin uso temporal, pendiente reutilizacion en Explorador (C281) */
import { ErrorBoundaryMezclador } from '@mezclador/components/ErrorBoundaryMezclador';
import { MezcladorPanel } from '@mezclador/components/MezcladorPanel';
import { usePanelLateral } from '@app/hooks/usePanelLateral';
import '@app/styles/componentes/panelLateral.css';

export const PanelLateral = (): JSX.Element | null => {
    const {
        modo, sample, coleccionActiva, expandido, ancho, panelRef,
        esMezclador, mostrar, iniciarResize,
    } = usePanelLateral();

    if (!mostrar) return null;

    return (
        <aside
            className={`panelLateral${expandido ? ' panelLateralExpandido' : ''}`}
            ref={panelRef}
            style={expandido ? { width: '100%' } : { width: `${ancho}px` }}
        >
            {/* Handle de resize — borde izquierdo (oculto cuando expandido) */}
            {!expandido && (
                <div
                    className="panelLateralResizeHandle"
                    onMouseDown={iniciarResize}
                />
            )}

            <div className={`panelLateralInterno ${esMezclador ? 'panelLateralSinPadding' : ''}`}>
                {(modo === 'detalle' || modo === 'comentarios') && sample && (
                    <PanelDetalleSample sample={sample} />
                )}
                {modo === 'sugerencias' && sample && (
                    <PanelSugerencias sample={sample} />
                )}
                {modo === 'coleccion' && coleccionActiva && (
                    <PanelColeccionSamples coleccion={coleccionActiva} />
                )}
                {esMezclador && (
                    <ErrorBoundaryMezclador>
                        <MezcladorPanel />
                    </ErrorBoundaryMezclador>
                )}
            </div>
        </aside>
    );
};

export default PanelLateral;
