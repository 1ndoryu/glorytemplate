/*
 * MinimapaDaw — Minimapa estilo FL Studio para controlar scroll y zoom.
 * C285: Barra horizontal de 34px que muestra vista pajarito de todas las pistas.
 * C299: Fix movimiento rígido — lectura directa del DOM para evitar stale closures,
 * desactivar sync durante drag, mantener viewport fijo durante resize.
 * C309: Eliminada rigidez residual — manipulación directa del DOM durante drag,
 * throttling con requestAnimationFrame, React state solo se sincroniza al soltar.
 */

import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { useMezcladorStore } from '../stores/mezcladorStore';
import { COMPASES_VISIBLES_MIN, ZOOM_MIN } from '../types/mezclador';

interface MinimapaDawProps {
    timelineRef: React.RefObject<HTMLDivElement>;
}

const HANDLE_PX = 6;

/* Leer posición real del scroll como fracción 0-1 */
const leerScrollFracDOM = (el: HTMLDivElement | null): number => {
    if (!el) return 0;
    const maxScroll = el.scrollWidth - el.clientWidth;
    if (maxScroll <= 0) return 0;
    return el.scrollLeft / maxScroll;
};

export const MinimapaDaw = ({ timelineRef }: MinimapaDawProps): JSX.Element => {
    const pistas = useMezcladorStore(s => s.pistas);
    const nivelZoom = useMezcladorStore(s => s.nivelZoom);
    const setNivelZoom = useMezcladorStore(s => s.setNivelZoom);
    const totalExtendido = useMezcladorStore(s => s.obtenerTotalExtendido());
    const minimapaRef = useRef<HTMLDivElement>(null);
    const viewportRef = useRef<HTMLDivElement>(null);

    const [scrollFrac, setScrollFrac] = useState(0);
    const viewportFrac = Math.min(1, 1 / nivelZoom);
    const viewportLeft = scrollFrac * (1 - viewportFrac);

    /*
     * Refs para drag sin re-renders.
     * dragInfo: datos de inicio del drag.
     * rafId: ID del requestAnimationFrame pendiente.
     * pendingDrag: último estado calculado durante drag (scroll + zoom opcional).
     */
    const dragInfo = useRef<{
        tipo: 'mover' | 'izquierda' | 'derecha';
        startX: number;
        startScrollFrac: number;
        startViewportLeft: number;
        startViewportFrac: number;
        startNivelZoom: number;
        minimapaAncho: number;
    } | null>(null);
    const rafId = useRef<number | null>(null);
    const pendingDrag = useRef<{ scrollFrac: number; zoom?: number } | null>(null);

    /* Sincronizar scroll del timeline — solo cuando NO hay drag activo */
    useEffect(() => {
        const el = timelineRef.current;
        if (!el) return;

        const sync = () => {
            if (dragInfo.current) return;
            setScrollFrac(leerScrollFracDOM(el));
        };

        sync();
        el.addEventListener('scroll', sync);
        return () => el.removeEventListener('scroll', sync);
    }, [timelineRef, nivelZoom]);

    /* Bloques simplificados para dibujar */
    const bloquesSimplificados = useMemo(() => {
        const resultado: Array<{
            left: number;
            width: number;
            top: number;
            height: number;
            color: string;
        }> = [];

        const totalPistas = pistas.length;
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

    const maxZoom = Math.max(4, totalExtendido / COMPASES_VISIBLES_MIN);

    /* Aplicar scroll al timeline */
    const scrollTimeline = useCallback((fraccion: number) => {
        const el = timelineRef.current;
        if (!el) return;
        const maxScroll = el.scrollWidth - el.clientWidth;
        if (maxScroll <= 0) return;
        el.scrollLeft = fraccion * maxScroll;
    }, [timelineRef]);

    /*
     * Actualizar viewport directamente en el DOM sin React re-render.
     * Esto elimina la rigidez durante drag porque evita el ciclo:
     * setState → reconciliación → paint.
     */
    const actualizarViewportDOM = useCallback((vLeft: number, vFrac: number) => {
        const el = viewportRef.current;
        if (!el) return;
        el.style.left = `${vLeft * 100}%`;
        el.style.width = `${vFrac * 100}%`;
    }, []);

    /* Iniciar drag — lee siempre del DOM para evitar stale closures */
    const iniciarDrag = useCallback((tipo: 'mover' | 'izquierda' | 'derecha', e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        const minimapaAncho = minimapaRef.current?.clientWidth ?? 1;
        const realScrollFrac = leerScrollFracDOM(timelineRef.current);
        const vFrac = Math.min(1, 1 / nivelZoom);
        const vLeft = realScrollFrac * (1 - vFrac);

        dragInfo.current = {
            tipo,
            startX: e.clientX,
            startScrollFrac: realScrollFrac,
            startViewportLeft: vLeft,
            startViewportFrac: vFrac,
            startNivelZoom: nivelZoom,
            minimapaAncho,
        };

        /* Cancelar cualquier rAF pendiente al iniciar nuevo drag */
        if (rafId.current) {
            cancelAnimationFrame(rafId.current);
            rafId.current = null;
        }
        pendingDrag.current = null;
    }, [timelineRef, nivelZoom]);

    /*
     * Handlers globales de drag.
     * C309: El viewport se actualiza directamente en el DOM (instantáneo).
     * setNivelZoom y setScrollFrac se throttlean con rAF para evitar
     * cascadas de re-renders que causan rigidez.
     */
    useEffect(() => {
        const mover = (e: MouseEvent) => {
            const info = dragInfo.current;
            if (!info) return;

            const deltaX = e.clientX - info.startX;
            const deltaFrac = deltaX / info.minimapaAncho;

            let nuevoScroll = 0;
            let nuevoZoom: number | undefined;
            let vFrac = info.startViewportFrac;
            let vLeft = 0;

            if (info.tipo === 'mover') {
                const nuevoLeft = info.startViewportLeft + deltaFrac;
                const maxMov = 1 - info.startViewportFrac;
                if (maxMov <= 0) return;
                nuevoScroll = Math.max(0, Math.min(1, nuevoLeft / maxMov));
                vLeft = nuevoScroll * (1 - vFrac);

            } else if (info.tipo === 'derecha') {
                const nuevoViewportFrac = Math.max(
                    1 / maxZoom,
                    Math.min(1, info.startViewportFrac + deltaFrac)
                );
                nuevoZoom = Math.max(ZOOM_MIN, Math.min(maxZoom, 1 / nuevoViewportFrac));
                vFrac = 1 / nuevoZoom;
                const maxMovNuevo = 1 - vFrac;
                if (maxMovNuevo > 0) {
                    nuevoScroll = Math.max(0, Math.min(1, info.startViewportLeft / maxMovNuevo));
                } else {
                    nuevoScroll = 0;
                }
                vLeft = nuevoScroll * (1 - vFrac);

            } else if (info.tipo === 'izquierda') {
                const nuevoViewportFrac = Math.max(
                    1 / maxZoom,
                    Math.min(1, info.startViewportFrac - deltaFrac)
                );
                nuevoZoom = Math.max(ZOOM_MIN, Math.min(maxZoom, 1 / nuevoViewportFrac));
                vFrac = 1 / nuevoZoom;
                const rightEdge = info.startViewportLeft + info.startViewportFrac;
                const newLeft = rightEdge - vFrac;
                const maxMovNuevo = 1 - vFrac;
                if (maxMovNuevo > 0) {
                    nuevoScroll = Math.max(0, Math.min(1, newLeft / maxMovNuevo));
                } else {
                    nuevoScroll = 0;
                }
                vLeft = nuevoScroll * (1 - vFrac);
            }

            /* Actualización inmediata del viewport en el DOM — sin React */
            actualizarViewportDOM(vLeft, vFrac);

            /* Guardar estado pendiente para aplicar en rAF */
            pendingDrag.current = { scrollFrac: nuevoScroll, zoom: nuevoZoom };

            /* Throttle con rAF: React state + scroll del timeline */
            if (!rafId.current) {
                rafId.current = requestAnimationFrame(() => {
                    rafId.current = null;
                    const pending = pendingDrag.current;
                    if (!pending) return;
                    if (pending.zoom !== undefined) setNivelZoom(pending.zoom);
                    scrollTimeline(pending.scrollFrac);
                });
            }
        };

        const soltar = () => {
            if (!dragInfo.current) return;

            /* Cancelar rAF pendiente */
            if (rafId.current) {
                cancelAnimationFrame(rafId.current);
                rafId.current = null;
            }

            /* Aplicar último estado pendiente */
            const pending = pendingDrag.current;
            if (pending) {
                if (pending.zoom !== undefined) setNivelZoom(pending.zoom);
                scrollTimeline(pending.scrollFrac);
            }

            /* Sincronizar estado final desde DOM */
            const realFrac = leerScrollFracDOM(timelineRef.current);
            setScrollFrac(realFrac);

            pendingDrag.current = null;
            dragInfo.current = null;
        };

        document.addEventListener('mousemove', mover);
        document.addEventListener('mouseup', soltar);
        return () => {
            document.removeEventListener('mousemove', mover);
            document.removeEventListener('mouseup', soltar);
            if (rafId.current) {
                cancelAnimationFrame(rafId.current);
                rafId.current = null;
            }
        };
    }, [scrollTimeline, setNivelZoom, maxZoom, timelineRef, actualizarViewportDOM]);

    /* Click fuera del viewport — saltar a esa posición */
    const alClickMinimapa = useCallback((e: React.MouseEvent) => {
        if (dragInfo.current) return;
        const rect = minimapaRef.current?.getBoundingClientRect();
        if (!rect) return;

        const clickFrac = (e.clientX - rect.left) / rect.width;
        const maxMov = 1 - viewportFrac;
        if (maxMov <= 0) return;
        const nuevoLeft = clickFrac - viewportFrac / 2;
        const nuevoScroll = Math.max(0, Math.min(1, nuevoLeft / maxMov));
        setScrollFrac(nuevoScroll);
        scrollTimeline(nuevoScroll);
    }, [viewportFrac, scrollTimeline]);

    /* Wheel — zoom in/out */
    const alWheel = useCallback((e: React.WheelEvent) => {
        e.preventDefault();
        const factor = e.deltaY > 0 ? 0.9 : 1.1;
        const nuevoZoom = Math.max(ZOOM_MIN, Math.min(maxZoom, nivelZoom * factor));
        setNivelZoom(nuevoZoom);
    }, [nivelZoom, setNivelZoom, maxZoom]);

    const compasesVisibles = totalExtendido / nivelZoom;

    return (
        <div
            ref={minimapaRef}
            className="minimapaDaw"
            onClick={alClickMinimapa}
            onWheel={alWheel}
        >
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

            <div
                ref={viewportRef}
                className="minimapaViewport"
                style={{
                    left: `${viewportLeft * 100}%`,
                    width: `${viewportFrac * 100}%`,
                }}
                onMouseDown={(e) => {
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
                <div className="minimapaHandleIzq" />
                <div className="minimapaHandleDer" />
            </div>

            <span className="minimapaZoomInfo">
                {compasesVisibles < 1
                    ? `${compasesVisibles.toFixed(1)} comp.`
                    : `${Math.round(compasesVisibles)} comp.`
                }
            </span>
        </div>
    );
};
