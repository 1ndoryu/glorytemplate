/*
 * EQVisualizer — Visualización de curva de EQ para un insert del mixer.
 * Componente de vista. Lógica en useEQVisualizer.
 */

import { useEQVisualizer, COLORES_BANDA, NOMBRES_BANDA } from '../../hooks/useEQVisualizer';
import type { BandaEQ } from '../../types/mezclador';
import { BotonBase } from '@app/components/ui/BotonBase';

interface EQVisualizerProps {
    bandas: BandaEQ[];
    activo: boolean;
    onToggle: () => void;
    onCambioBanda: (indice: number, cambios: Partial<BandaEQ>) => void;
    ancho?: number;
    alto?: number;
}

export const EQVisualizer = ({
    bandas,
    activo,
    onToggle,
    onCambioBanda,
    ancho = 240,
    alto = 100,
}: EQVisualizerProps): JSX.Element => {
    const { canvasRef, alMouseDown, alMouseMove, alMouseUp } = useEQVisualizer({
        bandas, activo, onCambioBanda, ancho, alto,
    });

    return (
        <div className="eqVisualizer">
            <div className="eqVisualizerCabecera">
                <span>EQ</span>
                <BotonBase variante="ghost"
                    className={`eqVisualizerToggle ${activo ? 'eqVisualizerToggleActivo' : ''}`}
                    onClick={onToggle}
                >
                    {activo ? 'ON' : 'OFF'}
                </BotonBase>
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
