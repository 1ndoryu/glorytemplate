/*
 * CabeceraChannelRack — Cabecera con selector de patrón, swing knob, loop toggle.
 * Se sitúa arriba del grid de canales.
 */

import { KnobControl } from '../KnobControl';
import { SelectorPatron } from './SelectorPatron';
import type { Patron } from '../../types/mezclador';
import { BotonBase } from '@app/components/ui/BotonBase';

interface CabeceraChannelRackProps {
    patrones: Patron[];
    patronActivo: string | null;
    patronActual: Patron | undefined;
    onSeleccionar: (id: string) => void;
    onCrear: () => void;
    onRenombrar: (id: string, nombre: string) => void;
    onEliminar: (id: string) => void;
    onDuplicar: (id: string) => void;
    onSetSwing: (patronId: string, swing: number) => void;
    onToggleLoop: (patronId: string) => void;
}

export const CabeceraChannelRack = ({
    patrones,
    patronActivo,
    patronActual,
    onSeleccionar,
    onCrear,
    onRenombrar,
    onEliminar,
    onDuplicar,
    onSetSwing,
    onToggleLoop,
}: CabeceraChannelRackProps): JSX.Element => {
    return (
        <div className="cabeceraChannelRack">
            {/* Selector de patrón */}
            <SelectorPatron
                patrones={patrones}
                patronActivo={patronActivo}
                onSeleccionar={onSeleccionar}
                onCrear={onCrear}
                onRenombrar={onRenombrar}
                onEliminar={onEliminar}
                onDuplicar={onDuplicar}
            />

            <div className="cabeceraChannelRackControles">
                {/* Swing knob */}
                {patronActual && (
                    <KnobControl
                        valor={patronActual.swing}
                        min={0}
                        max={1}
                        paso={0.05}
                        etiqueta="Swing"
                        valorPorDefecto={0}
                        formatoValor={(v) => `${Math.round(v * 100)}%`}
                        onChange={(v) => onSetSwing(patronActual.id, v)}
                        tamano={30}
                    />
                )}

                {/* Loop toggle LED */}
                {patronActual && (
                    <BotonBase variante="ghost"
                        className={`channelRackLoopLed ${patronActual.loop ? 'channelRackLoopLedActivo' : ''}`}
                        onClick={() => onToggleLoop(patronActual.id)}
                        title={patronActual.loop ? 'Loop: ON' : 'Loop: OFF'}
                    >
                        Loop
                    </BotonBase>
                )}

                {/* Info de pasos */}
                {patronActual && (
                    <span className="channelRackInfoPasos">
                        {patronActual.totalPasos} pasos
                    </span>
                )}
            </div>
        </div>
    );
};
