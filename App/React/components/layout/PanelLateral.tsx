/*
 * Componente: PanelLateral — Kamples (C86+C95+C111+C184)
 * Panel derecho ~30% que muestra detalle de sample, comentarios, sugerencias o mezclador.
 * Se renderiza condicionalmente dentro de LayoutPrincipal.
 * Solo activo en islas que habiliten el panel via panelLateralStore.
 * C184: Soporte para modo 'mezclador' + handle de resize.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePanelLateralStore } from '@app/stores/panelLateralStore';
import { PanelDetalleSample } from '@app/components/feed/PanelDetalleSample';
import { PanelSugerencias } from '@app/components/feed/PanelSugerencias';
import { crearLogger } from '@app/services/logger';
/* PanelLibreria: sin uso temporal, pendiente reutilizacion en Explorador (C281) */
import { ErrorBoundaryMezclador } from '@mezclador/components/ErrorBoundaryMezclador';
import { MezcladorPanel } from '@mezclador/components/MezcladorPanel';
import '@app/styles/componentes/panelLateral.css';

const LS_KEY_ANCHO = 'kamples:anchoPanelLateral';
const ANCHO_MIN = 280;
const ANCHO_MAX = 700;
const ANCHO_DEFAULT = 340;
const log = crearLogger('PanelLateral');

const leerAnchoGuardado = (): number => {
    try {
        const val = localStorage.getItem(LS_KEY_ANCHO);
        return val ? Math.max(ANCHO_MIN, Math.min(ANCHO_MAX, Number(val))) : ANCHO_DEFAULT;
    } catch (error) {
        log.warn('No se pudo leer ancho guardado del panel lateral', error);
        return ANCHO_DEFAULT;
    }
};

export const PanelLateral = (): JSX.Element | null => {
    const modo = usePanelLateralStore(s => s.modo);
    const sample = usePanelLateralStore(s => s.sample);
    const habilitado = usePanelLateralStore(s => s.habilitado);
    const expandido = usePanelLateralStore(s => s.expandido);
    const [ancho, setAncho] = useState(leerAnchoGuardado);
    const resizingRef = useRef(false);
    const panelRef = useRef<HTMLElement>(null);

    /* Determinar si el panel debe mostrarse */
    const esMezclador = modo === 'mezclador';
    const esModoConSample = (modo === 'detalle' || modo === 'comentarios' || modo === 'sugerencias') && sample;
    const mostrar = habilitado && modo && (esMezclador || esModoConSample);

    /* Inicio del resize con el handle */
    const iniciarResize = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        resizingRef.current = true;
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';

        const mover = (ev: MouseEvent) => {
            if (!resizingRef.current) return;
            const nuevoAncho = window.innerWidth - ev.clientX;
            const clamp = Math.max(ANCHO_MIN, Math.min(ANCHO_MAX, nuevoAncho));
            setAncho(clamp);
            document.documentElement.style.setProperty('--anchoPanelLateral', `${clamp}px`);
        };

        const soltar = () => {
            resizingRef.current = false;
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
            document.removeEventListener('mousemove', mover);
            document.removeEventListener('mouseup', soltar);
            /* Guardar en localStorage */
            try {
                localStorage.setItem(LS_KEY_ANCHO, String(ancho));
            } catch (error) {
                log.warn('No se pudo persistir ancho del panel lateral', error);
            }
        };

        document.addEventListener('mousemove', mover);
        document.addEventListener('mouseup', soltar);
    }, [ancho]);

    /* Aplicar ancho inicial al CSS */
    useEffect(() => {
        /* C241: si está expandido, la variable CSS no importa (width: 100%) */
        if (!expandido) {
            document.documentElement.style.setProperty('--anchoPanelLateral', `${ancho}px`);
        }
    }, [ancho, expandido]);

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
