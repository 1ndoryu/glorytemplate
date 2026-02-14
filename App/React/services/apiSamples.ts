/*
 * Service: apiSamples — Kamples
 * Funciones de acceso a datos de samples.
 */

import { apiGet, apiPost } from './apiCliente';
import type { SampleResumen, Sample } from '../types';

export interface PaginacionSamples {
    page: number;
    per_page: number;
    total: number;
    pages: number;
}

export interface RespuestaListaSamples {
    data: SampleResumen[];
    pagination: PaginacionSamples;
}

export interface FiltrosSamples {
    busqueda?: string;
    genero?: string;
    bpmMin?: number;
    bpmMax?: number;
    key?: string;
    tipo?: string;
    page?: number;
    perPage?: number;
}

/*
 * Lista samples con filtros y paginación.
 */
export const listarSamples = async (filtros: FiltrosSamples = {}) => {
    return apiGet<RespuestaListaSamples>('/samples', {
        page: filtros.page ?? 1,
        per_page: filtros.perPage ?? 20,
        busqueda: filtros.busqueda,
        genero: filtros.genero,
        bpm_min: filtros.bpmMin,
        bpm_max: filtros.bpmMax,
        key: filtros.key,
        tipo: filtros.tipo,
    });
};

/*
 * Obtiene un sample individual por slug.
 */
export const obtenerSample = async (slug: string) => {
    return apiGet<Sample>(`/samples/${slug}`);
};

/*
 * Obtiene el feed de descubrimiento.
 */
export const obtenerFeed = async (tipo: 'descubrir' | 'trending' | 'recientes' = 'descubrir', page = 1) => {
    return apiGet<SampleResumen[]>('/feed', { tipo, page });
};

/*
 * Subir un sample (TO-DO: implementar con FormData cuando el pipeline esté listo).
 */
export const subirSample = async (datos: FormData) => {
    /* TO-DO: endpoint POST /samples con multipart */
    return apiPost<Sample>('/samples', datos);
};
