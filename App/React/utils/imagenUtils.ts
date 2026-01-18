/*
 * Utilidades para el sistema de imágenes Glory
 *
 * Facilita la conversión entre rutas hardcodeadas y referencias alias::archivo
 */

/*
 * Mapeo de alias a rutas relativas dentro del tema
 */
export const ALIAS_A_RUTA: Record<string, string> = {
    glory: 'Glory/assets/images',
    colors: 'Glory/assets/images/colors',
    elements: 'Glory/assets/images/elements',
    logos: 'Glory/assets/images/logos',
    tema: 'App/Assets/images'
};

/*
 * Prefijo de URL base del tema
 */
export const TEMA_BASE = '/wp-content/themes/glory/';

/*
 * Construye una referencia de imagen a partir de alias y nombre de archivo
 *
 * @example
 * construirRef('colors', 'imagen.jpg') => 'colors::imagen.jpg'
 */
export function construirRef(alias: string, nombreArchivo: string): string {
    return `${alias}::${nombreArchivo}`;
}

/*
 * Extrae alias y nombre de archivo de una referencia
 *
 * @example
 * parsearRef('colors::imagen.jpg') => { alias: 'colors', archivo: 'imagen.jpg' }
 */
export function parsearRef(ref: string): {alias: string; archivo: string} | null {
    if (!ref.includes('::')) return null;
    const [alias, archivo] = ref.split('::', 2);
    return {alias, archivo};
}

/*
 * Convierte una URL hardcodeada a referencia alias::archivo
 *
 * @example
 * urlARef('/wp-content/themes/glory/Glory/assets/images/colors/abc.jpg')
 * => 'colors::abc.jpg'
 */
export function urlARef(url: string): string | null {
    /* Buscar coincidencia con los alias conocidos */
    for (const [alias, ruta] of Object.entries(ALIAS_A_RUTA)) {
        const rutaCompleta = `${TEMA_BASE}${ruta}/`;
        if (url.includes(rutaCompleta)) {
            const nombreArchivo = url.split(rutaCompleta)[1];
            if (nombreArchivo) {
                return construirRef(alias, nombreArchivo);
            }
        }
    }
    return null;
}

/*
 * Convierte una referencia alias::archivo a URL relativa
 *
 * @example
 * refAUrl('colors::abc.jpg')
 * => '/wp-content/themes/glory/Glory/assets/images/colors/abc.jpg'
 */
export function refAUrl(ref: string): string | null {
    const parsed = parsearRef(ref);
    if (!parsed) return null;

    const ruta = ALIAS_A_RUTA[parsed.alias];
    if (!ruta) return null;

    return `${TEMA_BASE}${ruta}/${parsed.archivo}`;
}

/*
 * Verifica si una cadena es una referencia válida
 */
export function esReferenciaValida(ref: string): boolean {
    const parsed = parsearRef(ref);
    return parsed !== null && parsed.alias in ALIAS_A_RUTA;
}

/*
 * NOTA: El array IMAGENES_COLORS_EJEMPLO y la función refAleatoria
 * fueron eliminados porque ahora existe un sistema dinámico:
 *
 * - Hook useGloryImages: Obtiene imágenes dinámicamente del alias deseado
 * - Endpoint REST: GET /wp-json/glory/v1/images?alias=colors
 * - Endpoint aleatorio: GET /wp-json/glory/v1/images/random?alias=colors&count=5
 *
 * Para obtener imágenes aleatorias, usar:
 *   import { useGloryImages, useImagenAleatoria } from '../hooks';
 *
 *   const { imagenes } = useGloryImages({ alias: 'colors', cantidad: 10, aleatorio: true });
 *   const { imagen } = useImagenAleatoria('colors');
 */
