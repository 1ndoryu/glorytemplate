/*
 * Utilidad: normalizarNombreArchivo — Normalización de nombres para dedup.
 *
 * La papelera renombra archivos con prefijo timestamp: `${Date.now()}_${nombre}`.
 * Esto rompe todas las comparaciones por nombre.
 * Esta utilidad strip el prefijo para que el dedup funcione correctamente.
 *
 * Patrón: 13+ dígitos seguidos de underscore al inicio del nombre.
 * Ejemplo: "1772563989924_Synth Guitar Loop.wav" → "Synth Guitar Loop.wav"
 */

const PREFIJO_PAPELERA = /^\d{13,}_/;

/**
 * Elimina el prefijo timestamp de la papelera si existe.
 * Usado antes de comparaciones de dedup por nombre.
 */
export function normalizarNombreParaDedup(nombre: string): string {
    return nombre.replace(PREFIJO_PAPELERA, '');
}

/**
 * Verifica si una ruta (normalizada con /) pasa por la carpeta .papelera.
 * Usado para rechazar archivos que no deberían encolarse/subirse.
 */
export function esRutaPapelera(ruta: string): boolean {
    const normalizada = ruta.replace(/\\/g, '/');
    return normalizada.split('/').includes('.papelera');
}
