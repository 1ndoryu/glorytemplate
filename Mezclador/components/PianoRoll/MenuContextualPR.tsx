/*
 * MenuContextualPR — Menú contextual del Piano Roll.
 * Componente de vista. Lógica en useMenuContextualPR.
 */

import { memo } from 'react';
import { Palette } from 'lucide-react';
import { useMenuContextualPR } from '../../hooks/useMenuContextualPR';
import { PALETA_NOTAS } from '../../types/pianoRoll';
import { BotonBase } from '@app/components/ui/BotonBase';

interface MenuContextualPRProps {
    x: number;
    y: number;
    notaId: string | null;
    onCerrar: () => void;
}

export const MenuContextualPR = memo(({
    x,
    y,
    notaId,
    onCerrar,
}: MenuContextualPRProps): JSX.Element => {
    const {
        menuRef, opciones, haySeleccion, posX, posY,
        handleColor, handleVelocity,
    } = useMenuContextualPR({ x, y, notaId, onCerrar });

    return (
        <div
            ref={menuRef}
            className="pianoRollMenuContextual"
            style={{ left: posX, top: posY }}
        >
            {opciones.map((op) => (
                <div key={op.label}>
                    <BotonBase variante="ghost"
                        className="pianoRollMenuContextualItem"
                        onClick={op.onClick}
                    >
                        {op.icono && <op.icono size={12} />}
                        <span>{op.label}</span>
                    </BotonBase>
                    {op.separadorDespues && <div className="pianoRollMenuContextualSeparador" />}
                </div>
            ))}

            {/* Sub-sección: Color */}
            {haySeleccion && (
                <>
                    <div className="pianoRollMenuContextualItem pianoRollMenuContextualTitulo">
                        <Palette size={12} />
                        <span>Color</span>
                    </div>
                    <div className="pianoRollMenuContextualColores">
                        {PALETA_NOTAS.map((color, idx) => (
                            <BotonBase variante="ghost"
                                key={color}
                                className="pianoRollMenuContextualColor"
                                style={{ background: color }}
                                onClick={() => handleColor(idx)}
                                title={`Color ${idx + 1}`}
                            />
                        ))}
                    </div>
                    <div className="pianoRollMenuContextualSeparador" />
                </>
            )}

            {/* Sub-sección: Velocity presets */}
            {haySeleccion && (
                <>
                    <div className="pianoRollMenuContextualItem pianoRollMenuContextualTitulo">
                        <span>Velocity</span>
                    </div>
                    <div className="pianoRollMenuContextualVelocity">
                        {[0.25, 0.5, 0.75, 1.0].map(v => (
                            <BotonBase variante="ghost"
                                key={v}
                                className="pianoRollMenuContextualVelBtn"
                                onClick={() => handleVelocity(v)}
                            >
                                {Math.round(v * 100)}%
                            </BotonBase>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
});

MenuContextualPR.displayName = 'MenuContextualPR';
