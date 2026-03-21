/*
 * [2103A-10] Hook: useBadgeDebugScore
 * Lógica de construcción de líneas del tooltip debug de scoring.
 * Extraído de BadgeDebugScore para cumplir límite de lógica por componente.
 */

import type { ScoreDebug } from '@app/types';

export function useBadgeDebugScore(debug: ScoreDebug): { scoreDisplay: string; esSerendipia: boolean; lineas: string[] } {
    const scoreDisplay = debug.total.toFixed(2);
    const esSerendipia = debug.serendipia;
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
        /* [2103A-10] Mostrar minutos cuando < 1h (antes toFixed(0) mostraba "0h" engañoso) */
        let tiempoDisplay: string;
        if (horas < 1) {
            tiempoDisplay = `${Math.round(horas * 60)}min`;
        } else if (horas < 24) {
            tiempoDisplay = `${horas.toFixed(1)}h`;
        } else {
            tiempoDisplay = `${(horas / 24).toFixed(1)}d`;
        }
        if (horas < 72) {
            lineas.push(`🕒 Publicado hace ${tiempoDisplay} — boost reciente ×${debug.boostReciente}`);
        } else {
            lineas.push(`🕒 Publicado hace ${tiempoDisplay} — sin boost reciente`);
        }
    }

    if (debug.rn > 3) {
        const penalizacion = Math.max(0.3, 1.0 - (debug.rn - 3) * 0.15);
        lineas.push(`👥 ${debug.rn}° del mismo creador — diversidad ×${penalizacion.toFixed(2)}`);
    } else if (debug.rn > 0) {
        lineas.push(`👥 ${debug.rn}° del mismo creador — sin penalización`);
    }

    if (debug.generoDiversidad) {
        if (debug.rnGenero > 4) {
            const penGenero = Math.max(0.5, 1.0 - (debug.rnGenero - 4) * 0.10);
            lineas.push(`🎵 ${debug.rnGenero}° de "${debug.generoDiversidad}" — diversidad género ×${penGenero.toFixed(2)}`);
        } else if (debug.rnGenero > 0) {
            lineas.push(`🎵 ${debug.rnGenero}° de "${debug.generoDiversidad}" — sin penalización`);
        }
    }

    /* [213A-3] Diversidad por tipo */
    if (debug.rnTipo > 5) {
        const penTipo = Math.max(0.5, 1.0 - (debug.rnTipo - 5) * 0.12);
        lineas.push(`🔁 ${debug.rnTipo}° oneshot — diversidad tipo ×${penTipo.toFixed(2)}`);
    } else if (debug.rnTipo > 0) {
        lineas.push(`🔁 ${debug.rnTipo}° oneshot — sin penalización`);
    }

    /* [2103A-19] Diversidad por colección */
    if (debug.rnColeccion > 3) {
        const penCol = Math.max(0.40, 1.0 - (debug.rnColeccion - 3) * 0.18);
        lineas.push(`📁 ${debug.rnColeccion}° de la misma colección — diversidad ×${penCol.toFixed(2)}`);
    } else if (debug.rnColeccion > 0) {
        lineas.push(`📁 ${debug.rnColeccion}° de la misma colección — sin penalización`);
    }

    return { scoreDisplay, esSerendipia, lineas };
}
