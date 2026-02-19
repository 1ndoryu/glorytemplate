/*
 * PeakMeter — Barra vertical L/R con indicadores de nivel.
 * Colores: verde → amarillo → rojo según nivel.
 * Animación suave con CSS transitions.
 */

import { memo } from 'react';

interface PeakMeterProps {
    peakL: number;
    peakR: number;
    alto?: number;
}

/* Mapear nivel (0-1) a color gradiente */
const nivelAColor = (nivel: number): string => {
    if (nivel > 0.9) return '#ff4444';
    if (nivel > 0.7) return '#ffaa00';
    if (nivel > 0.5) return '#88cc44';
    return '#44cc44';
};

export const PeakMeter = memo(({
    peakL,
    peakR,
    alto = 100,
}: PeakMeterProps): JSX.Element => {
    const alturaL = Math.min(100, peakL * 100);
    const alturaR = Math.min(100, peakR * 100);

    return (
        <div className="peakMeter" style={{ height: alto }}>
            {/* Canal izquierdo */}
            <div className="peakMeterCanal">
                <div
                    className="peakMeterBarra"
                    style={{
                        height: `${alturaL}%`,
                        backgroundColor: nivelAColor(peakL),
                    }}
                />
            </div>

            {/* Canal derecho */}
            <div className="peakMeterCanal">
                <div
                    className="peakMeterBarra"
                    style={{
                        height: `${alturaR}%`,
                        backgroundColor: nivelAColor(peakR),
                    }}
                />
            </div>
        </div>
    );
});

PeakMeter.displayName = 'PeakMeter';
