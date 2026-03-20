/*
 * Hook: usePullToRefresh — QL109
 * Pull-to-refresh via touch events para mobile.
 *
 * Comportamiento:
 * - Se activa solo cuando el scroll esta en el top (scrollTop <= 5).
 * - El usuario arrastra hacia abajo; al superar el umbral, dispara refresco.
 * - Threshold alto (80px) y resistencia (0.4) evitan activacion accidental.
 * - El caller indica cuando termina el refresco para ocultar el indicador.
 *
 * [2003A-26 fix definitivo] Dos bugs corregidos:
 * 1) obtenerScrollTop caia a window.scrollY (siempre 0 en SPA) cuando el div
 *    no tenia overflow-y: auto. Ahora busca el ancestro scrollable real
 *    (.areaContenido o .contenedorContenido) recorriendo padres del DOM.
 * 2) El useEffect usaba elementoRef (useRef) que no dispara re-render.
 *    Cuando FeedSamples hacia early return (skeleton) sin el ref, y luego
 *    montaba el div con ref, useEffect no re-ejecutaba porque sus deps
 *    [habilitado, umbral, resistencia] no cambiaban → listeners nunca se
 *    registraban. Ahora usa useState para el elemento, forzando re-ejecucion.
 */

import { useRef, useCallback, useState, useEffect } from 'react';

/* Busca el primer ancestro con overflow-y scrollable.
 * En Kamples, .areaContenido o .contenedorContenido son los scroll containers
 * reales, pero los refs de PTR apuntan a divs internos sin overflow. */
function buscarAncestroScrollable(el: HTMLElement): HTMLElement | null {
    let padre = el.parentElement;
    while (padre && padre !== document.documentElement) {
        const overflow = window.getComputedStyle(padre).overflowY;
        if (overflow === 'auto' || overflow === 'scroll' || overflow === 'overlay') {
            return padre;
        }
        padre = padre.parentElement;
    }
    return null;
}

interface PullToRefreshOpciones {
    /** Funcion async que ejecuta el refresco de datos */
    onRefrescar: () => Promise<void>;
    /** Habilitado solo en mobile (default: true) */
    habilitado?: boolean;
    /** Pixeles de arrastre necesarios para activar (default: 80) */
    umbral?: number;
    /** Resistencia al arrastre 0-1 (default: 0.4) */
    resistencia?: number;
}

interface PullToRefreshResultado {
    /** Ref para el contenedor scrollable */
    contenedorRef: React.RefCallback<HTMLElement>;
    /** True mientras se esta refrescando */
    refrescando: boolean;
    /** Distancia actual de arrastre (para animacion CSS) */
    distanciaArrastre: number;
}

export function usePullToRefresh({
    onRefrescar,
    habilitado = true,
    umbral = 80,
    resistencia = 0.4,
}: PullToRefreshOpciones): PullToRefreshResultado {
    const [refrescando, setRefrescando] = useState(false);
    const [distanciaArrastre, setDistanciaArrastre] = useState(0);
    /* useState en vez de useRef: cuando el componente hace early return sin ref
     * (ej: FeedSamples con skeleton) y luego monta el div, el cambio de null→div
     * dispara re-render y useEffect re-ejecuta para registrar listeners. */
    const [elemento, setElemento] = useState<HTMLElement | null>(null);
    const touchStartY = useRef(0);
    const arrastrando = useRef(false);
    const distanciaRef = useRef(0);
    const refrescandoRef = useRef(false);
    const onRefrescarRef = useRef(onRefrescar);
    const contenedorScrollRef = useRef<HTMLElement | null>(null);
    onRefrescarRef.current = onRefrescar;

    const contenedorRef = useCallback((nodo: HTMLElement | null) => {
        setElemento(nodo);
    }, []);

    useEffect(() => {
        const el = elemento;
        if (!el || !habilitado) return;

        /* Cachear el ancestro scrollable una vez en mount.
         * Si el propio elemento tiene overflow-y: auto/scroll, usarlo directamente.
         * Si no (caso comun: comunidadFeed, feedSamplesContenedor), buscar
         * el ancestro real (areaContenido, contenedorContenido). */
        const overflowEl = window.getComputedStyle(el).overflowY;
        const elTieneScroll = overflowEl === 'auto' || overflowEl === 'scroll' || overflowEl === 'overlay';

        if (!elTieneScroll) {
            contenedorScrollRef.current = buscarAncestroScrollable(el);
        } else {
            contenedorScrollRef.current = null;
        }

        const obtenerScroll = (): number => {
            if (elTieneScroll) return el.scrollTop;
            if (contenedorScrollRef.current) return contenedorScrollRef.current.scrollTop;
            return window.scrollY || document.documentElement.scrollTop || 0;
        };

        const alIniciarTouch = (e: TouchEvent) => {
            if (obtenerScroll() > 5 || refrescandoRef.current) return;
            touchStartY.current = e.touches[0].clientY;
            arrastrando.current = true;
        };

        const alMoverTouch = (e: TouchEvent) => {
            if (!arrastrando.current) return;
            if (obtenerScroll() > 5) {
                arrastrando.current = false;
                distanciaRef.current = 0;
                setDistanciaArrastre(0);
                return;
            }
            const delta = (e.touches[0].clientY - touchStartY.current) * resistencia;
            if (delta <= 0) {
                distanciaRef.current = 0;
                setDistanciaArrastre(0);
                return;
            }
            e.preventDefault();
            const dist = Math.min(delta, umbral * 1.5);
            distanciaRef.current = dist;
            setDistanciaArrastre(dist);
        };

        const alTerminarTouch = async () => {
            if (!arrastrando.current) return;
            arrastrando.current = false;

            if (distanciaRef.current >= umbral) {
                refrescandoRef.current = true;
                setRefrescando(true);
                distanciaRef.current = umbral * 0.5;
                setDistanciaArrastre(umbral * 0.5);
                try {
                    await onRefrescarRef.current();
                } finally {
                    refrescandoRef.current = false;
                    setRefrescando(false);
                    distanciaRef.current = 0;
                    setDistanciaArrastre(0);
                }
            } else {
                distanciaRef.current = 0;
                setDistanciaArrastre(0);
            }
        };

        el.addEventListener('touchstart', alIniciarTouch, { passive: true });
        el.addEventListener('touchmove', alMoverTouch, { passive: false });
        el.addEventListener('touchend', alTerminarTouch, { passive: true });
        el.addEventListener('touchcancel', alTerminarTouch, { passive: true });

        return () => {
            el.removeEventListener('touchstart', alIniciarTouch);
            el.removeEventListener('touchmove', alMoverTouch);
            el.removeEventListener('touchend', alTerminarTouch);
            el.removeEventListener('touchcancel', alTerminarTouch);
            contenedorScrollRef.current = null;
        };
    }, [elemento, habilitado, umbral, resistencia]);

    return { contenedorRef, refrescando, distanciaArrastre };
}
