/*
 * photonUrl — equivalente React de ImageUtility::jetpack_photon_url() de Glory.
 * Convierte URLs de uploads de WordPress a URLs de Jetpack Photon CDN (i0.wp.com)
 * con resize, quality y strip como parámetros.
 *
 * [183A-40] Usado por ImgOptimizada para optimizar imágenes automáticamente.
 * [193A-92] Rutas relativas (ej. /wp-content/themes/.../colors/) se convierten
 *   a absolutas con window.location.origin para que Photon las procese.
 * Gotcha: En desarrollo local (localhost) devolver la URL sin modificar.
 */

interface PhotonOpciones {
    w?: number;
    h?: number;
    quality?: number;
    fit?: 'cover' | 'contain';
}

const PATRON_YA_PHOTON = /^https?:\/\/i\d\.wp\.com\//;

const esUrlAbsoluta = (url: string): boolean =>
    url.startsWith('http://') || url.startsWith('https://');

const esLocalhost = (): boolean =>
    typeof window !== 'undefined' && (
        window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1'
    );

export function photonUrl(url: string, opciones: PhotonOpciones = {}): string {
    /* Casos donde no aplica Photon */
    if (!url || esLocalhost()) return url;
    if (url.startsWith('data:')) return url;

    /* [193A-92] Rutas relativas → absolutas para que Photon pueda procesarlas */
    if (!esUrlAbsoluta(url) && url.startsWith('/') && typeof window !== 'undefined') {
        url = `${window.location.origin}${url}`;
    }

    if (!esUrlAbsoluta(url)) return url;

    let cdnUrl: string;

    if (PATRON_YA_PHOTON.test(url)) {
        /* Ya es Photon — limpiar params existentes para reescribir */
        try {
            const parsed = new URL(url);
            parsed.searchParams.delete('w');
            parsed.searchParams.delete('h');
            parsed.searchParams.delete('quality');
            parsed.searchParams.delete('strip');
            parsed.searchParams.delete('resize');
            cdnUrl = parsed.toString();
        } catch {
            cdnUrl = url;
        }
    } else {
        /* Construir URL Photon desde URL original */
        try {
            const parsed = new URL(url);
            const path = parsed.hostname + parsed.pathname;
            cdnUrl = `https://i0.wp.com/${path}`;
        } catch {
            return url;
        }
    }

    /* Agregar parámetros de optimización */
    try {
        const final = new URL(cdnUrl);
        final.searchParams.set('strip', 'all');
        if (opciones.quality !== undefined) {
            final.searchParams.set('quality', String(Math.min(100, Math.max(1, opciones.quality))));
        }
        if (opciones.w !== undefined && opciones.h !== undefined) {
            const modo = opciones.fit === 'contain' ? 'fit' : 'resize';
            final.searchParams.set(modo, `${opciones.w},${opciones.h}`);
        } else if (opciones.w !== undefined) {
            final.searchParams.set('w', String(opciones.w));
        }
        return final.toString();
    } catch {
        return cdnUrl;
    }
}
