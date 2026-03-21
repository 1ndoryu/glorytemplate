/*
 * [193A-31] BadgeDebugScore — Badge de debug que muestra el score del algoritmo.
 * Solo visible para admin con debug activo. Cero costo cuando apagado.
 *
 * Badge pequeño con el score redondeado. Tooltip al hover con detalles
 * del scoring en formato humano: serendipia, multiplicadores activos, etc.
 * [2103A-10] Lógica extraída a useBadgeDebugScore para cumplir límite Sentinel.
 */

import { useState } from 'react';
import type { ScoreDebug } from '@app/types';
import { useBadgeDebugScore } from '@app/hooks/useBadgeDebugScore';
import '../../styles/componentes/badgeDebugScore.css';

interface BadgeDebugScoreProps {
    debug: ScoreDebug;
}

export const BadgeDebugScore = ({ debug }: BadgeDebugScoreProps): JSX.Element => {
    const [visible, setVisible] = useState(false);
    const { scoreDisplay, esSerendipia, lineas } = useBadgeDebugScore(debug);

    return (
        <span
            className={`badgeDebugScore ${esSerendipia ? 'badgeDebugScoreSerendipia' : ''}`}
            onMouseEnter={() => setVisible(true)}
            onMouseLeave={() => setVisible(false)}
        >
            {scoreDisplay}
            {visible && (
                <div className="badgeDebugScoreTooltip">
                    {lineas.map((linea, i) => (
                        <div key={i} className="badgeDebugScoreLinea">{linea}</div>
                    ))}
                </div>
            )}
        </span>
    );
};
