/*
 * CanalStrip — Una fila del Channel Rack: LED mute/solo, knobs, routing, nombre, step grid.
 * Componente compuesto que agrupa controles del canal + sus pasos.
 */

import { useCallback } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import type { CanalRack } from '../../types/mezclador';
import { KnobControl } from '../KnobControl';
import { StepGrid } from './StepGrid';
import { BotonBase } from '@app/components/ui/BotonBase';
import { CampoTexto } from '@app/components/ui/CampoTexto';

interface CanalStripProps {
    canal: CanalRack;
    patronId: string;
    onTogglePaso: (patronId: string, canalId: string, pasoIndex: number) => void;
    onActualizarCanal: (patronId: string, canalId: string, cambios: Partial<CanalRack>) => void;
    onEliminarCanal: (patronId: string, canalId: string) => void;
}

export const CanalStrip = ({
    canal,
    patronId,
    onTogglePaso,
    onActualizarCanal,
    onEliminarCanal,
}: CanalStripProps): JSX.Element => {
    const toggleMute = useCallback(() => {
        onActualizarCanal(patronId, canal.id, { silenciado: !canal.silenciado });
    }, [patronId, canal.id, canal.silenciado, onActualizarCanal]);

    const toggleSolo = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        onActualizarCanal(patronId, canal.id, { solo: !canal.solo });
    }, [patronId, canal.id, canal.solo, onActualizarCanal]);

    const cambiarVolumen = useCallback((v: number) => {
        onActualizarCanal(patronId, canal.id, { volumen: v });
    }, [patronId, canal.id, onActualizarCanal]);

    const cambiarPan = useCallback((v: number) => {
        onActualizarCanal(patronId, canal.id, { pan: v });
    }, [patronId, canal.id, onActualizarCanal]);

    const cambiarRouting = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const valor = Math.max(0, Math.min(16, parseInt(e.target.value) || 0));
        onActualizarCanal(patronId, canal.id, { mixerInsertId: valor });
    }, [patronId, canal.id, onActualizarCanal]);

    return (
        <div className={`canalStrip ${canal.silenciado ? 'canalStripSilenciado' : ''} ${canal.solo ? 'canalStripSolo' : ''}`}>
            {/* LED mute/solo: click izq = mute, click der = solo */}
            <BotonBase variante="ghost"
                className={`canalLed ${canal.silenciado ? 'canalLedMute' : ''} ${canal.solo ? 'canalLedSolo' : ''}`}
                onClick={toggleMute}
                onContextMenu={toggleSolo}
                title={`${canal.silenciado ? 'Unmute' : 'Mute'} | Click derecho: ${canal.solo ? 'Unsolok' : 'Solo'}`}
                style={{ borderColor: canal.color }}
            >
                {canal.silenciado ? <VolumeX size={10} /> : <Volume2 size={10} />}
            </BotonBase>

            {/* Knob pan */}
            <KnobControl
                valor={canal.pan}
                min={-1}
                max={1}
                paso={0.05}
                etiqueta="Pan"
                valorPorDefecto={0}
                formatoValor={(v) => v === 0 ? 'C' : v < 0 ? `L${Math.round(Math.abs(v) * 100)}` : `R${Math.round(v * 100)}`}
                onChange={cambiarPan}
                tamano={28}
                bipolar={true}
            />

            {/* Knob volumen */}
            <KnobControl
                valor={canal.volumen}
                min={0}
                max={1}
                paso={0.01}
                etiqueta="Vol"
                valorPorDefecto={1}
                formatoValor={(v) => `${Math.round(v * 100)}%`}
                onChange={cambiarVolumen}
                tamano={28}
            />

            {/* Routing al mixer insert */}
            <CampoTexto
                type="number"
                className="canalRouting"
                value={canal.mixerInsertId}
                onChange={cambiarRouting}
                min={0}
                max={16}
                title={`Enviar al Insert ${canal.mixerInsertId}`}
             />

            {/* Nombre del canal */}
            <div
                className="canalNombre"
                style={{ color: canal.color }}
                title={canal.nombre}
            >
                {canal.nombre}
            </div>

            {/* Botón eliminar canal */}
            <BotonBase variante="ghost"
                className="canalStripEliminar"
                onClick={() => onEliminarCanal(patronId, canal.id)}
                title="Eliminar canal"
            >
                ×
            </BotonBase>

            {/* Step grid */}
            <StepGrid
                canal={canal}
                patronId={patronId}
                onTogglePaso={onTogglePaso}
            />
        </div>
    );
};
