/*
 * Util: resolverRutaAsset — Kamples (QL46)
 * En Tauri (desktop/Android APK), las rutas relativas al origin no resuelven al servidor
 * porque el WebView carga desde tauri.localhost. Esta función prefija la URL de producción
 * cuando se detecta el entorno Tauri.
 */

const SERVIDOR_PROD = 'https://kamples.com';

const esEntornoTauri = (): boolean =>
    typeof window !== 'undefined' && !!(window as unknown as Record<string, unknown>).__KAMPLES_DESKTOP__;

/**
 * Resuelve una ruta relativa al servidor correcto.
 * En web, retorna la ruta tal cual (relativa al origin).
 * En Tauri/APK, prefija con el servidor de producción.
 */
export const resolverRutaAsset = (rutaRelativa: string): string =>
    esEntornoTauri() ? `${SERVIDOR_PROD}${rutaRelativa}` : rutaRelativa;
