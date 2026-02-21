/*
 * StepGrid — Matriz visual de pasos del step sequencer.
 * Renderiza una fila de PasoBoton para un canal.
 * Optimizado: solo re-renderiza la fila que cambia.
 */

import { useCallback } from 'react';
import type { CanalRack } from '../../types/mezclador';
import { PasoBoton } from './PasoBoton';

interface StepGridProps {
    canal: CanalRack;
    patronId: string;
    onTogglePaso: (patronId: string, canalId: string, pasoIndex: number) => void;
}

export const StepGrid = ({
    canal,
    patronId,
    onTogglePaso,
}: StepGridProps): JSX.Element => {
    const alToggle = useCallback(
        (indice: number) => onTogglePaso(patronId, canal.id, indice),
        [patronId, canal.id, onTogglePaso]
    );

    return (
        <div className="stepGrid">
            {/* sentinel-disable-next-line key-index-lista */}
            {canal.pasos.map((paso, i) => (
                <PasoBoton
                    key={`paso-${i}`}
                    paso={paso}
                    indice={i}
                    colorCanal={canal.color}
                    onToggle={alToggle}
                />
            ))}
        </div>
    );
};
