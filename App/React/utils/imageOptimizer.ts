/**
 * Utilidad para optimizar imagenes usando Jetpack Photon CDN.
 *
 * Replica la logica de Glory/src/Utility/ImageUtility.php para React.
 * En produccion, las imagenes se sirven desde el CDN de Photon con:
 * - Calidad ajustable (default 60)
 * - Strip de metadatos
 * - Resize bajo demanda
 *
 * En desarrollo local (localhost), devuelve la URL original.
 */

interface PhotonOptions {
    quality?: number;
    strip?: 'all' | 'info' | 'none';
    width?: number;
    height?: number;
}

/**
 * Verifica si estamos en un entorno local (desarrollo)
 */
function isLocal(): boolean {
    if (typeof window === 'undefined') return true;
    const hostname = window.location.hostname;
    return hostname === 'localhost' || hostname === '127.0.0.1' || hostname.endsWith('.local') || hostname.endsWith('.test');
}

/**
 * Genera una URL optimizada usando Jetpack Photon CDN.
 * En local devuelve la URL original sin modificar.
 *
 * @param url - URL de la imagen (puede ser absoluta o relativa)
 * @param options - Opciones de optimizacion
 * @returns URL optimizada para produccion, o la original en local
 */
export function getPhotonUrl(url: string, options: PhotonOptions = {}): string {
    // En local, devolver URL original
    if (isLocal()) {
        return url;
    }

    // Si la URL esta vacia, devolverla tal cual
    if (!url) {
        return '';
    }

    // Valores por defecto optimizados para fondos
    const quality = options.quality ?? 60;
    const strip = options.strip ?? 'all';

    // Convertir URL relativa a absoluta
    let absoluteUrl = url;
    if (url.startsWith('/')) {
        absoluteUrl = `${window.location.origin}${url}`;
    }

    // Parsear la URL
    let cdnUrl: string;
    try {
        const parsed = new URL(absoluteUrl);

        // Si ya es una URL de Photon, usarla directamente
        if (/^i\d\.wp\.com$/.test(parsed.hostname)) {
            cdnUrl = absoluteUrl.split('?')[0]; // Quitar query params existentes
        } else {
            // Convertir a URL de Photon
            const path = parsed.hostname + parsed.pathname;
            cdnUrl = `https://i0.wp.com/${path}`;
        }
    } catch {
        // Si no es una URL valida, devolverla tal cual
        return url;
    }

    // Construir query params
    const params = new URLSearchParams();
    params.set('quality', String(quality));
    params.set('strip', strip);

    if (options.width && options.height) {
        params.set('resize', `${options.width},${options.height}`);
    } else if (options.width) {
        params.set('w', String(options.width));
    } else if (options.height) {
        params.set('h', String(options.height));
    }

    return `${cdnUrl}?${params.toString()}`;
}

/**
 * Genera la URL optimizada para una imagen de fondo.
 * Usa configuracion especifica para fondos decorativos:
 * - Calidad 40 (suficiente para imagenes con opacity-40)
 * - Strip all (sin metadatos)
 * - Ancho maximo 1920px (evita descargar imagenes enormes)
 *
 * @param imageFileName - Nombre del archivo de imagen en /Glory/assets/images/colors/
 * @returns URL optimizada lista para usar en CSS/React
 */
export function getBackgroundImageUrl(imageFileName: string): string {
    const basePath = '/wp-content/themes/glory/Glory/assets/images/colors';
    const url = `${basePath}/${imageFileName}`;

    return getPhotonUrl(url, {
        quality: 40, // Reducido de 60 a 40 (imagenes decorativas con opacity-40)
        strip: 'all',
        width: 1920 // Ancho maximo para evitar descargar imagenes gigantes
    });
}
