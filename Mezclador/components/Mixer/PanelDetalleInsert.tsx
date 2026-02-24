/*
 * PanelDetalleInsert — Panel lateral derecho del mixer.
 * Muestra EQ grande, slots de efectos e información del insert seleccionado.
 */

import { useCallback } from 'react';
import type { InsertMixer, BandaEQ } from '../../types/mezclador';
import { EQVisualizer } from './EQVisualizer';
import { SlotEfectoUI } from './SlotEfectoUI';
import { BotonBase } from '@app/components/ui/BotonBase';
import { CampoTexto } from '@app/components/ui/CampoTexto';

interface PanelDetalleInsertProps {
    insert: InsertMixer | null;
    onToggleEQ: (insertId: number) => void;
    onCambioBandaEQ: (insertId: number, indice: number, cambios: Partial<BandaEQ>) => void;
    onToggleSlot: (insertId: number, indice: number) => void;
    onClickSlot: (insertId: number, indice: number) => void;
    onCambioNombre: (insertId: number, nombre: string) => void;
    onCambioColor: (insertId: number, color: string) => void;
}

const COLORES_INSERT = [
    '#64b5f6', '#4fc3f7', '#4dd0e1', '#4db6ac',
    '#81c784', '#aed581', '#dce775', '#fff176',
    '#ffd54f', '#ffb74d', '#ff8a65', '#e57373',
    '#f06292', '#ba68c8', '#9575cd', '#7986cb',
];

export const PanelDetalleInsert = ({
    insert,
    onToggleEQ,
    onCambioBandaEQ,
    onToggleSlot,
    onClickSlot,
    onCambioNombre,
    onCambioColor,
}: PanelDetalleInsertProps): JSX.Element => {
    if (!insert) {
        return (
            <div className="panelDetalleInsert panelDetalleInsertVacio">
                <span>Selecciona un insert</span>
            </div>
        );
    }

    const alToggleEQ = useCallback(() => onToggleEQ(insert.id), [insert.id, onToggleEQ]);
    const alCambioBanda = useCallback(
        (indice: number, cambios: Partial<BandaEQ>) => onCambioBandaEQ(insert.id, indice, cambios),
        [insert.id, onCambioBandaEQ]
    );
    const alToggleSlot = useCallback(
        (indice: number) => onToggleSlot(insert.id, indice),
        [insert.id, onToggleSlot]
    );
    const alClickSlot = useCallback(
        (indice: number) => onClickSlot(insert.id, indice),
        [insert.id, onClickSlot]
    );

    return (
        <div className="panelDetalleInsert">
            {/* Cabecera con nombre editable y color */}
            <div className="panelDetalleInsertCabecera">
                <CampoTexto
                    className="panelDetalleInsertNombre"
                    value={insert.nombre}
                    onChange={(e) => onCambioNombre(insert.id, e.target.value)}
                    maxLength={20}
                />
                <div className="panelDetalleInsertColores">
                    {COLORES_INSERT.map((color) => (
                        <BotonBase variante="ghost"
                            key={color}
                            className={`panelDetalleInsertColor ${insert.color === color ? 'panelDetalleInsertColorActivo' : ''}`}
                            style={{ backgroundColor: color }}
                            onClick={() => onCambioColor(insert.id, color)}
                        />
                    ))}
                </div>
            </div>

            {/* EQ grande */}
            <EQVisualizer
                bandas={insert.eq}
                activo={insert.eqActivo}
                onToggle={alToggleEQ}
                onCambioBanda={alCambioBanda}
                ancho={260}
                alto={120}
            />

            {/* Info routing */}
            <div className="panelDetalleInsertRouting">
                <span className="panelDetalleInsertRoutingLabel">Envía a:</span>
                <span className="panelDetalleInsertRoutingValor">
                    {insert.enviarA === 0 ? 'Master' : `Insert ${insert.enviarA}`}
                </span>
            </div>

            {/* Slots */}
            <SlotEfectoUI
                slots={insert.slots}
                onToggleSlot={alToggleSlot}
                onClickSlot={alClickSlot}
            />
        </div>
    );
};
