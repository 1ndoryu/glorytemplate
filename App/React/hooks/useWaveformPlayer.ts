/*
 * Hook: useWaveformPlayer
 * Lógica de renderizado canvas de waveform estático con soporte HiDPI,
 * remuestreo adaptativo, hover y seek interactivo.
 * Extraído de WaveformPlayer para cumplir SRP.
 */

import { useRef, useEffect, useCallback, useState, type MouseEvent } from 'react';

type TamanoWaveform = 'sm' | 'md' | 'lg' | 'xl';

interface UseWaveformPlayerParams {
    picos: number[] | null;
    progreso: number;
    duracion: number;
    onSeek?: (posicion: number) => void;
    onClick?: () => void;
    tamano: TamanoWaveform;
    colorNoReproducido: string;
    colorReproducido: string;
    colorFondo: string;
    interactivo: boolean;
    anchoBarra?: number;
    espacioBarra?: number;
    simetrico: boolean;
}

const ALTOS: Record<TamanoWaveform, number> = {
    sm: 32,
    md: 48,
    lg: 80,
    xl: 120,
};

/* Generar picos de placeholder para cuando no hay datos */
const generarPlaceholder = (cantidad: number): number[] => {
    const picos: number[] = [];
    for (let i = 0; i < cantidad; i++) {
        const base = Math.sin((i / cantidad) * Math.PI) * 0.6;
        const ruido = Math.random() * 0.3;
        picos.push(Math.max(0.05, Math.min(1, base + ruido)));
    }
    return picos;
};

/*
 * Remuestrear picos para adaptar la resolución al ancho disponible.
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

/* [193A-51] Resolver CSS custom properties (var(--nombre)) a valores hex para canvas */
const resolverColorCSS = (color: string): string => {
    if (!color.startsWith('var(')) return color;
    const nombre = color.slice(4, -1).trim();
    return getComputedStyle(document.documentElement).getPropertyValue(nombre).trim() || color;
};

export const useWaveformPlayer = ({
    picos,
    progreso,
    duracion,
    onSeek,
    onClick,
    tamano,
    colorNoReproducido,
    colorReproducido,
    colorFondo,
    interactivo,
    anchoBarra,
    espacioBarra,
    simetrico,
}: UseWaveformPlayerParams) => {
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

        canvas.width = anchoLogico * dpr;
        canvas.height = altoLogico * dpr;
        ctx.scale(dpr, dpr);

        ctx.clearRect(0, 0, anchoLogico, altoLogico);

        if (colorFondo !== 'transparent') {
            ctx.fillStyle = colorFondo;
            ctx.fillRect(0, 0, anchoLogico, altoLogico);
        }

        const datosOriginales = datosPicos.current;

        const anchoBarraProp = anchoBarra ?? 2;
        const gapProp = espacioBarra ?? 1;
        const barrasOptimas = Math.floor(anchoLogico / (anchoBarraProp + gapProp));
        const numBarras = Math.max(10, Math.min(barrasOptimas, datosOriginales.length));

        const datos = remuestrearPicos(datosOriginales, numBarras);

        const factorEscala = anchoLogico / (numBarras * (anchoBarraProp + gapProp));
        const anchoBarraFinal = anchoBarraProp * factorEscala;
        const gapFinal = gapProp * factorEscala;
        const paso = anchoBarraFinal + gapFinal;

        const mitad = altoLogico / 2;
        const puntoProgreso = progreso * anchoLogico;

        /* [193A-51] Resolver CSS vars para que el canvas use el color correcto en cada tema */
        const colorNoRep = resolverColorCSS(colorNoReproducido);
        const colorRep = resolverColorCSS(colorReproducido);

        for (let i = 0; i < numBarras; i++) {
            const x = i * paso;
            const altoPico = datos[i] * mitad * 0.9;

            ctx.fillStyle = x < puntoProgreso ? colorRep : colorNoRep;

            if (simetrico) {
                const altoMinimo = Math.max(1, altoPico);
                ctx.fillRect(x, mitad - altoMinimo, anchoBarraFinal, altoMinimo * 2);
            } else {
                const altoClasico = Math.max(2, datos[i] * (altoLogico - 2));
                ctx.fillRect(x, altoLogico - altoClasico, anchoBarraFinal, altoClasico);
            }
        }

        if (hoverX !== null && interactivo) {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(hoverX, 0);
            ctx.lineTo(hoverX, altoLogico);
            ctx.stroke();
        }
    }, [picos, progreso, tamano, colorReproducido, colorNoReproducido, colorFondo, hoverX, interactivo, anchoBarra, espacioBarra, simetrico]);

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
        if (onClick) onClick();
        if (onSeek) onSeek(calcularPosicion(e));
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

    return {
        canvasRef,
        contenedorRef,
        hoverX,
        tiempoHover,
        manejarClick,
        manejarMouseMove,
        manejarMouseLeave,
    };
};
