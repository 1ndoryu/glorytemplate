/*
 * Hook: usePanelLateral
 * Lógica extraída de PanelLateral (SRP).
 * Gestiona store, resize con handle, persistencia de ancho en localStorage.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePanelLateralStore } from '@app/stores/panelLateralStore';
import { useReproductorStore } from '@app/stores/reproductorStore';
import { crearLogger } from '@app/services/logger';

const LS_KEY_ANCHO = 'kamples:anchoPanelLateral';
const ANCHO_MIN = 280;
const ANCHO_MAX = 500;
const ANCHO_DEFAULT = 360;
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

export const usePanelLateral = () => {
    const modo = usePanelLateralStore(s => s.modo);
    const sample = usePanelLateralStore(s => s.sample);
    const coleccionActiva = usePanelLateralStore(s => s.coleccionActiva);
    const habilitado = usePanelLateralStore(s => s.habilitado);
    const expandido = usePanelLateralStore(s => s.expandido);
    const [ancho, setAncho] = useState(leerAnchoGuardado);
    const resizingRef = useRef(false);
    const panelRef = useRef<HTMLElement>(null);

    /* Determinar si el panel debe mostrarse */
    const esMezclador = modo === 'mezclador';
    const esModoConSample = (modo === 'detalle' || modo === 'comentarios' || modo === 'sugerencias') && sample;
    /* [183A-54] Soporte para modo colección */
    const esModoColeccion = modo === 'coleccion' && coleccionActiva;
    const mostrar = habilitado && modo && (esMezclador || esModoConSample || esModoColeccion);

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

    /*
     * QQ68: Sincronizar panel lateral con el reproductor.
     * Si el panel está abierto en modo detalle o comentarios y el usuario
     * reproduce un sample diferente, actualizar el panel para mostrar el nuevo sample.
     */
    const sampleReproduciendo = useReproductorStore(s => s.sampleActual);
    const sampleIdPanelRef = useRef<number | null>(null);

    useEffect(() => {
        sampleIdPanelRef.current = sample?.id ?? null;
    }, [sample]);

    useEffect(() => {
        if (!sampleReproduciendo) return;
        if (!habilitado) return;
        const modoActual = usePanelLateralStore.getState().modo;
        if (modoActual !== 'detalle' && modoActual !== 'comentarios') return;
        if (sampleReproduciendo.id === sampleIdPanelRef.current) return;
        usePanelLateralStore.getState().abrirDetalle(sampleReproduciendo);
    }, [sampleReproduciendo, habilitado]);

    return {
        modo,
        sample,
        coleccionActiva,
        expandido,
        ancho,
        panelRef,
        esMezclador,
        mostrar,
        iniciarResize,
    };
};
