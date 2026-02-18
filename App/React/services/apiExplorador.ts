/*
 * Servicio: apiExplorador — Kamples (C281)
 * Gestiona la obtención de samples coleccionados (descargados + subidos)
 * y la estructura de carpetas del usuario para la página Explorador.
 */

import { apiGet } from './apiCliente';
import type { RespuestaApi } from './apiCliente';
import type { SampleResumen } from '../types';
import { crearLogger } from './logger';

const log = crearLogger('apiExplorador');

/* Subcarpeta dentro de una carpeta primaria */
export interface SubcarpetaInfo {
    nombre: string;
    total: number;
}

/* Carpeta primaria con sus subcarpetas y conteo */
export interface CarpetaInfo {
    primaria: string;
    total: number;
    subcarpetas: SubcarpetaInfo[];
}

/* Paginación estándar */
export interface PaginacionColeccionados {
    page: number;
    per_page: number;
    total: number;
    pages: number;
}

/* Respuesta del endpoint /me/coleccionados */
export interface RespuestaColeccionados {
    data: SampleResumen[];
    pagination: PaginacionColeccionados;
}

/*
 * Obtener samples coleccionados con filtro opcional por carpeta.
 * Endpoint: GET /me/coleccionados
 */
export const obtenerColeccionados = async (
    page = 1,
    perPage = 100,
    carpeta = ''
): Promise<RespuestaApi<RespuestaColeccionados>> => {
    try {
        const params: Record<string, string | number | boolean | undefined> = { page, per_page: perPage };
        if (carpeta) params.carpeta = carpeta;
        return await apiGet<RespuestaColeccionados>('/me/coleccionados', params);
    } catch (err) {
        log.error('Error obteniendo coleccionados', err);
        return { ok: false, data: null, error: 'Error de red', status: 500 };
    }
};

/*
 * Obtener estructura de carpetas del usuario.
 * Endpoint: GET /me/coleccionados/carpetas
 */
export const obtenerCarpetas = async (): Promise<RespuestaApi<CarpetaInfo[]>> => {
    try {
        return await apiGet<CarpetaInfo[]>('/me/coleccionados/carpetas');
    } catch (err) {
        log.error('Error obteniendo carpetas', err);
        return { ok: false, data: null, error: 'Error de red', status: 500 };
    }
};
