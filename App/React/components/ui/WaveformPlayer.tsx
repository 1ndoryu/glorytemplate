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
    /* Callback al hacer click en cualquier parte de la waveform */
    onClick?: () => void;
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

/*
 * Remuestrear picos para adaptar la resolución al ancho disponible.
 * Más ancho = más barras. Menos ancho = menos barras.
 */
const remuestrearPicos = (datos: number[], barrasDeseadas: number): number[] => {
    const len = datos.length;
    if (len === 0) return [];
    if (barrasDeseadas >= len) return datos;
    
    const resultado: number[] = [];
    const factorGrupo = len / barrasDeseadas;
    
    for (let i = 0; i < barrasDeseadas; i++) {
        const inicio = Math.floor(i * factorGrupo);
        const fin = Math.floor((i + 1) * factorGrupo);
        let maximo = 0;
        for (let j = inicio; j < fin && j < len; j++) {
            if (datos[j] > maximo) maximo = datos[j];
        }
        resultado.push(maximo);
    }
    return resultado;
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
    onClick,
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

        const datosOriginales = datosPicos.current;
        
        /*
         * Calcular número óptimo de barras según ancho del canvas.
         * Se usa anchoBarra + espacioBarra para determinar cuántas caben.
         */
        const anchoBarraProp = anchoBarra ?? 2;
        const gapProp = espacioBarra ?? 1;
        const barrasOptimas = Math.floor(anchoLogico / (anchoBarraProp + gapProp));
        const numBarras = Math.max(10, Math.min(barrasOptimas, datosOriginales.length));
        
        /* Remuestrear si hay más datos que barras para resolución adaptativa */
        const datos = remuestrearPicos(datosOriginales, numBarras);
        
        /* Escalar barras para ocupar exactamente el 100% del ancho */
        const factorEscala = anchoLogico / (numBarras * (anchoBarraProp + gapProp));
        const anchoBarraFinal = anchoBarraProp * factorEscala;
        const gapFinal = gapProp * factorEscala;
        const paso = anchoBarraFinal + gapFinal;
        
        const mitad = altoLogico / 2;
        const puntoProgreso = progreso * anchoLogico;

        for (let i = 0; i < numBarras; i++) {
            const x = i * paso;
            const altoPico = datos[i] * mitad * 0.9;

            ctx.fillStyle = x < puntoProgreso ? colorReproducido : colorNoReproducido;

            if (simetrico) {
                /*
                 * Dibujar un solo rectángulo centrado (de arriba a abajo)
                 * para eliminar cualquier línea/seam en el medio.
                 */
                const altoMinimo = Math.max(1, altoPico);
                ctx.fillRect(x, mitad - altoMinimo, anchoBarraFinal, altoMinimo * 2);
            } else {
                const altoClasico = Math.max(2, datos[i] * (altoLogico - 2));
                ctx.fillRect(x, altoLogico - altoClasico, anchoBarraFinal, altoClasico);
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
        if (!interactivo) return;
        
        /* Si hay onClick, llamarlo (para play/pause) */
        if (onClick) {
            onClick();
        }
        
        /* Si hay onSeek, usarlo para cambiar posición */
        if (onSeek) {
            onSeek(calcularPosicion(e));
        }
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
