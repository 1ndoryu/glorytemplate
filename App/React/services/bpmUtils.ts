/*
 * Utilidades de BPM — Kamples
 * Normalización de BPM numérico a categorías de velocidad.
 * El BPM crudo se mantiene en la BD; en la UI se muestra la categoría.
 */

export type CategoriaBpm = 'muy lento' | 'lento' | 'normal' | 'rápido' | 'muy rápido';

/* Rangos de velocidad */
export const obtenerCategoriaBpm = (bpm: number | null): CategoriaBpm | null => {
    if (bpm === null || bpm <= 0) return null;
    if (bpm < 70) return 'muy lento';
    if (bpm < 100) return 'lento';
    if (bpm < 120) return 'normal';
    if (bpm < 150) return 'rápido';
    return 'muy rápido';
};

/* Etiqueta corta para badges */
export const etiquetaBpm = (bpm: number | null): string => {
    const categoria = obtenerCategoriaBpm(bpm);
    if (!categoria) return '';
    const mapa: Record<CategoriaBpm, string> = {
        'muy lento': 'Muy lento',
        'lento': 'Lento',
        'normal': 'Normal',
        'rápido': 'Rápido',
        'muy rápido': 'Muy rápido',
    };
    return mapa[categoria];
};

/* Rango numérico de cada categoría (para filtros por click) */
export const rangoBpm = (categoria: CategoriaBpm): { min: number; max: number } => {
    switch (categoria) {
        case 'muy lento': return { min: 1, max: 69 };
        case 'lento': return { min: 70, max: 99 };
        case 'normal': return { min: 100, max: 119 };
        case 'rápido': return { min: 120, max: 149 };
        case 'muy rápido': return { min: 150, max: 999 };
    }
};
