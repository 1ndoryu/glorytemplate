/*
 * Service: imagenesColor — Kamples
 * Asigna imagen de portada determinista desde la carpeta colors/.
 * Se usa en TarjetaSample y TarjetaColeccion cuando no hay imagen propia.
 * Array de imágenes extraído a datos/imagenesColorLista.ts para cumplir SRP.
 */

import { IMAGENES_COLOR } from './datos/imagenesColorLista';

const RUTA_RELATIVA = '/wp-content/themes/glorytemplate/colors/';
const SERVIDOR_PROD = 'https://kamples.com';
const TOTAL = IMAGENES_COLOR.length;

/*
 * En Tauri (desktop/Android) las rutas relativas no resuelven al servidor.
 * Se evalua lazily porque __KAMPLES_DESKTOP__ se inyecta en runtime.
 */
function obtenerRutaBase(): string {
    if (typeof window !== 'undefined' && (window as unknown as Record<string, unknown>).__KAMPLES_DESKTOP__) {
        return `${SERVIDOR_PROD}${RUTA_RELATIVA}`;
    }
    return RUTA_RELATIVA;
}

/*
 * Obtiene la URL de una imagen de color determinista basada en un ID numérico.
 * Siempre devuelve la misma imagen para el mismo ID.
 */
export const obtenerImagenColor = (id: number): string => {
    const base = obtenerRutaBase();
    /* Guard: si id es NaN/undefined o no hay imágenes, devolver placeholder */
    if (!Number.isFinite(id) || TOTAL === 0) {
        return `${base}${IMAGENES_COLOR[0] ?? 'placeholder.jpg'}`;
    }
    const indice = ((id % TOTAL) + TOTAL) % TOTAL;
    return `${base}${IMAGENES_COLOR[indice]}`;
};

/*
 * Obtiene la URL de una imagen de color basada en un string (nombre de colección, etc).
 * Hace un hash simple del string para generar un índice determinista.
 */
export const obtenerImagenColorPorTexto = (texto: string): string => {
    const base = obtenerRutaBase();
    let hash = 0;
    for (let i = 0; i < texto.length; i++) {
        hash = ((hash << 5) - hash) + texto.charCodeAt(i);
        hash |= 0;
    }
    const indice = ((hash % TOTAL) + TOTAL) % TOTAL;
    return `${base}${IMAGENES_COLOR[indice]}`;
};
