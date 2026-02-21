/*
 * useEQVisualizer — Lógica del visualizador de EQ (canvas + drag bandas).
 * Dibuja curva de respuesta de frecuencia y puntos de control interactivos.
 */

import { useRef, useEffect, useCallback, useState } from 'react';
import type { BandaEQ } from '../types/mezclador';

export const COLORES_BANDA = ['#4fc3f7', '#81c784', '#ffb74d'];
export const NOMBRES_BANDA = ['LOW', 'MID', 'HIGH'];

/* Curva simplificada de una banda paramétrica */
function calcularRespuesta(freq: number, bandas: BandaEQ[]): number {
    let gananciaTotal = 0;
    for (const banda of bandas) {
        const ratio = Math.log2(freq / banda.frecuencia);
        const ancho = banda.q > 0 ? 1 / banda.q : 4;
        const efecto = banda.ganancia * Math.exp(-0.5 * (ratio / ancho) ** 2);
        gananciaTotal += efecto;
    }
    return gananciaTotal;
}

interface UseEQVisualizerParams {
    bandas: BandaEQ[];
    activo: boolean;
    onCambioBanda: (indice: number, cambios: Partial<BandaEQ>) => void;
    ancho: number;
    alto: number;
}

export const useEQVisualizer = ({
    bandas, activo, onCambioBanda, ancho, alto,
}: UseEQVisualizerParams) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [bandaArrastrada, setBandaArrastrada] = useState<number | null>(null);

    /* Dibujar la curva */
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, ancho, alto);

        /* Fondo grid */
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 0.5;
        const centro = alto / 2;
        for (let y = 0; y < alto; y += alto / 4) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(ancho, y);
            ctx.stroke();
        }

        if (!activo) {
            /* Línea plana si EQ desactivado */
            ctx.strokeStyle = '#555';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(0, centro);
            ctx.lineTo(ancho, centro);
            ctx.stroke();
            return;
        }

        /* Curva combinada */
        ctx.strokeStyle = '#4fc3f7';
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let x = 0; x < ancho; x++) {
            const freq = 20 * Math.pow(1000, x / ancho);
            const db = calcularRespuesta(freq, bandas);
            const y = centro - (db / 12) * centro;
            if (x === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();

        /* Puntos de control de bandas */
        bandas.forEach((banda, i) => {
            const bx = (Math.log2(banda.frecuencia / 20) / Math.log2(1000)) * ancho;
            const by = centro - (banda.ganancia / 12) * centro;
            ctx.fillStyle = COLORES_BANDA[i];
            ctx.beginPath();
            ctx.arc(bx, by, 5, 0, Math.PI * 2);
            ctx.fill();
        });
    }, [bandas, activo, ancho, alto]);

    /* Drag para editar bandas */
    const alMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!activo) return;
        const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;

        let mejorIdx = -1;
        let mejorDist = 20;
        bandas.forEach((banda, i) => {
            const bx = (Math.log2(banda.frecuencia / 20) / Math.log2(1000)) * ancho;
            const centro = alto / 2;
            const by = centro - (banda.ganancia / 12) * centro;
            const dist = Math.hypot(mx - bx, my - by);
            if (dist < mejorDist) {
                mejorDist = dist;
                mejorIdx = i;
            }
        });

        if (mejorIdx >= 0) {
            setBandaArrastrada(mejorIdx);
        }
    }, [bandas, activo, ancho, alto]);

    const alMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
        if (bandaArrastrada === null || !activo) return;
        const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;

        const freq = 20 * Math.pow(1000, Math.max(0, Math.min(1, mx / ancho)));
        const centro = alto / 2;
        const ganancia = -((my - centro) / centro) * 12;

        onCambioBanda(bandaArrastrada, {
            frecuencia: Math.round(freq),
            ganancia: Math.round(Math.max(-12, Math.min(12, ganancia)) * 10) / 10,
        });
    }, [bandaArrastrada, activo, ancho, alto, onCambioBanda]);

    const alMouseUp = useCallback(() => setBandaArrastrada(null), []);

    return {
        canvasRef,
        alMouseDown,
        alMouseMove,
        alMouseUp,
    };
};
