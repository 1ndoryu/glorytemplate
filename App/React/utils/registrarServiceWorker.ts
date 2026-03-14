/*
 * QK86: Registro del Service Worker de push notifications.
 *
 * Se ejecuta una sola vez al cargar la app. Registra sw-push.js desde
 * la raíz del dominio para tener scope global sobre todas las páginas.
 *
 * En desktop (Tauri) no se registra porque push no aplica (no hay
 * browser push API en el webview nativo).
 */

const ES_DESKTOP = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

export function registrarServiceWorker(): void {
    if (ES_DESKTOP) return;
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;

    /* No bloquear el render — registrar después del load */
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw-push.js', { scope: '/' }).catch((error) => {
            /* No es crítico — push no funcionará pero la app sí */
            console.warn('[SW Push] No se pudo registrar el Service Worker:', error);
        });
    }, { once: true });
}
