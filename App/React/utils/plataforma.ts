/*
 * Utilidades de detección de plataforma — Kamples
 * Centralizan checks de Tauri, Android, desktop para evitar duplicación.
 */

/** Detecta si la app corre dentro de un contexto Tauri (desktop o APK) */
export const esTauri = (): boolean =>
    typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

/** Detecta si la app corre en Android (APK Tauri) */
export const esAndroid = (): boolean =>
    esTauri() && /android/i.test(navigator.userAgent);

/** Detecta si la app corre en desktop Tauri (Windows/Mac/Linux) */
export const esEscritorio = (): boolean =>
    esTauri() && !esAndroid();

/**
 * Abre un enlace en el navegador externo del sistema.
 * En Tauri usa plugin-shell open(), en web usa window.open().
 */
export async function abrirEnlaceExterno(url: string): Promise<void> {
    try {
        if (esTauri()) {
            const { open } = await import('@tauri-apps/plugin-shell');
            await open(url);
            return;
        }
    } catch {
        /* Fallback a window.open si plugin-shell falla */
    }
    window.open(url, '_blank', 'noopener,noreferrer');
}
