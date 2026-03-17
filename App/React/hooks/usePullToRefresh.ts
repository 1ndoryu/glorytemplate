/*
 * Hook: usePullToRefresh — QL109
 * Pull-to-refresh nativo via touch events para mobile.
 *
 * Comportamiento:
 * - Se activa solo cuando el scroll esta en el top (scrollTop <= 5).
 * - El usuario arrastra hacia abajo; al superar el umbral, dispara refresco.
 * - Threshold alto (80px) y resistencia (0.4) evitan activacion accidental.
 * - El caller indica cuando termina el refresco para ocultar el indicador.
 */

import { useRef, useCallback, useState, useEffect } from 'react';

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
    const touchStartY = useRef(0);
    const arrastrando = useRef(false);
    const distanciaRef = useRef(0);
    const elementoRef = useRef<HTMLElement | null>(null);
    const refrescandoRef = useRef(false);
    const onRefrescarRef = useRef(onRefrescar);
    onRefrescarRef.current = onRefrescar;

    const contenedorRef = useCallback((nodo: HTMLElement | null) => {
        elementoRef.current = nodo;
    }, []);

    useEffect(() => {
        const el = elementoRef.current;
        if (!el || !habilitado) return;

        const alIniciarTouch = (e: TouchEvent) => {
            if (el.scrollTop > 5 || refrescandoRef.current) return;
            touchStartY.current = e.touches[0].clientY;
            arrastrando.current = true;
        };

        const alMoverTouch = (e: TouchEvent) => {
            if (!arrastrando.current) return;
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
        };
    }, [habilitado, umbral, resistencia]);

    return { contenedorRef, refrescando, distanciaArrastre };
}
