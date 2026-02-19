/*
 * usePianoRollGrid — Hook para dibujar el grid de fondo del piano roll en canvas.
 * C310: Dibuja líneas horizontales (notas), verticales (beats/compases),
 * y colores de teclas negras. Se redibujar al cambiar scroll/zoom.
 */

import { useCallback, useEffect, useRef } from 'react';
import { PPQ } from '../types/pianoRoll';
import { esTeclaNegra, esNotaC, ticksAPx, notaAPx } from '../utils/pianoRollUtils';

interface UsePianoRollGridParams {
    scrollX: number;
    scrollY: number;
    zoomX: number;
    zoomY: number;
    alturaNota: number;
    anchoVisible: number;
    alturaVisible: number;
    totalCompases: number;
    numerador?: number;
}

export function usePianoRollGrid({
    scrollX,
    scrollY,
    zoomX,
    zoomY,
    alturaNota,
    anchoVisible,
    alturaVisible,
    totalCompases,
    numerador = 4,
}: UsePianoRollGridParams) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animRef = useRef<number>(0);

    const dibujar = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const dpr = window.devicePixelRatio || 1;
        canvas.width = anchoVisible * dpr;
        canvas.height = alturaVisible * dpr;
        canvas.style.width = `${anchoVisible}px`;
        canvas.style.height = `${alturaVisible}px`;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.scale(dpr, dpr);
        ctx.clearRect(0, 0, anchoVisible, alturaVisible);

        const altoPorNota = alturaNota * zoomY;
        const ticksPorCompas = PPQ * numerador;

        /* Rango de notas visibles */
        const notaSuperior = Math.min(127, 127 - Math.floor(scrollY / altoPorNota));
        const notaInferior = Math.max(0, notaSuperior - Math.ceil(alturaVisible / altoPorNota) - 1);

        /* --- Filas horizontales (notas) --- */
        for (let midi = notaSuperior; midi >= notaInferior; midi--) {
            const y = notaAPx(midi, alturaNota, zoomY) - scrollY;
            if (y > alturaVisible || y + altoPorNota < 0) continue;

            /* Fondo de tecla negra */
            if (esTeclaNegra(midi)) {
                ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
                ctx.fillRect(0, y, anchoVisible, altoPorNota);
            }

            /* Línea horizontal separadora */
            ctx.strokeStyle = esNotaC(midi) ? '#444' : '#1e1e38';
            ctx.lineWidth = esNotaC(midi) ? 1 : 0.5;
            ctx.beginPath();
            ctx.moveTo(0, y + altoPorNota);
            ctx.lineTo(anchoVisible, y + altoPorNota);
            ctx.stroke();
        }

        /* --- Líneas verticales (beats y compases) --- */
        for (let compas = 0; compas <= totalCompases + 1; compas++) {
            const tickInicio = compas * ticksPorCompas;
            const xCompas = ticksAPx(tickInicio, zoomX) - scrollX;

            if (xCompas > anchoVisible + 10) break;
            if (xCompas < -10) continue;

            /* Línea de compás (más visible) */
            ctx.strokeStyle = '#444';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(xCompas, 0);
            ctx.lineTo(xCompas, alturaVisible);
            ctx.stroke();

            /* Subdivisiones de beat */
            for (let beat = 1; beat < numerador; beat++) {
                const tickBeat = tickInicio + beat * PPQ;
                const xBeat = ticksAPx(tickBeat, zoomX) - scrollX;

                if (xBeat < 0 || xBeat > anchoVisible) continue;

                ctx.strokeStyle = '#252540';
                ctx.lineWidth = 0.5;
                ctx.beginPath();
                ctx.moveTo(xBeat, 0);
                ctx.lineTo(xBeat, alturaVisible);
                ctx.stroke();
            }

            /* Subdivisiones de semicorchea si zoom es suficiente */
            if (zoomX >= 1.5) {
                for (let sub = 0; sub < numerador * 4; sub++) {
                    const tickSub = tickInicio + sub * (PPQ / 4);
                    const xSub = ticksAPx(tickSub, zoomX) - scrollX;

                    /* Saltar los que ya son beat lines */
                    if (sub % 4 === 0) continue;
                    if (xSub < 0 || xSub > anchoVisible) continue;

                    ctx.strokeStyle = '#1a1a30';
                    ctx.lineWidth = 0.3;
                    ctx.beginPath();
                    ctx.moveTo(xSub, 0);
                    ctx.lineTo(xSub, alturaVisible);
                    ctx.stroke();
                }
            }
        }
    }, [scrollX, scrollY, zoomX, zoomY, alturaNota, anchoVisible, alturaVisible, totalCompases, numerador]);

    /* Redibujar con requestAnimationFrame cuando cambian dependencias */
    useEffect(() => {
        cancelAnimationFrame(animRef.current);
        animRef.current = requestAnimationFrame(dibujar);
        return () => cancelAnimationFrame(animRef.current);
    }, [dibujar]);

    return { canvasRef };
}
