/*
 * Service: API cliente base — Kamples
 * Wrapper sobre fetch para las llamadas a /kamples/v1/
 * Centraliza headers, manejo de errores y tipado.
 */

import { crearLogger } from './logger';

const log = crearLogger('ApiCliente');
const LS_KEY_TOKEN = 'kamples_auth_token';

export interface RespuestaApi<T> {
    ok: boolean;
    data: T | null;
    error: string | null;
    status: number;
    /* Preservado cuando el servidor retorna un total de pagiación en la raiz */
    total?: number;
    /* [183A-62] Indica si hay más registros anteriores (cursor pagination) */
    hayMas?: boolean;
    /* QK66: Conteo de registros por estado (admin tables) */
    estadosCuenta?: Record<string, number>;
}

interface OpcionesPeticion {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    body?: unknown;
    headers?: Record<string, string>;
    params?: Record<string, string | number | boolean | undefined>;
    signal?: AbortSignal;
    /* [183A-78] Omite X-WP-Nonce para endpoints que no requieren auth (login, registro).
     * Previene "cookie check failed" cuando existen cookies stale de sesión anterior. */
    omitirNonce?: boolean;
}

/*
 * Construye la URL base del API.
 * Glory inyecta el nonce y la URL base via GLORY_CONTEXT en window.
 */
const obtenerBaseUrl = (): string => {
    const glory = (window as unknown as Record<string, unknown>).GLORY_CONTEXT as
        | { apiUrl?: string; restUrl?: string }
        | undefined;

    const raw = glory?.apiUrl ?? glory?.restUrl ?? '/wp-json';
    /* Elimina slash final para evitar doble barra al concatenar /kamples/v1 */
    return raw.replace(/\/+$/, '');
};

const obtenerNonce = (): string => {
    const glory = (window as unknown as Record<string, unknown>).GLORY_CONTEXT as
        | { nonce?: string }
        | undefined;
    return glory?.nonce ?? '';
};

const obtenerTokenNativo = (): string => {
    if (typeof window === 'undefined') return '';

    const esDesktop = !!(window as Window).__KAMPLES_DESKTOP__;
    const esCapacitor = (() => {
        try {
            return !!window.Capacitor?.isNativePlatform?.();
        } catch {
            return false;
        }
    })();

    if (!esDesktop && !esCapacitor) return '';

    try {
        return localStorage.getItem(LS_KEY_TOKEN) ?? '';
    } catch {
        return '';
    }
};

/*
 * Construye query string desde un objeto de parámetros.
 * Ignora valores undefined.
 */
const construirParams = (params?: Record<string, string | number | boolean | undefined>): string => {
    if (!params) return '';

    const entries = Object.entries(params)
        .filter(([, v]) => v !== undefined && v !== '')
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);

    return entries.length > 0 ? `?${entries.join('&')}` : '';
};

/*
 * Función principal de peticiones HTTP.
 * Retorna un objeto tipado con data o error.
 */
