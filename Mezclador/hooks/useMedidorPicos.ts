/*
 * useMedidorPicos — Lógica del peak meter estéreo L/R.
 * Loop rAF para leer AnalyserNodes del motorAudio y dibujar en canvas.
 */

import { useRef, useEffect, useCallback } from 'react';
import { motorAudio } from '../services/motorAudioService';

/* Convertir nivel 0-1 a color degradado (verde - amarillo - rojo) */
const colorNivel = (nivel: number): string => {
    if (nivel < 0.6) return '#22c55e';
    if (nivel < 0.85) return '#eab308';
    return '#ef4444';
};

export const useMedidorPicos = (activo: boolean) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const rafRef = useRef<number>(0);
    /* Suavizado: almacenar peak anterior para caída gradual */
    const peakAnterior = useRef({ l: 0, r: 0 });

    const dibujar = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const w = canvas.width;
        const h = canvas.height;
        ctx.clearRect(0, 0, w, h);

        const { izquierdo, derecho } = motorAudio.obtenerAnalyserEstereo();

        let peakL = 0;
        let peakR = 0;

        if (izquierdo) {
            const data = new Float32Array(izquierdo.frequencyBinCount);
            izquierdo.getFloatTimeDomainData(data);
            for (let i = 0; i < data.length; i++) {
                const abs = Math.abs(data[i]);
                if (abs > peakL) peakL = abs;
            }
        }

        if (derecho) {
            const data = new Float32Array(derecho.frequencyBinCount);
            derecho.getFloatTimeDomainData(data);
            for (let i = 0; i < data.length; i++) {
                const abs = Math.abs(data[i]);
                if (abs > peakR) peakR = abs;
            }
        }

        /* Suavizado con caída (decay) */
        const decay = 0.92;
        peakL = Math.max(peakL, peakAnterior.current.l * decay);
        peakR = Math.max(peakR, peakAnterior.current.r * decay);
        peakAnterior.current = { l: peakL, r: peakR };

        /* Clampar a 0-1 */
        peakL = Math.min(1, peakL);
        peakR = Math.min(1, peakR);

        /* Dibujar barras de abajo hacia arriba */
        const barAncho = Math.floor((w - 3) / 2);
        const margen = 1;

        /* Barra L */
        const alturaL = peakL * h;
        ctx.fillStyle = colorNivel(peakL);
        ctx.fillRect(0, h - alturaL, barAncho, alturaL);

        /* Barra R */
        const alturaR = peakR * h;
        ctx.fillStyle = colorNivel(peakR);
        ctx.fillRect(barAncho + margen, h - alturaR, barAncho, alturaR);

        /* Línea separadora central sutil */
        ctx.fillStyle = 'rgba(255,255,255,0.08)';
        ctx.fillRect(barAncho, 0, margen, h);

        rafRef.current = requestAnimationFrame(dibujar);
    }, []);

    useEffect(() => {
        if (!activo) return;
        rafRef.current = requestAnimationFrame(dibujar);
        return () => cancelAnimationFrame(rafRef.current);
    }, [activo, dibujar]);

    return { canvasRef };
};
