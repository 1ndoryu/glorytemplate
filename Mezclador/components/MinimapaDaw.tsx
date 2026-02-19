/*
 * MinimapaDaw — Minimapa estilo FL Studio para controlar scroll y zoom.
 * C285: Barra horizontal de 34px que muestra vista pajarito de todas las pistas.
 * - Drag cuerpo del viewport: scroll horizontal
 * - Drag bordes del viewport: zoom (cambiar compases visibles)
 * - Click fuera del viewport: saltar a esa posición
 * - Wheel: zoom in/out
 * Reemplaza los botones +/- zoom de ControlesMezclador.
 */

import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { useMezcladorStore } from '../stores/mezcladorStore';
import { COMPASES_VISIBLES_MIN, ZOOM_MIN } from '../types/mezclador';

interface MinimapaDawProps {
    timelineRef: React.RefObject<HTMLDivElement>;
}

/* Ancho del handle de resize en el viewport del minimapa */
const HANDLE_PX = 6;

export const MinimapaDaw = ({ timelineRef }: MinimapaDawProps): JSX.Element => {
    const pistas = useMezcladorStore(s => s.pistas);
    const nivelZoom = useMezcladorStore(s => s.nivelZoom);
    const setNivelZoom = useMezcladorStore(s => s.setNivelZoom);
    const totalExtendido = useMezcladorStore(s => s.obtenerTotalExtendido());
    const minimapaRef = useRef<HTMLDivElement>(null);

    /* Estado del viewport — fracción del total */
    const [scrollFrac, setScrollFrac] = useState(0);

    /* Viewport = 1 / nivelZoom del total */
    const viewportFrac = Math.min(1, 1 / nivelZoom);

    /* Calcular posición del viewport como fracción (0-1) */
    const viewportLeft = scrollFrac * (1 - viewportFrac);

    /* Sincronizar scroll del timeline con el minimapa */
    useEffect(() => {
        const el = timelineRef.current;
        if (!el) return;

        const sync = () => {
            const maxScroll = el.scrollWidth - el.clientWidth;
            if (maxScroll <= 0) { setScrollFrac(0); return; }
            setScrollFrac(el.scrollLeft / maxScroll);
        };

        sync();
        el.addEventListener('scroll', sync);
        return () => el.removeEventListener('scroll', sync);
    }, [timelineRef, nivelZoom]);

    /* Bloques simplificados para dibujar — memoizar para evitar recalcular */
    const bloquesSimplificados = useMemo(() => {
        const resultado: Array<{
            left: number;
            width: number;
            top: number;
            height: number;
            color: string;
        }> = [];

        const totalPistas = pistas.length;
        /* Cada pista ocupa un porcentaje del alto (excluyendo padding) */
        const alturaPista = totalPistas > 0 ? 100 / totalPistas : 100;

        for (let i = 0; i < pistas.length; i++) {
            const pista = pistas[i];
            for (const bloque of pista.bloques) {
                resultado.push({
                    left: (bloque.compasInicio / totalExtendido) * 100,
                    width: Math.max(0.5, (bloque.duracionCompases / totalExtendido) * 100),
                    top: (i / totalPistas) * 100,
                    height: alturaPista,
                    color: bloque.color || 'var(--acento)',
                });
            }
        }
        return resultado;
    }, [pistas, totalExtendido]);

    /* Max zoom dinámico */
    const maxZoom = Math.max(4, totalExtendido / COMPASES_VISIBLES_MIN);

    /* Scroll del timeline programáticamente */
    const scrollTimeline = useCallback((fraccion: number) => {
        const el = timelineRef.current;
        if (!el) return;
        const maxScroll = el.scrollWidth - el.clientWidth;
        if (maxScroll <= 0) return;
        el.scrollLeft = fraccion * maxScroll;
    }, [timelineRef]);

    /* Estado de drag */
    const dragInfo = useRef<{
        tipo: 'mover' | 'izquierda' | 'derecha';
        startX: number;
        startScrollFrac: number;
        startViewportFrac: number;
        startNivelZoom: number;
        minimapaAncho: number;
    } | null>(null);

    /* Iniciar drag del viewport (mover o resize) */
    const iniciarDrag = useCallback((tipo: 'mover' | 'izquierda' | 'derecha', e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        const minimapaAncho = minimapaRef.current?.clientWidth ?? 1;
        dragInfo.current = {
            tipo,
            startX: e.clientX,
            startScrollFrac: scrollFrac,
            startViewportFrac: viewportFrac,
            startNivelZoom: nivelZoom,
            minimapaAncho,
        };
    }, [scrollFrac, viewportFrac, nivelZoom]);

    /* Handlers globales de drag */
    useEffect(() => {
        const mover = (e: MouseEvent) => {
            const info = dragInfo.current;
            if (!info) return;

            const deltaX = e.clientX - info.startX;
            const deltaFrac = deltaX / info.minimapaAncho;

            if (info.tipo === 'mover') {
                /* Mover viewport — ajustar scroll */
                const maxMovimiento = 1 - info.startViewportFrac;
                const nuevoScroll = Math.max(0, Math.min(1, info.startScrollFrac + deltaFrac / maxMovimiento));
                setScrollFrac(nuevoScroll);
                scrollTimeline(nuevoScroll);
            } else if (info.tipo === 'derecha') {
                /* Resize derecha — cambiar zoom */
                const nuevoViewportFrac = Math.max(
                    1 / maxZoom,
                    Math.min(1, info.startViewportFrac + deltaFrac)
                );
                const nuevoZoom = Math.max(ZOOM_MIN, Math.min(maxZoom, 1 / nuevoViewportFrac));
                setNivelZoom(nuevoZoom);
            } else if (info.tipo === 'izquierda') {
                /* Resize izquierda — cambiar zoom + scroll */
                const nuevoViewportFrac = Math.max(
                    1 / maxZoom,
                    Math.min(1, info.startViewportFrac - deltaFrac)
                );
                const nuevoZoom = Math.max(ZOOM_MIN, Math.min(maxZoom, 1 / nuevoViewportFrac));
                setNivelZoom(nuevoZoom);

                /* Ajustar scroll para que el borde derecho se mantenga fijo */
                const rightEdge = info.startScrollFrac * (1 - info.startViewportFrac) + info.startViewportFrac;
                const newLeft = rightEdge - (1 / nuevoZoom);
                const newMaxMov = 1 - (1 / nuevoZoom);
                if (newMaxMov > 0) {
                    const nuevoScroll = Math.max(0, Math.min(1, newLeft / newMaxMov));
                    setScrollFrac(nuevoScroll);
                    scrollTimeline(nuevoScroll);
                }
            }
        };

        const soltar = () => {
            dragInfo.current = null;
        };

        document.addEventListener('mousemove', mover);
        document.addEventListener('mouseup', soltar);
        return () => {
            document.removeEventListener('mousemove', mover);
            document.removeEventListener('mouseup', soltar);
        };
    }, [scrollTimeline, setNivelZoom, maxZoom]);

    /* Click fuera del viewport — saltar a esa posición */
    const alClickMinimapa = useCallback((e: React.MouseEvent) => {
        if (dragInfo.current) return;
        const rect = minimapaRef.current?.getBoundingClientRect();
        if (!rect) return;

        const clickFrac = (e.clientX - rect.left) / rect.width;
        /* Centrar el viewport en la posición del click */
        const nuevoLeft = clickFrac - viewportFrac / 2;
        const maxMov = 1 - viewportFrac;
        if (maxMov <= 0) return;
        const nuevoScroll = Math.max(0, Math.min(1, nuevoLeft / maxMov));
        setScrollFrac(nuevoScroll);
        scrollTimeline(nuevoScroll);
    }, [viewportFrac, scrollTimeline]);

    /* Wheel — zoom in/out centrado en la posición del cursor */
    const alWheel = useCallback((e: React.WheelEvent) => {
        e.preventDefault();
        const factor = e.deltaY > 0 ? 0.9 : 1.1;
        const nuevoZoom = Math.max(ZOOM_MIN, Math.min(maxZoom, nivelZoom * factor));
        setNivelZoom(nuevoZoom);
    }, [nivelZoom, setNivelZoom, maxZoom]);

    /* Info de compases visibles */
    const compasesVisibles = totalExtendido / nivelZoom;

    return (
        <div
            ref={minimapaRef}
            className="minimapaDaw"
            onClick={alClickMinimapa}
            onWheel={alWheel}
        >
            {/* Bloques simplificados — representación visual */}
            {bloquesSimplificados.map((b, i) => (
                <div
                    key={i}
                    className="minimapaBloque"
                    style={{
                        left: `${b.left}%`,
                        width: `${b.width}%`,
                        top: `${b.top}%`,
                        height: `${b.height}%`,
                        backgroundColor: b.color,
                    }}
                />
            ))}

            {/* Viewport — zona visible */}
            <div
                className="minimapaViewport"
                style={{
                    left: `${viewportLeft * 100}%`,
                    width: `${viewportFrac * 100}%`,
                }}
                onMouseDown={(e) => {
                    /* Determinar si el click es en un handle o en el cuerpo */
                    const rect = e.currentTarget.getBoundingClientRect();
                    const relX = e.clientX - rect.left;

                    if (relX <= HANDLE_PX) {
                        iniciarDrag('izquierda', e);
                    } else if (relX >= rect.width - HANDLE_PX) {
                        iniciarDrag('derecha', e);
                    } else {
                        iniciarDrag('mover', e);
                    }
                }}
            >
                {/* Handles visuales de resize */}
                <div className="minimapaHandleIzq" />
                <div className="minimapaHandleDer" />
            </div>

            {/* Info de zoom (compases visibles) */}
            <span className="minimapaZoomInfo">
                {compasesVisibles < 1
                    ? `${compasesVisibles.toFixed(1)} comp.`
                    : `${Math.round(compasesVisibles)} comp.`
                }
            </span>
        </div>
    );
};
