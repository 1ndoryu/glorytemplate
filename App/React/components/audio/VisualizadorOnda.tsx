/*
 * Componente: VisualizadorOnda — Kamples
 * Visualización en tiempo real de audio: barras de frecuencia u osciloscopio.
 * Usa Web Audio API (AnalyserNode) via useVisualizadorOnda hook.
 * Complementa a WaveformPlayer (estático) con un visualizador dinámico.
 */

import { useVisualizadorOnda } from '../../hooks/useVisualizadorOnda';

interface VisualizadorOndaProps {
    /* Elemento <audio> o MediaStream a visualizar */
    audioSource?: HTMLAudioElement | MediaStream | null;
    /* Modo de visualización */
    modo?: 'barras' | 'onda' | 'circular';
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
    const { canvasRef, contenedorRef } = useVisualizadorOnda({
        audioSource,
        modo,
        alto,
        color,
        colorSecundario,
        colorFondo,
        numBarras,
        suavizado,
        activo,
    });

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
