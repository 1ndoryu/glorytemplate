import {obtenerNonce} from '../utils/notasUtils';
import {Nota, CarpetaNota, RespuestaListaNotas, RespuestaOperacionNota} from '../types/notas';

const API_BASE = '/wp-json/glory/v1/notas';

/**
 * Helper interno para realizar peticiones a la API
 */
async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE}${endpoint}`;

    const defaultOptions: RequestInit = {
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
            'X-WP-Nonce': obtenerNonce()
        }
    };

    const response = await fetch(url, {...defaultOptions, ...options});

    if (!response.ok) {
        if (response.status === 401) {
            throw new Error('No autenticado. Inicia sesión para continuar.');
        }
        if (response.status === 403) {
            throw new Error('Sin permisos para acceder a las notas.');
        }
        throw new Error(`Error del servidor: ${response.status}`);
    }

    return response.json();
}

/**
 * Servicio para interactuar con la API de Notas
 */
export const notasService = {
    /**
     * Carga el listado de notas paginado
     */
    async cargarNotas(limite: number, offset: number): Promise<RespuestaListaNotas> {
        const response = await fetchApi<RespuestaListaNotas>(`?limite=${limite}&offset=${offset}`);
        if (!response.success) {
            throw new Error('Error al cargar notas');
        }
        return response;
    },

    /**
     * Busca notas por término
     */
    async buscarNotas(termino: string): Promise<Nota[]> {
        const response = await fetchApi<{success: boolean; notas: Nota[]}>(`/buscar?q=${encodeURIComponent(termino)}`);
        if (!response.success) {
            return [];
        }
        return response.notas;
    },

    /**
     * Crea una nueva nota
     */
    async crearNota(titulo: string, contenido: string): Promise<Nota> {
        const response = await fetchApi<RespuestaOperacionNota>('', {
            method: 'POST',
            body: JSON.stringify({
                contenido,
                titulo
            })
        });

        if (!response.success) {
            throw new Error('Error al crear nota');
        }
        return response.nota;
    },

    /**
     * Actualiza una nota existente
     */
    async actualizarNota(id: number, titulo: string, contenido: string): Promise<Nota> {
        const response = await fetchApi<RespuestaOperacionNota>(`/${id}`, {
            method: 'PUT',
            body: JSON.stringify({
                contenido,
                titulo
            })
        });

        if (!response.success) {
            throw new Error('Error al actualizar nota');
        }
        return response.nota;
    },

    /**
     * Elimina una nota por ID
     */
    async eliminarNota(id: number): Promise<boolean> {
        const response = await fetchApi<{success: boolean}>(`/${id}`, {
            method: 'DELETE'
        });

        if (!response.success) {
            throw new Error('Error al eliminar nota');
        }
        return true;
    },

    /**
     * Mueve una nota a otra carpeta
     */
    async moverNota(notaId: number, carpetaId: number | null): Promise<boolean> {
        const response = await fetchApi<{success: boolean}>(`/${notaId}/mover`, {
            method: 'PUT',
            body: JSON.stringify({carpetaId})
        });

        if (!response.success) {
            throw new Error('Error al mover nota');
        }
        return true;
    }
};

/*
 * Servicio para carpetas de notas
 */
export const carpetasNotasService = {
    /**
     * Obtiene todas las carpetas del usuario
     */
    async listar(): Promise<CarpetaNota[]> {
        /* GET /notas/carpetas devuelve 'carpetas' (listarCarpetas); el indexador PHP
         * cruza con la última ruta registrada (POST crearCarpeta) que devuelve 'carpeta'. */
        /* sentinel-disable-next-line api-response-mismatch */
        const response = await fetchApi<{success: boolean; carpetas: CarpetaNota[]}>('/carpetas');
        if (!response.success) {
            throw new Error('Error al cargar carpetas');
        }
        return response.carpetas;
    },

    /**
     * Crea una nueva carpeta
     */
    async crear(nombre: string): Promise<CarpetaNota> {
        const response = await fetchApi<{success: boolean; carpeta: CarpetaNota}>('/carpetas', {
            method: 'POST',
            body: JSON.stringify({nombre})
        });

        if (!response.success) {
            throw new Error('Error al crear carpeta');
        }
        return response.carpeta;
    },

    /**
     * Renombra una carpeta
     */
    async renombrar(id: number, nombre: string): Promise<boolean> {
        const response = await fetchApi<{success: boolean}>(`/carpetas/${id}`, {
            method: 'PUT',
            body: JSON.stringify({nombre})
        });

        if (!response.success) {
            throw new Error('Error al renombrar carpeta');
        }
        return true;
    },

    /**
     * Elimina una carpeta (las notas se mueven a General)
     */
    async eliminar(id: number): Promise<boolean> {
        const response = await fetchApi<{success: boolean}>(`/carpetas/${id}`, {
            method: 'DELETE'
        });

        if (!response.success) {
            throw new Error('Error al eliminar carpeta');
        }
        return true;
    }
};
