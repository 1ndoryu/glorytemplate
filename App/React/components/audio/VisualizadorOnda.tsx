/*
 * Componente: VisualizadorOnda — Kamples
 * Visualización en tiempo real de audio: barras de frecuencia u osciloscopio.
 * Usa Web Audio API (AnalyserNode) para leer datos del audio en reproducción.
 * Complementa a WaveformPlayer (estático) con un visualizador dinámico.
 */

import { useRef, useEffect, useCallback, useState } from 'react';

type ModoVisualizador = 'barras' | 'onda' | 'circular';

interface VisualizadorOndaProps {
    /* Elemento <audio> o MediaStream a visualizar */
    audioSource?: HTMLAudioElement | MediaStream | null;
    /* Modo de visualización */
    modo?: ModoVisualizador;
    /* Altura en px */
    alto?: number;
    /* Color principal */
    color?: string;
    /* Color secundario (gradiente) */
    colorSecundario?: string;
    /* Color de fondo */
    colorFondo?: string;
    /* Cantidad de barras en modo "barras" */
    numBarras?: number;
    /* Suavizado de la animación (0..1, más alto = más suave) */
    suavizado?: number;
    className?: string;
    /* Si está activo (deja de animar si false) */
    activo?: boolean;
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

export const VisualizadorOnda = ({
    audioSource = null,
    modo = 'barras',
    alto = 64,
    color = '#7c3aed',
    colorSecundario = '#a78bfa',
    colorFondo = 'transparent',
    numBarras = 48,
    suavizado = 0.8,
    className = '',
    activo = true,
}: VisualizadorOndaProps): JSX.Element => {
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
            /* AudioContext puede fallar si el elemento ya tiene un source node */
            console.debug('[VisualizadorOnda] No se pudo conectar audio:', err);
        }
    }, [audioSource, conectado, suavizado]);

    /* Conectar al cambiar la fuente */
    useEffect(() => {
        if (audioSource && activo) {
            conectarAudio();
        }
    }, [audioSource, activo, conectarAudio]);

    /*
     * Dibujar barras de frecuencia.
     */
    const dibujarBarras = useCallback((
        ctx: CanvasRenderingContext2D,
        datos: Uint8Array,
        ancho: number,
        alto: number
    ) => {
        const anchoBarra = ancho / numBarras;
        const gap = Math.max(1, anchoBarra * 0.15);
        const anchoBarraReal = anchoBarra - gap;
        const step = Math.floor(datos.length / numBarras);
        const gradiente = crearGradiente(ctx, alto, color, colorSecundario);

        for (let i = 0; i < numBarras; i++) {
            /* Promediar un rango de bins para suavizar */
            let suma = 0;
            for (let j = 0; j < step; j++) {
                suma += datos[i * step + j] ?? 0;
            }
            const valor = suma / step / 255;
            const altoBarra = Math.max(2, valor * alto * 0.95);

            ctx.fillStyle = gradiente;
            const x = i * anchoBarra + gap / 2;
            const y = alto - altoBarra;

            /* Barra con borde redondeado superior */
            const radio = Math.min(anchoBarraReal / 2, 3);
            ctx.beginPath();
            ctx.moveTo(x + radio, y);
            ctx.lineTo(x + anchoBarraReal - radio, y);
            ctx.arcTo(x + anchoBarraReal, y, x + anchoBarraReal, y + radio, radio);
            ctx.lineTo(x + anchoBarraReal, alto);
            ctx.lineTo(x, alto);
            ctx.lineTo(x, y + radio);
            ctx.arcTo(x, y, x + radio, y, radio);
            ctx.fill();
        }
    }, [numBarras, color, colorSecundario]);

    /*
     * Dibujar forma de onda (osciloscopio).
     */
    const dibujarOnda = useCallback((
        ctx: CanvasRenderingContext2D,
        datos: Uint8Array,
        ancho: number,
        alto: number
    ) => {
        ctx.lineWidth = 2;
        ctx.strokeStyle = color;
        ctx.beginPath();

        const paso = ancho / datos.length;

        for (let i = 0; i < datos.length; i++) {
            const valor = datos[i] / 255;
            const y = valor * alto;
            const x = i * paso;

            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }

        ctx.stroke();

        /* Línea central de referencia */
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, alto / 2);
        ctx.lineTo(ancho, alto / 2);
        ctx.stroke();
    }, [color]);

    /*
     * Dibujar modo circular.
     */
    const dibujarCircular = useCallback((
        ctx: CanvasRenderingContext2D,
        datos: Uint8Array,
        ancho: number,
        alto: number
    ) => {
        const centroX = ancho / 2;
        const centroY = alto / 2;
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

        /* Círculo base tenue */
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(centroX, centroY, radioBase, 0, Math.PI * 2);
        ctx.stroke();
    }, [color]);

    /*
     * Bucle de animación principal.
     */
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

        /* Limpiar */
        if (colorFondo !== 'transparent') {
            ctx.fillStyle = colorFondo;
            ctx.fillRect(0, 0, anchoLogico, altoLogico);
        } else {
            ctx.clearRect(0, 0, anchoLogico, altoLogico);
        }

        /* Obtener datos del analizador */
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
            /* No cerrar AudioContext para que el audio siga sonando */
        };
    }, []);

    return (
        <div
            ref={contenedorRef}
            className={`contenedorVisualizador ${className}`}
            style={{ height: alto, width: '100%', position: 'relative' }}
        >
            <canvas
                ref={canvasRef}
                style={{
                    width: '100%',
                    height: '100%',
                    display: 'block',
                }}
            />
        </div>
    );
};

export default VisualizadorOnda;
