/*
 * Utilidades para useExploradorPagina.
 * Funciones puras de carpeta/metadata extraídas para cumplir SRP y limite-lineas.
 */

import type { CarpetaInfo } from '@app/services/apiExplorador';
import type { SampleResumen } from '@app/types';

/* Carpeta vacía: el sample está suelto en raíz (sin carpeta asignada) */
export const SIN_CARPETA = '';

/* Extrae carpeta_primaria del metadata de un sample (soporta snake_case y camelCase) */
export function obtenerCarpetaPrimaria(s: SampleResumen): string {
    const meta = s.metadata as Record<string, unknown> | undefined;
    return (meta?.carpeta_primaria ?? meta?.carpetaPrimaria ?? SIN_CARPETA) as string;
}

/* Extrae carpeta_secundaria del metadata */
export function obtenerCarpetaSecundaria(s: SampleResumen): string {
    const meta = s.metadata as Record<string, unknown> | undefined;
    return (meta?.carpeta_secundaria ?? meta?.carpetaSecundaria ?? '') as string;
}

/*
 * Recalcula el árbol de carpetas a partir de la lista de samples.
 * Usada tras mover un sample para actualizar contadores sin API call.
 */
export function recalcularCarpetas(samples: SampleResumen[]): CarpetaInfo[] {
    const mapa = new Map<string, Map<string, number>>();
    for (const s of samples) {
        const pri = obtenerCarpetaPrimaria(s);
        const sec = obtenerCarpetaSecundaria(s);
        if (!mapa.has(pri)) mapa.set(pri, new Map());
        const subMapa = mapa.get(pri)!;
        subMapa.set(sec, (subMapa.get(sec) ?? 0) + 1);
    }
    const resultado: CarpetaInfo[] = [];
    for (const [primaria, subMapa] of mapa) {
        let total = 0;
        const subcarpetas: { nombre: string; total: number }[] = [];
        for (const [nombre, cnt] of subMapa) {
            total += cnt;
            if (nombre) subcarpetas.push({ nombre, total: cnt });
        }
        resultado.push({ primaria, total, subcarpetas });
    }
    resultado.sort((a, b) => a.primaria.localeCompare(b.primaria));
    return resultado;
}
