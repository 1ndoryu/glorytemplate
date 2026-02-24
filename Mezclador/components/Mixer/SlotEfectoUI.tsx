/*
 * SlotEfectoUI — Lista de slots de efectos para un insert del mixer.
 * 10 slots con nombre, LED activo/bypass y click para abrir config.
 */

import { useCallback, memo } from 'react';
import type { SlotEfecto } from '../../types/mezclador';
import { BotonBase } from '@app/components/ui/BotonBase';

interface SlotEfectoItemProps {
    slot: SlotEfecto;
    indice: number;
    onToggle: (indice: number) => void;
    onClick: (indice: number) => void;
}

const SlotEfectoItem = memo(({
    slot,
    indice,
    onToggle,
    onClick,
}: SlotEfectoItemProps): JSX.Element => {
    const alToggle = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        onToggle(indice);
    }, [indice, onToggle]);

    const alClick = useCallback(() => onClick(indice), [indice, onClick]);

    return (
        <div
            className={`slotEfecto ${slot.nombre ? 'slotEfectoOcupado' : ''}`}
            onClick={alClick}
        >
            <BotonBase variante="ghost"
                className={`slotEfectoLed ${slot.activo ? 'slotEfectoLedActivo' : ''}`}
                onClick={alToggle}
                title={slot.activo ? 'Bypass' : 'Activar'}
            />
            <span className="slotEfectoIndice">{indice + 1}</span>
            <span className="slotEfectoNombre">{slot.nombre || '—'}</span>
        </div>
    );
});

SlotEfectoItem.displayName = 'SlotEfectoItem';

interface SlotEfectoUIProps {
    slots: SlotEfecto[];
    onToggleSlot: (indice: number) => void;
    onClickSlot: (indice: number) => void;
}

export const SlotEfectoUI = ({
    slots,
    onToggleSlot,
    onClickSlot,
}: SlotEfectoUIProps): JSX.Element => {
    return (
        <div className="slotEfectoLista">
            <div className="slotEfectoCabecera">
                <span>Slots de Efectos</span>
            </div>
            {slots.map((slot, i) => (
                <SlotEfectoItem
                    key={slot.id}
                    slot={slot}
                    indice={i}
                    onToggle={onToggleSlot}
                    onClick={onClickSlot}
                />
            ))}
        </div>
    );
};
