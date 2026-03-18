/*
 * Utilidades de detección de plataforma — Kamples
 * Centralizan checks de Tauri, Android, desktop para evitar duplicación.
 */

function tieneMarcaDesktop(): boolean {
    return typeof window !== 'undefined' && !!window.__KAMPLES_DESKTOP__;
}

function tieneMarcaMobile(): boolean {
    return typeof window !== 'undefined' && !!window.__KAMPLES_MOBILE__;
}

function tieneBridgeTauri(): boolean {
    return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
}

function obtenerPlataformaCapacitor(): string | null {
    if (typeof window === 'undefined' || !window.Capacitor) {
        return null;
    }

    try {
        const plataforma = window.Capacitor.getPlatform?.();
        return typeof plataforma === 'string' ? plataforma : null;
    } catch {
        return null;
    }
}

function tieneBridgeCapacitor(): boolean {
    if (typeof window === 'undefined' || !window.Capacitor) {
        return false;
    }

    try {
        return !!window.Capacitor.isNativePlatform?.() || obtenerPlataformaCapacitor() !== null;
    } catch {
        return obtenerPlataformaCapacitor() !== null;
    }
}

function tieneClasePlataforma(clase: string): boolean {
    return typeof document !== 'undefined' && document.body.classList.contains(clase);
}

export const esCapacitor = (): boolean =>
    tieneMarcaMobile() || tieneBridgeCapacitor() || tieneClasePlataforma('plataformaCapacitor');

/** Detecta si la app corre dentro de un contexto Tauri (desktop o APK) */
export const esTauri = (): boolean =>
    tieneMarcaDesktop() || tieneBridgeTauri() || tieneClasePlataforma('plataformaTauri');

export const esNativo = (): boolean => esTauri() || esCapacitor();

/** Detecta si la app corre en Android nativo (Tauri anterior o Capacitor actual) */
export const esAndroid = (): boolean =>
    esNativo() && (
        /android/i.test(navigator.userAgent)
        || obtenerPlataformaCapacitor() === 'android'
        || tieneClasePlataforma('plataformaAndroid')
    );

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
