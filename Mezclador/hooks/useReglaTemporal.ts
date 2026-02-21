/*
 * useReglaTemporal — Lógica de la regla temporal del Piano Roll.
 * Dibuja compases y subdivisiones de beat en canvas. Click para posicionar.
 */

import { useRef, useEffect, useCallback } from 'react';
import { PPQ } from '../types/pianoRoll';
import { ticksAPx } from '../utils/pianoRollUtils';

interface UseReglaTemporalParams {
    scrollX: number;
    zoomX: number;
    anchoVisible: number;
    totalCompases: number;
    numerador: number;
    onClick?: (tickPos: number) => void;
}

export const useReglaTemporal = ({
    scrollX, zoomX, anchoVisible, totalCompases, numerador, onClick,
}: UseReglaTemporalParams) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const dibujar = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const dpr = window.devicePixelRatio || 1;
        const ancho = anchoVisible;
        const alto = 22;

        canvas.width = ancho * dpr;
        canvas.height = alto * dpr;
        canvas.style.width = `${ancho}px`;
        canvas.style.height = `${alto}px`;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.scale(dpr, dpr);
        ctx.clearRect(0, 0, ancho, alto);

        const ticksPorCompas = PPQ * numerador;

        for (let compas = 0; compas <= totalCompases + 1; compas++) {
            const tickInicio = compas * ticksPorCompas;
            const xCompas = ticksAPx(tickInicio, zoomX) - scrollX;

            if (xCompas > ancho + 50) break;
            if (xCompas < -100) continue;

            /* Línea de compás */
            ctx.strokeStyle = '#555';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(xCompas, 12);
            ctx.lineTo(xCompas, alto);
            ctx.stroke();

            /* Número de compás */
            ctx.fillStyle = '#aaa';
            ctx.font = '10px -apple-system, sans-serif';
            ctx.fillText(`${compas + 1}`, xCompas + 3, 11);

            /* Subdivisiones de beat */
            for (let beat = 1; beat < numerador; beat++) {
                const tickBeat = tickInicio + beat * PPQ;
                const xBeat = ticksAPx(tickBeat, zoomX) - scrollX;

                if (xBeat < 0 || xBeat > ancho) continue;

                ctx.strokeStyle = '#333';
                ctx.lineWidth = 0.5;
                ctx.beginPath();
                ctx.moveTo(xBeat, 16);
                ctx.lineTo(xBeat, alto);
                ctx.stroke();
            }
        }
    }, [scrollX, zoomX, anchoVisible, totalCompases, numerador]);

    useEffect(() => {
        dibujar();
    }, [dibujar]);

    const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!onClick) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const px = e.clientX - rect.left + scrollX;
        const ticks = Math.round((px / (60 * zoomX)) * PPQ);
        onClick(Math.max(0, ticks));
    }, [onClick, scrollX, zoomX]);

    return {
        canvasRef,
        handleClick,
    };
};
