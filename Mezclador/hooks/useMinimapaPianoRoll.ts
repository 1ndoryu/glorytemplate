/*
 * useMinimapaPianoRoll — Lógica del minimapa del Piano Roll.
 * Canvas con vista panorámica de notas. Click/drag para navegar.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePianoRollStore } from '../stores/pianoRollStore';
import { useNotasStore } from '../stores/accionesNotas';
import { PPQ, CONSTANTES_PIANO_ROLL } from '../types/pianoRoll';

interface UseMinimapaPianoRollParams {
    totalCompases: number;
    numerador: number;
    altura: number;
}

export const useMinimapaPianoRoll = ({
    totalCompases,
    numerador,
    altura,
}: UseMinimapaPianoRollParams) => {
    const patronId = usePianoRollStore(s => s.patronId);
    const canalId = usePianoRollStore(s => s.canalId);
    const vista = usePianoRollStore(s => s.vista);
    const setScrollX = usePianoRollStore(s => s.setScrollX);

    const notas = useNotasStore(s =>
        patronId && canalId ? s.obtenerNotas(patronId, canalId) : []
    );

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const contenedorRef = useRef<HTMLDivElement>(null);
    const [ancho, setAncho] = useState(800);
    const arrastrando = useRef(false);

    /* Medir ancho del contenedor */
    useEffect(() => {
        const el = contenedorRef.current;
        if (!el) return;
        const ro = new ResizeObserver(entries => {
            for (const entry of entries) {
                setAncho(entry.contentRect.width);
            }
        });
        ro.observe(el);
        setAncho(el.clientWidth);
        return () => ro.disconnect();
    }, []);

    /* Parámetros del rango total */
    const totalTicks = totalCompases * numerador * PPQ;
    const totalNotas = CONSTANTES_PIANO_ROLL.TOTAL_NOTAS;

    /* Dibujar minimapa */
    const dibujar = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const dpr = window.devicePixelRatio || 1;
        canvas.width = ancho * dpr;
        canvas.height = altura * dpr;
        canvas.style.width = `${ancho}px`;
        canvas.style.height = `${altura}px`;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.scale(dpr, dpr);

        /* Fondo */
        ctx.fillStyle = '#0e0e1e';
        ctx.fillRect(0, 0, ancho, altura);

        /* Dibujar notas como rectángulos pequeños */
        if (notas.length > 0) {
            ctx.fillStyle = 'rgba(100, 180, 255, 0.6)';

            for (const nota of notas) {
                if (nota.silenciada) continue;

                const x = (nota.inicio / totalTicks) * ancho;
                const w = Math.max(1, (nota.duracion / totalTicks) * ancho);
                /* Invertir eje Y: MIDI 127 arriba, 0 abajo */
                const y = ((127 - nota.nota) / totalNotas) * altura;
                const h = Math.max(1, altura / totalNotas);

                ctx.fillRect(x, y, w, h);
            }
        }

        /* Dibujar viewport rect */
        const anchoPixelTotal = totalTicks * (60 / PPQ) * vista.zoomX;
        const altoPixelTotal = totalNotas * vista.alturaNota * vista.zoomY;

        if (anchoPixelTotal > 0 && altoPixelTotal > 0) {
            const vx = (vista.scrollX / anchoPixelTotal) * ancho;
            const vy = (vista.scrollY / altoPixelTotal) * altura;
            const vancho = Math.min(ancho, (800 / anchoPixelTotal) * ancho);
            const valto = Math.min(altura, (400 / altoPixelTotal) * altura);

            ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.lineWidth = 1;
            ctx.strokeRect(vx, vy, vancho, valto);
        }

        /* Líneas de compás */
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 0.5;
        for (let c = 1; c < totalCompases; c++) {
            const x = (c / totalCompases) * ancho;
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, altura);
            ctx.stroke();
        }
    }, [ancho, altura, notas, totalTicks, totalNotas, vista]);

    useEffect(() => {
        const frame = requestAnimationFrame(dibujar);
        return () => cancelAnimationFrame(frame);
    }, [dibujar]);

    /* Click y drag para navegar */
    const navegarAClick = useCallback((clientX: number) => {
        const el = contenedorRef.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const xRel = (clientX - rect.left) / rect.width;

        const anchoPixelTotal = totalTicks * (60 / PPQ) * vista.zoomX;
        const nuevoScrollX = xRel * anchoPixelTotal - 400;
        setScrollX(Math.max(0, nuevoScrollX));
    }, [totalTicks, vista.zoomX, setScrollX]);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        arrastrando.current = true;
        navegarAClick(e.clientX);
    }, [navegarAClick]);

    useEffect(() => {
        const moveHandler = (e: MouseEvent) => {
            if (!arrastrando.current) return;
            navegarAClick(e.clientX);
        };
        const upHandler = () => {
            arrastrando.current = false;
        };
        document.addEventListener('mousemove', moveHandler);
        document.addEventListener('mouseup', upHandler);
        return () => {
            document.removeEventListener('mousemove', moveHandler);
            document.removeEventListener('mouseup', upHandler);
        };
    }, [navegarAClick]);

    return {
        contenedorRef,
        canvasRef,
        handleMouseDown,
    };
};
