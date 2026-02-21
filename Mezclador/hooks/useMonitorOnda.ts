/*
 * useMonitorOnda — Lógica del visualizador de onda en tiempo real.
 * Canvas + requestAnimationFrame para dibujar waveform del master.
 */

import { useRef, useEffect, useCallback } from 'react';
import { motorAudio } from '../services/motorAudioService';

interface UseMonitorOndaParams {
    activo: boolean;
}

export const useMonitorOnda = ({ activo }: UseMonitorOndaParams) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const rafRef = useRef<number>(0);

    const dibujar = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const analyser = motorAudio.obtenerMasterAnalyser();
        const w = canvas.width;
        const h = canvas.height;

        ctx.clearRect(0, 0, w, h);

        if (!analyser) {
            rafRef.current = requestAnimationFrame(dibujar);
            return;
        }

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyser.getByteTimeDomainData(dataArray);

        /* Fondo transparente con linea central sutil */
        ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, h / 2);
        ctx.lineTo(w, h / 2);
        ctx.stroke();

        /* Dibujar waveform */
        ctx.strokeStyle = 'var(--acento, #22d3ee)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();

        const sliceWidth = w / bufferLength;
        let x = 0;
        for (let i = 0; i < bufferLength; i++) {
            const v = dataArray[i] / 128.0;
            const y = (v * h) / 2;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
            x += sliceWidth;
        }
        ctx.stroke();

        rafRef.current = requestAnimationFrame(dibujar);
    }, []);

    useEffect(() => {
        if (!activo) return;
        rafRef.current = requestAnimationFrame(dibujar);
        return () => cancelAnimationFrame(rafRef.current);
    }, [activo, dibujar]);

    return { canvasRef };
};
