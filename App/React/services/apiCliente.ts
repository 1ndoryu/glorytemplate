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
            ...headers,
        },
        credentials: 'same-origin',
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
            const mensaje = (json?.message as string) ?? `Error ${response.status}`;
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

/* POST con FormData (multipart/form-data) — para uploads de archivos */
export const apiPostFormData = <T>(endpoint: string, formData: FormData) =>
    apiPeticion<T>(endpoint, { method: 'POST', body: formData as unknown });
