/*
 * Service: API cliente base — Kamples
 * Wrapper sobre fetch para las llamadas a /kamples/v1/
 * Centraliza headers, manejo de errores y tipado.
 */

import { crearLogger } from './logger';

const log = crearLogger('ApiCliente');

export interface RespuestaApi<T> {
    ok: boolean;
    data: T | null;
    error: string | null;
    status: number;
}

interface OpcionesPeticion {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    body?: unknown;
    headers?: Record<string, string>;
    params?: Record<string, string | number | boolean | undefined>;
}

/*
 * Construye la URL base del API.
 * Glory inyecta el nonce y la URL base via gloryState en window.
 */
const obtenerBaseUrl = (): string => {
    const glory = (window as Record<string, unknown>).gloryState as
        | { apiUrl?: string; restUrl?: string }
        | undefined;

    if (glory?.apiUrl) return glory.apiUrl;
    if (glory?.restUrl) return glory.restUrl;

    /* Fallback: construcción manual */
    return '/wp-json';
};

const obtenerNonce = (): string => {
    const glory = (window as Record<string, unknown>).gloryState as
        | { nonce?: string }
        | undefined;
    return glory?.nonce ?? '';
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
    const { method = 'GET', body, headers = {}, params } = opciones;
    const baseUrl = obtenerBaseUrl();
    const nonce = obtenerNonce();
    const url = `${baseUrl}/kamples/v1${endpoint}${construirParams(params)}`;

    const config: RequestInit = {
        method,
        headers: {
            'Content-Type': 'application/json',
            ...(nonce ? { 'X-WP-Nonce': nonce } : {}),
            ...headers,
        },
        credentials: 'same-origin',
    };

    if (body && method !== 'GET') {
        config.body = JSON.stringify(body);
    }

    try {
        log.debug(`${method} ${endpoint}`, params);

        const response = await fetch(url, config);
        const json = await response.json();

        if (!response.ok) {
            const mensaje = json?.message ?? `Error ${response.status}`;
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
            data: json.data ?? json,
            error: null,
            status: response.status,
        };
    } catch (err) {
        const mensaje = err instanceof Error ? err.message : 'Error de red';
        log.error(`${method} ${endpoint} → fallo`, err);
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

export const apiDelete = <T>(endpoint: string) =>
    apiPeticion<T>(endpoint, { method: 'DELETE' });
