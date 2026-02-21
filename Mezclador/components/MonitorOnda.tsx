/*
 * MonitorOnda — Visualizador de forma de onda en tiempo real (C305).
 * Similar al "Monitor" de FL Studio: dibuja en canvas la waveform del master.
 * Usa el AnalyserNode del master insert via motorAudioService.
 */

import { useMonitorOnda } from '../hooks/useMonitorOnda';

interface MonitorOndaProps {
    ancho?: number;
    alto?: number;
    activo: boolean;
}

export const MonitorOnda = ({ ancho = 80, alto = 28, activo }: MonitorOndaProps): JSX.Element => {
    const { canvasRef } = useMonitorOnda({ activo });

    return (
        <canvas
            ref={canvasRef}
            className="monitorOnda"
            width={ancho}
            height={alto}
            title="Monitor de onda"
        />
    );
};
