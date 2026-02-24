/*
 * PanelControl — Panel inferior del piano roll para editar velocity/pan/pitch.
 * C310: Muestra barras verticales por cada nota, editables con drag vertical.
 */

import { memo } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import type { TipoControl } from '../../types/pianoRoll';
import { usePanelControl } from '../../hooks/usePanelControl';
import { BotonBase } from '@app/components/ui/BotonBase';

const TABS_CONTROL: { tipo: TipoControl; label: string }[] = [
    { tipo: 'velocity', label: 'Velocity' },
    { tipo: 'pan', label: 'Pan' },
    { tipo: 'finePitch', label: 'Fine Pitch' },
];

export const PanelControl = memo((): JSX.Element | null => {
    const {
        controlActivo,
        controlAbierto,
        setControlActivo,
        toggleControlAbierto,
        vista,
        cuerpoRef,
        barras,
    } = usePanelControl();

    return (
        <div
            className="pianoRollPanelControl"
            style={{ height: controlAbierto ? vista.alturaControl + 24 : 24 }}
        >
            {/* Cabecera: toggle + tabs */}
            <div className="pianoRollPanelControlCabecera">
                <BotonBase variante="ghost"
                    className="pianoRollPanelControlToggle"
                    onClick={toggleControlAbierto}
                    title={controlAbierto ? 'Ocultar' : 'Mostrar'}
                >
                    {controlAbierto
                        ? <ChevronDown size={12} />
                        : <ChevronRight size={12} />
                    }
                </BotonBase>

                {TABS_CONTROL.map(({ tipo, label }) => (
                    <BotonBase variante="ghost"
                        key={tipo}
                        className={`pianoRollPanelControlTab ${
                            controlActivo === tipo ? 'pianoRollPanelControlTabActivo' : ''
                        }`}
                        onClick={() => setControlActivo(tipo)}
                    >
                        {label}
                    </BotonBase>
                ))}
            </div>

            {/* Cuerpo: barras de control */}
            {controlAbierto && (
                <div
                    ref={cuerpoRef}
                    className="pianoRollPanelControlCuerpo"
                    style={{ height: vista.alturaControl }}
                >
                    {barras}
                </div>
            )}
        </div>
    );
});

PanelControl.displayName = 'PanelControl';
