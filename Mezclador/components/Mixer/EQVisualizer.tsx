/*
 * EQVisualizer — Visualización de curva de EQ para un insert del mixer.
 * 3 bandas: Low, Mid, High con controles interactivos.
 * Canvas que dibuja la respuesta de frecuencia simplificada.
 */

import { useRef, useEffect, useCallback, useState } from 'react';
import type { BandaEQ } from '../../types/mezclador';

interface EQVisualizerProps {
    bandas: BandaEQ[];
    activo: boolean;
    onToggle: () => void;
    onCambioBanda: (indice: number, cambios: Partial<BandaEQ>) => void;
    ancho?: number;
    alto?: number;
}

const NOMBRES_BANDA = ['LOW', 'MID', 'HIGH'];
const COLORES_BANDA = ['#4fc3f7', '#81c784', '#ffb74d'];

/* Curva simplificada de una banda paramétrica */
function calcularRespuesta(
    freq: number,
    bandas: BandaEQ[]
): number {
    let gananciaTotal = 0;
    for (const banda of bandas) {
        const ratio = Math.log2(freq / banda.frecuencia);
        const ancho = banda.q > 0 ? 1 / banda.q : 4;
        const efecto = banda.ganancia * Math.exp(-0.5 * (ratio / ancho) ** 2);
        gananciaTotal += efecto;
    }
    return gananciaTotal;
}

export const EQVisualizer = ({
    bandas,
    activo,
    onToggle,
    onCambioBanda,
    ancho = 240,
    alto = 100,
}: EQVisualizerProps): JSX.Element => {
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
            /* Mapear x a frecuencia 20Hz - 20kHz (escala logarítmica) */
            const freq = 20 * Math.pow(1000, x / ancho);
            const db = calcularRespuesta(freq, bandas);
            /* Mapear dB a y: ±12dB -> 0..alto */
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

        /* Encontrar banda más cercana al click */
        let mejorIdx = -1;
        let mejorDist = 20; /* umbral px */
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

    return (
        <div className="eqVisualizer">
            <div className="eqVisualizerCabecera">
                <span>EQ</span>
                <button
                    className={`eqVisualizerToggle ${activo ? 'eqVisualizerToggleActivo' : ''}`}
                    onClick={onToggle}
                >
                    {activo ? 'ON' : 'OFF'}
                </button>
            </div>
            <canvas
                ref={canvasRef}
                width={ancho}
                height={alto}
                className="eqVisualizerCanvas"
                onMouseDown={alMouseDown}
                onMouseMove={alMouseMove}
                onMouseUp={alMouseUp}
                onMouseLeave={alMouseUp}
            />
            <div className="eqVisualizerBandas">
                {bandas.map((banda, i) => (
                    <div key={NOMBRES_BANDA[i]} className="eqVisualizerBanda" style={{ color: COLORES_BANDA[i] }}>
                        <span className="eqVisualizerBandaNombre">{NOMBRES_BANDA[i]}</span>
                        <span className="eqVisualizerBandaValor">{banda.frecuencia}Hz</span>
                        <span className="eqVisualizerBandaValor">{banda.ganancia > 0 ? '+' : ''}{banda.ganancia}dB</span>
                    </div>
                ))}
            </div>
        </div>
    );
};
