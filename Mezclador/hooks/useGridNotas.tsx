/*
 * useGridNotas — Lógica del grid principal del piano roll.
 * Store access, ResizeObserver, canvas grid, notas, interacción.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { usePianoRollStore } from '../stores/pianoRollStore';
import { useNotasStore } from '../stores/accionesNotas';
import { usePianoRollGrid } from './usePianoRollGrid';
import { usePianoRoll } from './usePianoRoll';
import { NotaRect } from '../components/PianoRoll/NotaRect';
import { ticksAPx, notaAPx, alturaTotal, anchoTotalCompases } from '../utils/pianoRollUtils';

interface UseGridNotasParams {
    totalCompases: number;
    numerador: number;
    notaHover: number | null;
}

export const useGridNotas = ({
    totalCompases,
    numerador,
    notaHover,
}: UseGridNotasParams) => {
    const patronId = usePianoRollStore(s => s.patronId);
    const canalId = usePianoRollStore(s => s.canalId);
    const vista = usePianoRollStore(s => s.vista);
    const notasSeleccionadas = usePianoRollStore(s => s.notasSeleccionadas);
    const notas = useNotasStore(s =>
        patronId && canalId ? s.obtenerNotas(patronId, canalId) : []
    );

    const contenedorRef = useRef<HTMLDivElement>(null);
    const [dimensiones, setDimensiones] = useState({ ancho: 800, alto: 400 });

    /* Medir contenedor */
    useEffect(() => {
        const el = contenedorRef.current;
        if (!el) return;

        const ro = new ResizeObserver(entries => {
            for (const entry of entries) {
                setDimensiones({
                    ancho: entry.contentRect.width,
                    alto: entry.contentRect.height,
                });
            }
        });

        ro.observe(el);
        setDimensiones({
            ancho: el.clientWidth,
            alto: el.clientHeight,
        });

        return () => ro.disconnect();
    }, []);

    /* Hook del canvas de fondo */
    const { canvasRef } = usePianoRollGrid({
        scrollX: vista.scrollX,
        scrollY: vista.scrollY,
        zoomX: vista.zoomX,
        zoomY: vista.zoomY,
        alturaNota: vista.alturaNota,
        anchoVisible: dimensiones.ancho,
        alturaVisible: dimensiones.alto,
        totalCompases,
        numerador,
    });

    /* Hook de interacción */
    const {
        handleGridMouseDown,
        handleNotaMouseDown,
        handleMouseMove,
        handleMouseUp,
        handleWheel,
        cursorGrid,
        marquee,
    } = usePianoRoll();

    /* Registrar listeners de document para drag */
    useEffect(() => {
        const gridEl = contenedorRef.current;
        if (!gridEl) return;

        const gridRect = gridEl.getBoundingClientRect();
        const moveHandler = (e: MouseEvent) => handleMouseMove(e, gridRect);
        const upHandler = () => handleMouseUp();

        document.addEventListener('mousemove', moveHandler);
        document.addEventListener('mouseup', upHandler);

        return () => {
            document.removeEventListener('mousemove', moveHandler);
            document.removeEventListener('mouseup', upHandler);
        };
    }, [handleMouseMove, handleMouseUp]);

    /* Tamano total del contenido */
    const altTotal = alturaTotal(vista.alturaNota, vista.zoomY);
    const anchoTotal = anchoTotalCompases(totalCompases + 2, numerador, vista.zoomX);

    /* Renderizar notas como divs posicionados */
    const notasRenderizadas = useMemo(() => {
        const altoPorNota = vista.alturaNota * vista.zoomY;

        return notas.map(nota => {
            const x = ticksAPx(nota.inicio, vista.zoomX) - vista.scrollX;
            const y = notaAPx(nota.nota, vista.alturaNota, vista.zoomY) - vista.scrollY;
            const ancho = ticksAPx(nota.duracion, vista.zoomX);

            /* Culling: no renderizar notas fuera del viewport */
            if (x + ancho < -10 || x > dimensiones.ancho + 10) return null;
            if (y + altoPorNota < -10 || y > dimensiones.alto + 10) return null;

            const seleccionada = notasSeleccionadas.has(nota.id);

            return (
                <NotaRect
                    key={nota.id}
                    nota={nota}
                    x={x}
                    y={y}
                    ancho={ancho}
                    alto={altoPorNota}
                    seleccionada={seleccionada}
                    onMouseDown={handleNotaMouseDown}
                />
            );
        }).filter(Boolean);
    }, [notas, vista, dimensiones, notasSeleccionadas, handleNotaMouseDown]);

    /* Highlight de fila hover */
    const hoverStyle = useMemo(() => {
        if (notaHover == null) return null;
        const y = notaAPx(notaHover, vista.alturaNota, vista.zoomY) - vista.scrollY;
        const alto = vista.alturaNota * vista.zoomY;
        return {
            position: 'absolute' as const,
            left: 0,
            top: y,
            width: '100%',
            height: alto,
            background: 'rgba(100, 150, 255, 0.06)',
            pointerEvents: 'none' as const,
            zIndex: 0,
        };
    }, [notaHover, vista]);

    return {
        contenedorRef,
        canvasRef,
        handleGridMouseDown,
        handleWheel,
        cursorGrid,
        marquee,
        altTotal,
        anchoTotal,
        notasRenderizadas,
        hoverStyle,
    };
};
