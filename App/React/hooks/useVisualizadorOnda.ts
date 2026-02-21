/*
 * Hook: useVisualizadorOnda
 * Lógica de visualización de audio en tiempo real (barras/onda/circular).
 * Maneja AudioContext, AnalyserNode, conexión de fuente y bucle rAF.
 * Extraído de VisualizadorOnda para cumplir SRP.
 */

import { useRef, useEffect, useCallback, useState } from 'react';

type ModoVisualizador = 'barras' | 'onda' | 'circular';

interface UseVisualizadorOndaParams {
    audioSource: HTMLAudioElement | MediaStream | null;
    modo: ModoVisualizador;
    alto: number;
    color: string;
    colorSecundario: string;
    colorFondo: string;
    numBarras: number;
    suavizado: number;
    activo: boolean;
}

/*
 * Genera gradiente vertical entre dos colores.
 */
const crearGradiente = (
    ctx: CanvasRenderingContext2D,
    alto: number,
    colorPrimario: string,
    colorSecundario: string
): CanvasGradient => {
    const gradiente = ctx.createLinearGradient(0, alto, 0, 0);
    gradiente.addColorStop(0, colorPrimario);
    gradiente.addColorStop(1, colorSecundario);
    return gradiente;
};

export const useVisualizadorOnda = ({
    audioSource,
    modo,
    alto,
    color,
    colorSecundario,
    colorFondo,
    numBarras,
    suavizado,
    activo,
}: UseVisualizadorOndaParams) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const contenedorRef = useRef<HTMLDivElement>(null);
    const ctxAudioRef = useRef<AudioContext | null>(null);
    const analizadorRef = useRef<AnalyserNode | null>(null);
    const sourceRef = useRef<MediaElementAudioSourceNode | MediaStreamAudioSourceNode | null>(null);
    const rafRef = useRef<number>(0);
    const [conectado, setConectado] = useState(false);

    /*
     * Conectar el nodo analizador a la fuente de audio.
     * Se crea un AudioContext y AnalyserNode una sola vez.
     */
    const conectarAudio = useCallback(() => {
        if (!audioSource || conectado) return;

        try {
            if (!ctxAudioRef.current) {
                ctxAudioRef.current = new AudioContext();
            }

            const ctx = ctxAudioRef.current;
            const analizador = ctx.createAnalyser();
            analizador.fftSize = 256;
            analizador.smoothingTimeConstant = suavizado;

            let source: MediaElementAudioSourceNode | MediaStreamAudioSourceNode;

            if (audioSource instanceof HTMLAudioElement) {
                source = ctx.createMediaElementSource(audioSource);
                source.connect(analizador);
                analizador.connect(ctx.destination);
            } else if (audioSource instanceof MediaStream) {
                source = ctx.createMediaStreamSource(audioSource);
                source.connect(analizador);
            } else {
                return;
            }

            analizadorRef.current = analizador;
            sourceRef.current = source;
            setConectado(true);
        } catch (err) {
            console.debug('[VisualizadorOnda] No se pudo conectar audio:', err);
        }
    }, [audioSource, conectado, suavizado]);

    /* Conectar al cambiar la fuente */
    useEffect(() => {
        if (audioSource && activo) {
            conectarAudio();
        }
    }, [audioSource, activo, conectarAudio]);

    /* Dibujar barras de frecuencia */
    const dibujarBarras = useCallback((
        ctx: CanvasRenderingContext2D,
        datos: Uint8Array,
        ancho: number,
        altoCanvas: number
    ) => {
        const anchoBarra = ancho / numBarras;
        const gap = Math.max(1, anchoBarra * 0.15);
        const anchoBarraReal = anchoBarra - gap;
        const step = Math.floor(datos.length / numBarras);
        const gradiente = crearGradiente(ctx, altoCanvas, color, colorSecundario);

        for (let i = 0; i < numBarras; i++) {
            let suma = 0;
            for (let j = 0; j < step; j++) {
                suma += datos[i * step + j] ?? 0;
            }
            const valor = suma / step / 255;
            const altoBarra = Math.max(2, valor * altoCanvas * 0.95);

            ctx.fillStyle = gradiente;
            const x = i * anchoBarra + gap / 2;
            const y = altoCanvas - altoBarra;

            const radio = Math.min(anchoBarraReal / 2, 3);
            ctx.beginPath();
            ctx.moveTo(x + radio, y);
            ctx.lineTo(x + anchoBarraReal - radio, y);
            ctx.arcTo(x + anchoBarraReal, y, x + anchoBarraReal, y + radio, radio);
            ctx.lineTo(x + anchoBarraReal, altoCanvas);
            ctx.lineTo(x, altoCanvas);
            ctx.lineTo(x, y + radio);
            ctx.arcTo(x, y, x + radio, y, radio);
            ctx.fill();
        }
    }, [numBarras, color, colorSecundario]);

    /* Dibujar forma de onda (osciloscopio) */
    const dibujarOnda = useCallback((
        ctx: CanvasRenderingContext2D,
        datos: Uint8Array,
        ancho: number,
        altoCanvas: number
    ) => {
        ctx.lineWidth = 2;
        ctx.strokeStyle = color;
        ctx.beginPath();

        const paso = ancho / datos.length;

        for (let i = 0; i < datos.length; i++) {
            const valor = datos[i] / 255;
            const y = valor * altoCanvas;
            const x = i * paso;

            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }

        ctx.stroke();

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, altoCanvas / 2);
        ctx.lineTo(ancho, altoCanvas / 2);
        ctx.stroke();
    }, [color]);

    /* Dibujar modo circular */
    const dibujarCircular = useCallback((
        ctx: CanvasRenderingContext2D,
        datos: Uint8Array,
        ancho: number,
        altoCanvas: number
    ) => {
        const centroX = ancho / 2;
        const centroY = altoCanvas / 2;
        const radioBase = Math.min(centroX, centroY) * 0.4;
        const totalPuntos = datos.length;

        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();

        for (let i = 0; i < totalPuntos; i++) {
            const angulo = (i / totalPuntos) * Math.PI * 2 - Math.PI / 2;
            const valor = datos[i] / 255;
            const radio = radioBase + valor * radioBase * 0.8;
            const x = centroX + Math.cos(angulo) * radio;
            const y = centroY + Math.sin(angulo) * radio;

            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }

        ctx.closePath();
        ctx.stroke();

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(centroX, centroY, radioBase, 0, Math.PI * 2);
        ctx.stroke();
    }, [color]);

    /* Bucle de animación principal */
    const animar = useCallback(() => {
        if (!activo) return;

        const canvas = canvasRef.current;
        const analizador = analizadorRef.current;
        if (!canvas || !analizador) {
            rafRef.current = requestAnimationFrame(animar);
            return;
        }

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const dpr = window.devicePixelRatio || 1;
        const anchoLogico = canvas.clientWidth;
        const altoLogico = alto;

        canvas.width = anchoLogico * dpr;
        canvas.height = altoLogico * dpr;
        ctx.scale(dpr, dpr);

        if (colorFondo !== 'transparent') {
            ctx.fillStyle = colorFondo;
            ctx.fillRect(0, 0, anchoLogico, altoLogico);
        } else {
            ctx.clearRect(0, 0, anchoLogico, altoLogico);
        }

        if (modo === 'onda') {
            const datos = new Uint8Array(analizador.frequencyBinCount);
            analizador.getByteTimeDomainData(datos);
            dibujarOnda(ctx, datos, anchoLogico, altoLogico);
        } else {
            const datos = new Uint8Array(analizador.frequencyBinCount);
            analizador.getByteFrequencyData(datos);

            if (modo === 'barras') {
                dibujarBarras(ctx, datos, anchoLogico, altoLogico);
            } else {
                dibujarCircular(ctx, datos, anchoLogico, altoLogico);
            }
        }

        rafRef.current = requestAnimationFrame(animar);
    }, [activo, alto, colorFondo, modo, dibujarBarras, dibujarOnda, dibujarCircular]);

    /* Iniciar/detener animación */
    useEffect(() => {
        if (activo && conectado) {
            rafRef.current = requestAnimationFrame(animar);
        }
        return () => {
            cancelAnimationFrame(rafRef.current);
        };
    }, [activo, conectado, animar]);

    /* Limpieza al desmontar */
    useEffect(() => {
        return () => {
            cancelAnimationFrame(rafRef.current);
        };
    }, []);

    return {
        canvasRef,
        contenedorRef,
    };
};
