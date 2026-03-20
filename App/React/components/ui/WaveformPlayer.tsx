/*
 * Componente: WaveformPlayer
 * Renderizado de waveform con Canvas. Picos precalculados del servidor.
 * Interactivo: click-to-seek, hover muestra tiempo.
 * Colores: played vs unplayed controlados por props.
 */

import { useWaveformPlayer } from '../../hooks/useWaveformPlayer';
import { useT } from '@app/utils/i18n/useT';
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

const CLASES_TAMANO: Record<TamanoWaveform, string> = {
    sm: 'waveformSm',
    md: 'waveformMd',
    lg: 'waveformLg',
    xl: 'waveformXl',
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
    const {
        canvasRef,
        contenedorRef,
        hoverX,
        tiempoHover,
        manejarClick,
        manejarMouseMove,
        manejarMouseLeave,
    } = useWaveformPlayer({
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
    });

    const { t } = useT();

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
            aria-label={t('waveform.progreso')}
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
