/*
 * Cliente API centralizado.
 * Maneja la URL base, headers comunes (nonce) y parseo de respuestas.
 */

interface ApiOptions extends RequestInit {
    params?: Record<string, string | number | boolean | null>;
}

export const apiClient = {
    async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
        return request<T>(endpoint, {method: 'GET', params});
    },

    async post<T>(endpoint: string, data: any): Promise<T> {
        return request<T>(endpoint, {
            method: 'POST',
            body: JSON.stringify(data),
            headers: {'Content-Type': 'application/json'}
        });
    },

    async put<T>(endpoint: string, data: any): Promise<T> {
        return request<T>(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data),
            headers: {'Content-Type': 'application/json'}
        });
    },

    async delete<T>(endpoint: string): Promise<T> {
        return request<T>(endpoint, {method: 'DELETE'});
    }
};

async function request<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
    const {params, headers, ...customConfig} = options;

    // Obtener configuración desde window (o defaults para dev local)
    const apiRoot = window.gloryApiSettings?.root || 'http://glorybuilder.local/wp-json/';
    const nonce = window.gloryApiSettings?.nonce || '';

    // Asegurar que no haya doble slash
    const baseUrl = apiRoot.endsWith('/') ? apiRoot : `${apiRoot}/`;
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;

    let url = `${baseUrl}${cleanEndpoint}`;

    if (params) {
        // Filtrar nulos/undefined
        const cleanParams = Object.entries(params)
            .filter(([_, val]) => val !== null && val !== undefined)
            .map(([key, val]) => [key, String(val)]);

        if (cleanParams.length > 0) {
            const queryString = new URLSearchParams(cleanParams).toString();
            url += (url.includes('?') ? '&' : '?') + queryString;
        }
    }

    const config: RequestInit = {
        ...customConfig,
        headers: {
            'X-WP-Nonce': nonce,
            Accept: 'application/json',
            ...(headers || {})
        }
    };

    try {
        const response = await fetch(url, config);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
        }

        // Manejar respuesta 204 No Content
        if (response.status === 204) return {} as T;

        return await response.json();
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}
