/*
 * [193A-31] BadgeDebugScore — Badge de debug que muestra el score del algoritmo.
 * Solo visible para admin con debug activo. Cero costo cuando apagado.
 *
 * Badge pequeño con el score redondeado. Tooltip al hover con detalles
 * del scoring en formato humano: serendipia, multiplicadores activos, etc.
 */

import { useState } from 'react';
import type { ScoreDebug } from '@app/types';
import '../../styles/componentes/badgeDebugScore.css';

interface BadgeDebugScoreProps {
    debug: ScoreDebug;
}

export const BadgeDebugScore = ({ debug }: BadgeDebugScoreProps): JSX.Element => {
    const [visible, setVisible] = useState(false);

    const scoreDisplay = debug.total.toFixed(2);
    const esSerendipia = debug.serendipia;

    /* Construir líneas de explicación humana */
    const lineas: string[] = [];

    lineas.push(`Score total: ${debug.total.toFixed(4)}`);

    if (esSerendipia) {
        lineas.push('🎲 Serendipia — inyectado para diversificar');
    }

    if (debug.verificado) {
        lineas.push('✓ Verificado — boost ×1.15');
    }

    if (!debug.tieneEmbedding) {
        lineas.push('⚠ Sin embedding IA — penalización ×0.5');
    }

    if (debug.horasPublicacion !== null) {
        const horas = debug.horasPublicacion;
        if (horas < 24) {
            lineas.push(`🕒 Publicado hace ${horas.toFixed(0)}h — boost reciente ×${debug.boostReciente}`);
        } else if (horas < 72) {
            lineas.push(`🕒 Publicado hace ${(horas / 24).toFixed(1)}d — boost reciente ×${debug.boostReciente}`);
        } else {
            lineas.push(`🕒 Publicado hace ${(horas / 24).toFixed(0)}d — sin boost reciente`);
        }
    }

    if (debug.rn > 3) {
        const penalizacion = Math.max(0.3, 1.0 - (debug.rn - 3) * 0.15);
        lineas.push(`👥 ${debug.rn}° del mismo creador — diversidad ×${penalizacion.toFixed(2)}`);
    } else if (debug.rn > 0) {
        lineas.push(`👥 ${debug.rn}° del mismo creador — sin penalización`);
    }

    /* [193A-33] Diversidad por género/categoría */
    if (debug.generoDiversidad) {
        if (debug.rnGenero > 4) {
            const penGenero = Math.max(0.5, 1.0 - (debug.rnGenero - 4) * 0.10);
            lineas.push(`🎵 ${debug.rnGenero}° de "${debug.generoDiversidad}" — diversidad género ×${penGenero.toFixed(2)}`);
        } else if (debug.rnGenero > 0) {
            lineas.push(`🎵 ${debug.rnGenero}° de "${debug.generoDiversidad}" — sin penalización`);
        }
    }

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
