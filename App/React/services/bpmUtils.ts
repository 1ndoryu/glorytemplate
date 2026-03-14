/*
 * Utilidades de BPM — Kamples
 * Normalizacion de BPM numerico a categorias de velocidad.
 * El BPM crudo se mantiene en la BD; en la UI se muestra la categoria.
 * QK71: Categorias en ingles.
 */

export type CategoriaBpm = 'very slow' | 'slow' | 'normal' | 'fast' | 'very fast';

/* Rangos de velocidad */
export const obtenerCategoriaBpm = (bpm: number | null): CategoriaBpm | null => {
    if (bpm === null || bpm <= 0) return null;
    if (bpm < 70) return 'very slow';
    if (bpm < 100) return 'slow';
    if (bpm < 120) return 'normal';
    if (bpm < 150) return 'fast';
    return 'very fast';
};

/* Etiqueta corta para badges — lowercase sin mayuscula inicial */
export const etiquetaBpm = (bpm: number | null): string => {
    return obtenerCategoriaBpm(bpm) ?? '';
};

/* Rango numerico de cada categoria (para filtros por click) */
export const rangoBpm = (categoria: CategoriaBpm): { min: number; max: number } => {
    switch (categoria) {
        case 'very slow': return { min: 1, max: 69 };
        case 'slow': return { min: 70, max: 99 };
        case 'normal': return { min: 100, max: 119 };
        case 'fast': return { min: 120, max: 149 };
        case 'very fast': return { min: 150, max: 999 };
    }
};
