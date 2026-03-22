/*
 * Servicio: apiExplorador — Kamples (C281)
 * Gestiona la obtención de samples coleccionados (descargados + subidos)
 * y la estructura de carpetas del usuario para la página Explorador.
 */

import { apiGet, apiPut } from './apiCliente';
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
    carpeta = '',
    orden = 'recientes',
    busqueda = '',
    soloEncanta = false,
    soloLike = false
): Promise<RespuestaApi<RespuestaColeccionados>> => {
    try {
        const params: Record<string, string | number | boolean | undefined> = { page, per_page: perPage, orden };
        if (carpeta) params.carpeta = carpeta;
        if (busqueda) params.busqueda = busqueda;
        if (soloEncanta) params.solo_encanta = true;
        if (soloLike) params.solo_like = true;
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

/* Respuesta del endpoint PUT /me/coleccionados/{id}/carpeta */
export interface RespuestaMoverSample {
    movido: boolean;
    sampleId: number;
    carpetaPrimaria: string;
    carpetaSecundaria: string;
}

/*
 * Mover un sample a otra carpeta (cambiar metadata carpeta_primaria/secundaria).
 * Endpoint: PUT /me/coleccionados/{id}/carpeta
 * C338: Explorador como file-manager real.
 */
export const moverSampleACarpeta = async (
    sampleId: number,
    carpetaPrimaria: string,
    carpetaSecundaria = ''
): Promise<RespuestaApi<RespuestaMoverSample>> => {
    try {
        return await apiPut<RespuestaMoverSample>(
            `/me/coleccionados/${sampleId}/carpeta`,
            { carpeta_primaria: carpetaPrimaria, carpeta_secundaria: carpetaSecundaria }
        );
    } catch (err) {
        log.error('Error moviendo sample a carpeta', err);
        return { ok: false, data: null, error: 'Error de red', status: 500 };
    }
};

/*
 * Restaurar un sample a su carpeta original asignada por la IA.
 * Lee ia_carpeta_primaria/ia_carpeta_secundaria del metadata y llama al endpoint de mover.
 * Retorna null si el sample no tiene datos de carpeta IA (samples antiguos sin el campo).
 */
export const restaurarCarpetaOriginal = async (
    sampleId: number,
    iaCarpetaPrimaria: string,
    iaCarpetaSecundaria: string
): Promise<RespuestaApi<RespuestaMoverSample>> => {
    return moverSampleACarpeta(sampleId, iaCarpetaPrimaria, iaCarpetaSecundaria);
};
