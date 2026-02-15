/*
 * Componente: WaveformPlayer
 * Renderizado de waveform con Canvas. Picos precalculados del servidor.
 * Interactivo: click-to-seek, hover muestra tiempo.
 * Colores: played vs unplayed controlados por props.
 */

import { useRef, useEffect, useCallback, useState, type MouseEvent } from 'react';
import '../../styles/componentes/waveform.css';

type TamanoWaveform = 'sm' | 'md' | 'lg' | 'xl';

interface WaveformPlayerProps {
    /* Array de picos normalizados [0..1]. Si null, genera placeholder */
    picos: number[] | null;
    /* Progreso de reproducción: 0..1 */
    progreso?: number;
    /* Duración total en segundos */
    duracion?: number;
    /* Callback al hacer click (posición 0..1) */
    onSeek?: (posicion: number) => void;
    tamano?: TamanoWaveform;
    colorNoReproducido?: string;
    colorReproducido?: string;
    colorFondo?: string;
    className?: string;
    interactivo?: boolean;
    anchoBarra?: number;
    espacioBarra?: number;
    simetrico?: boolean;
}

const ALTOS: Record<TamanoWaveform, number> = {
    sm: 32,
    md: 48,
    lg: 80,
    xl: 120,
};

const CLASES_TAMANO: Record<TamanoWaveform, string> = {
    sm: 'waveformSm',
    md: 'waveformMd',
    lg: 'waveformLg',
    xl: 'waveformXl',
};

/* Generar picos de placeholder para cuando no hay datos */
const generarPlaceholder = (cantidad: number): number[] => {
    const picos: number[] = [];
    for (let i = 0; i < cantidad; i++) {
        /* Forma de onda suave tipo senoidal con ruido */
        const base = Math.sin((i / cantidad) * Math.PI) * 0.6;
        const ruido = Math.random() * 0.3;
        picos.push(Math.max(0.05, Math.min(1, base + ruido)));
    }
    return picos;
};

/* Formatear segundos a mm:ss */
const formatearTiempo = (segundos: number): string => {
    const min = Math.floor(segundos / 60);
    const sec = Math.floor(segundos % 60);
    return `${min}:${sec.toString().padStart(2, '0')}`;
};

export const WaveformPlayer = ({
    picos,
    progreso = 0,
    duracion = 0,
    onSeek,
    tamano = 'md',
    colorNoReproducido = '#555555',
    colorReproducido = '#7c3aed',
    colorFondo = 'transparent',
    className = '',
    interactivo = true,
    anchoBarra,
    espacioBarra,
    simetrico = true,
}: WaveformPlayerProps): JSX.Element => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const contenedorRef = useRef<HTMLDivElement>(null);
    const [hoverX, setHoverX] = useState<number | null>(null);
    const datosPicos = useRef<number[]>(picos ?? generarPlaceholder(100));

    /* Actualizar picos si cambian */
    useEffect(() => {
        if (picos) {
            datosPicos.current = picos;
        }
    }, [picos]);

    /* Dibujar waveform en canvas */
    const dibujar = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const dpr = window.devicePixelRatio || 1;
        const anchoLogico = canvas.clientWidth;
        const altoLogico = ALTOS[tamano];

        /* Ajustar resolución del canvas para pantallas HiDPI */
        canvas.width = anchoLogico * dpr;
        canvas.height = altoLogico * dpr;
        ctx.scale(dpr, dpr);

        /* Limpiar */
        ctx.clearRect(0, 0, anchoLogico, altoLogico);

        /* Fondo */
        if (colorFondo !== 'transparent') {
            ctx.fillStyle = colorFondo;
            ctx.fillRect(0, 0, anchoLogico, altoLogico);
        }

        const datos = datosPicos.current;
        const numBarras = datos.length;
        const anchoBarraBase = anchoBarra ?? Math.max(1.5, anchoLogico / numBarras - 1);
        const gap = espacioBarra ?? Math.max(1, (anchoLogico / numBarras) * 0.2);
        const paso = anchoBarraBase + gap;
        const anchoDibujo = numBarras * paso - gap;
        const offsetX = Math.max(0, (anchoLogico - anchoDibujo) / 2);
        const mitad = altoLogico / 2;
        const puntoProgreso = progreso * anchoLogico;

        for (let i = 0; i < numBarras; i++) {
            const x = offsetX + i * paso;
            const altoPico = datos[i] * mitad * 0.9;

            /* Color según si ya se reprodujo */
            ctx.fillStyle = x < puntoProgreso ? colorReproducido : colorNoReproducido;

            if (simetrico) {
                /* Barra superior (espejo) */
                ctx.fillRect(x, mitad - altoPico, anchoBarraBase, altoPico);

                /* Barra inferior (espejo exacto) */
                ctx.fillRect(x, mitad, anchoBarraBase, altoPico);
            } else {
                const altoClasico = Math.max(2, datos[i] * (altoLogico - 2));
                ctx.fillRect(x, altoLogico - altoClasico, anchoBarraBase, altoClasico);
            }
        }

        /* Línea de hover */
        if (hoverX !== null && interactivo) {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(hoverX, 0);
            ctx.lineTo(hoverX, altoLogico);
            ctx.stroke();
        }
    }, [progreso, tamano, colorReproducido, colorNoReproducido, colorFondo, hoverX, interactivo, anchoBarra, espacioBarra, simetrico]);

    /* Redibujar cuando cambian las dependencias */
    useEffect(() => {
        dibujar();
    }, [dibujar]);

    /* Redibujar en resize */
    useEffect(() => {
        const observer = new ResizeObserver(() => dibujar());
        if (contenedorRef.current) {
            observer.observe(contenedorRef.current);
        }
        return () => observer.disconnect();
    }, [dibujar]);

    /* Calcular posición relativa del mouse */
    const calcularPosicion = (e: MouseEvent): number => {
        const rect = contenedorRef.current?.getBoundingClientRect();
        if (!rect) return 0;
        return Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    };

    const manejarClick = (e: MouseEvent) => {
        if (!interactivo || !onSeek) return;
        onSeek(calcularPosicion(e));
    };

    const manejarMouseMove = (e: MouseEvent) => {
        if (!interactivo) return;
        const rect = contenedorRef.current?.getBoundingClientRect();
        if (rect) {
            setHoverX(e.clientX - rect.left);
        }
    };

    const manejarMouseLeave = () => {
        setHoverX(null);
    };

    /* Tiempo en la posición del hover */
    const tiempoHover = hoverX !== null && contenedorRef.current
        ? formatearTiempo(
              (hoverX / contenedorRef.current.getBoundingClientRect().width) * duracion
          )
        : '';

    return (
        <div
            ref={contenedorRef}
            className={`contenedorWaveform ${CLASES_TAMANO[tamano]} ${className}`}
            onClick={manejarClick}
            onMouseMove={manejarMouseMove}
            onMouseLeave={manejarMouseLeave}
            role={interactivo ? 'slider' : undefined}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(progreso * 100)}
            aria-label="Progreso del audio"
        >
            <canvas ref={canvasRef} className="waveformCanvas" />
            {interactivo && hoverX !== null && (
                <span
                    className="waveformTiempoFlotante"
                    style={{ left: hoverX }}
                >
                    {tiempoHover}
                </span>
            )}
        </div>
    );
};

export default WaveformPlayer;
