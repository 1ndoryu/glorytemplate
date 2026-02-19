/*
 * Servicio de tema visual de la app.
 * Gestiona lectura, persistencia y aplicación del modo dark/light.
 */

export type TemaApp = 'dark' | 'light';

const CLAVE_STORAGE_TEMA = 'kamples-theme';

function esTemaValido(valor: string | null): valor is TemaApp {
    return valor === 'dark' || valor === 'light';
}

export function aplicarTemaApp(tema: TemaApp): void {
    if (typeof document === 'undefined') return;

    if (tema === 'light') {
        document.documentElement.setAttribute('data-theme', 'light');
        return;
    }

    document.documentElement.removeAttribute('data-theme');
}

export function guardarTemaApp(tema: TemaApp): void {
    if (typeof window === 'undefined') return;
    try {
        window.localStorage.setItem(CLAVE_STORAGE_TEMA, tema);
    } catch {
        /* QuotaExceededError o SecurityError en modo privado/restrictivo */
    }
}

export function obtenerTemaGuardado(): TemaApp | null {
    if (typeof window === 'undefined') return null;

    try {
        const tema = window.localStorage.getItem(CLAVE_STORAGE_TEMA);
        return esTemaValido(tema) ? tema : null;
    } catch {
        /* SecurityError en navegadores restrictivos */
        return null;
    }
}

export function obtenerTemaAppActual(): TemaApp {
    const temaGuardado = obtenerTemaGuardado();
    if (temaGuardado) return temaGuardado;

    if (typeof document !== 'undefined' && document.documentElement.getAttribute('data-theme') === 'light') {
        return 'light';
    }

    return 'dark';
}

export function inicializarTemaApp(): TemaApp {
    const tema = obtenerTemaAppActual();
    aplicarTemaApp(tema);
    return tema;
}
