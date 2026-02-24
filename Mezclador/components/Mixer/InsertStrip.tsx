/*
 * InsertStrip — Una columna de la consola del mixer.
 * Contiene: nombre, fader, peak meter, pan knob, mute/solo, routing.
 */

import { useCallback } from 'react';
import { VolumeX } from 'lucide-react';
import type { InsertMixer } from '../../types/mezclador';
import { KnobControl } from '../KnobControl';
import { FaderControl } from './FaderControl';
import { PeakMeter } from './PeakMeter';
import { BotonBase } from '@app/components/ui/BotonBase';

interface InsertStripProps {
    insert: InsertMixer;
    seleccionado: boolean;
    onSeleccionar: (id: number) => void;
    onSetVolumen: (id: number, vol: number) => void;
    onSetPan: (id: number, pan: number) => void;
    onToggleMute: (id: number) => void;
    onToggleSolo: (id: number) => void;
}

export const InsertStrip = ({
    insert,
    seleccionado,
    onSeleccionar,
    onSetVolumen,
    onSetPan,
    onToggleMute,
    onToggleSolo,
}: InsertStripProps): JSX.Element => {
    const alClickNombre = useCallback(() => onSeleccionar(insert.id), [insert.id, onSeleccionar]);
    const alCambiarVol = useCallback((v: number) => onSetVolumen(insert.id, v), [insert.id, onSetVolumen]);
    const alCambiarPan = useCallback((v: number) => onSetPan(insert.id, v), [insert.id, onSetPan]);
    const alMute = useCallback(() => onToggleMute(insert.id), [insert.id, onToggleMute]);
    const alSolo = useCallback(() => onToggleSolo(insert.id), [insert.id, onToggleSolo]);

    return (
        <div
            className={`insertStrip ${seleccionado ? 'insertStripSeleccionado' : ''} ${insert.silenciado ? 'insertStripSilenciado' : ''}`}
            style={{ borderTopColor: insert.color }}
        >
            {/* Nombre del insert */}
            <BotonBase variante="ghost"
                className="insertStripNombre"
                onClick={alClickNombre}
                title={insert.nombre}
            >
                {insert.id === 0 ? 'Mst' : insert.id}
            </BotonBase>

            {/* Peak meter */}
            <PeakMeter
                peakL={insert.peakL}
                peakR={insert.peakR}
                alto={80}
            />

            {/* Fader de volumen */}
            <FaderControl
                valor={insert.volumen}
                min={0}
                max={1.25}
                valorPorDefecto={0.8}
                onChange={alCambiarVol}
                alto={100}
                color={insert.color}
            />

            {/* Pan knob */}
            <KnobControl
                valor={insert.pan}
                min={-1}
                max={1}
                paso={0.05}
                etiqueta=""
                valorPorDefecto={0}
                formatoValor={(v) => v === 0 ? 'C' : v < 0 ? `L${Math.round(Math.abs(v) * 100)}` : `R${Math.round(v * 100)}`}
                onChange={alCambiarPan}
                tamano={26}
                bipolar={true}
            />

            {/* Mute / Solo */}
            <div className="insertStripBotones">
                <BotonBase variante="ghost"
                    className={`insertStripBoton ${insert.silenciado ? 'insertStripBotonActivo' : ''}`}
                    onClick={alMute}
                    title={insert.silenciado ? 'Unmute' : 'Mute'}
                >
                    {insert.silenciado ? <VolumeX size={10} /> : 'M'}
                </BotonBase>
                <BotonBase variante="ghost"
                    className={`insertStripBoton ${insert.solo ? 'insertStripBotonSolo' : ''}`}
                    onClick={alSolo}
                    title={insert.solo ? 'Unsolo' : 'Solo'}
                >
                    S
                </BotonBase>
            </div>

            {/* Label del nombre completo */}
            <span className="insertStripLabel">{insert.nombre}</span>
        </div>
    );
};
