/**
 * getNonce - Utilidad para obtener el nonce de WordPress para REST API
 *
 * Busca el nonce en múltiples fuentes posibles:
 * 1. wpApiSettings (inyectado por ContentAI loader)
 * 2. Meta tag wp-api-nonce
 * 3. gloryReactContent (fallback legacy)
 */

interface WindowWithNonce extends Window {
    wpApiSettings?: {nonce?: string; root?: string};
    gloryReactContent?: {nonce?: string};
}

export function getWpNonce(): string {
    const win = window as unknown as WindowWithNonce;

    /* Opcion 1: wpApiSettings (estandar de WordPress) */
    if (win.wpApiSettings?.nonce) {
        return win.wpApiSettings.nonce;
    }

    /* Opcion 2: Meta tag */
    const nonceElement = document.querySelector('meta[name="wp-api-nonce"]');
    if (nonceElement) {
        const content = nonceElement.getAttribute('content');
        if (content) {
            return content;
        }
    }

    /* Opcion 3: gloryReactContent (legacy) */
    if (win.gloryReactContent?.nonce) {
        return win.gloryReactContent.nonce;
    }

    console.warn('[getNonce] No se encontro el nonce de WordPress');
    return '';
}