export const apiPeticion = async <T>(
    endpoint: string,
    opciones: OpcionesPeticion = {}
): Promise<RespuestaApi<T>> => {
    const { method = 'GET', body, headers = {}, params, signal, omitirNonce = false } = opciones;
    const baseUrl = obtenerBaseUrl();
    const nonce = omitirNonce ? '' : obtenerNonce();
    const tokenNativo = obtenerTokenNativo();
    const url = `${baseUrl}/kamples/v1${endpoint}${construirParams(params)}`;

    /*
     * Si el body es FormData, no setear Content-Type (el navegador lo hace con boundary).
     * Si es un objeto normal, serializar como JSON.
     */
    const esFormData = body instanceof FormData;

    const config: RequestInit = {
        method,
        headers: {
            ...(esFormData ? {} : { 'Content-Type': 'application/json' }),
            ...(nonce ? { 'X-WP-Nonce': nonce } : {}),
            ...(tokenNativo ? {
                Authorization: `Bearer ${tokenNativo}`,
                'X-Kamples-Auth': `Bearer ${tokenNativo}`,
            } : {}),
            ...headers,
        },
        credentials: 'same-origin',
        /* [193A-28] Evitar cache HTTP del navegador en todas las peticiones API.
         * Sin esto, el browser puede servir respuestas cacheadas del feed,
         * causando que la primera página parezca "congelada". */
        cache: 'no-store',
        ...(signal ? { signal } : {}),
    };

    if (body && method !== 'GET') {
        config.body = esFormData ? body : JSON.stringify(body);
    }

    try {
        log.debug(`${method} ${endpoint}`, params);

        const response = await fetch(url, config);

        /*
         * Leer como texto primero para detectar respuestas HTML (errores WP/proxy).
         * Si el body empieza con '<', lo reporta como error en vez de crashear json().
         */
        const texto = await response.text();

        const textoTrimmed = texto.trimStart();
        if (textoTrimmed.startsWith('<!DOCTYPE') || textoTrimmed.startsWith('<html') || textoTrimmed.startsWith('<?xml') || textoTrimmed.startsWith('<br') || textoTrimmed.startsWith('<b>')) {
            log.error(`${method} ${endpoint} → respuesta HTML inesperada (status ${response.status})`, {
                preview: texto.slice(0, 300),
                url,
                status: response.status,
            });
            return {
                ok: false,
                data: null,
                error: `Error del servidor (${response.status}). Revisa los logs de PHP.`,
                status: response.status,
            };
        }

        let json: Record<string, unknown>;
        try {
            json = JSON.parse(texto);
        } catch {
            log.warn(`${method} ${endpoint} → JSON inválido`, texto.slice(0, 200));
            return {
                ok: false,
                data: null,
                error: 'Respuesta del servidor no es JSON válido',
                status: response.status,
            };
        }

        if (!response.ok) {
            const mensaje = (json?.message as string) ?? (json?.error as string) ?? `Error ${response.status}`;
            log.warn(`${method} ${endpoint} → ${response.status}`, mensaje);
            return {
                ok: false,
                data: null,
                error: mensaje,
                status: response.status,
            };
        }

        return {
            ok: true,
            data: (json.data ?? json) as T,
            error: null,
            status: response.status,
            ...(typeof json.total === 'number' ? { total: json.total } : {}),
            ...(typeof json.hayMas === 'boolean' ? { hayMas: json.hayMas } : {}),
            ...(json.estadosCuenta && typeof json.estadosCuenta === 'object'
                ? { estadosCuenta: json.estadosCuenta as Record<string, number> }
                : {}),
        };
    } catch (err) {
        /* AbortError es esperado cuando se cancela un request por debounce o unmount */
        if (err instanceof DOMException && err.name === 'AbortError') {
            log.debug(`${method} ${endpoint} → cancelado (AbortController)`);
            return {
                ok: false,
                data: null,
                error: 'Solicitud cancelada',
                status: 0,
            };
        }

        const mensaje = err instanceof Error ? err.message : 'Error de red';
        /* [193A-100] GET transitorios (keep-alive timeout, ERR_CONNECTION_CLOSED) son comunes
         * y se auto-recuperan en el siguiente poll. Solo warn, no error. */
        const esTransitorio = method === 'GET' && err instanceof TypeError;
        if (esTransitorio) {
            log.warn(`${method} ${endpoint} → fallo transitorio`, mensaje);
        } else {
            log.error(`${method} ${endpoint} → fallo`, err);
        }
        return {
            ok: false,
            data: null,
            error: mensaje,
            status: 0,
        };
    }
};

/* Atajos tipados */
export const apiGet = <T>(endpoint: string, params?: Record<string, string | number | boolean | undefined>) =>
    apiPeticion<T>(endpoint, { method: 'GET', params });

export const apiPost = <T>(endpoint: string, body?: unknown) =>
    apiPeticion<T>(endpoint, { method: 'POST', body });

export const apiPut = <T>(endpoint: string, body?: unknown) =>
    apiPeticion<T>(endpoint, { method: 'PUT', body });

export const apiDelete = <T>(endpoint: string, body?: unknown) =>
    apiPeticion<T>(endpoint, { method: 'DELETE', body });

/* POST con FormData (multipart/form-data) — para uploads de archivos */
export const apiPostFormData = <T>(endpoint: string, formData: FormData) =>
    apiPeticion<T>(endpoint, { method: 'POST', body: formData as unknown });
