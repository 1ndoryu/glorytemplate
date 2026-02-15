/*
 * Service: apiSamples — Kamples
 * Funciones de acceso a datos de samples.
 * Conecta directamente con la API real, sin fallback a mock.
 */

import { apiGet, apiPostFormData } from './apiCliente';
import type { RespuestaApi } from './apiCliente';
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
export const listarSamples = async (filtros: FiltrosSamples = {}): Promise<RespuestaApi<RespuestaListaSamples>> => {
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
export const obtenerSample = async (slug: string): Promise<RespuestaApi<Sample>> => {
    return apiGet<Sample>(`/samples/${slug}`);
};

/*
 * Obtiene el feed de descubrimiento con paginación.
 */
export const obtenerFeed = async (
    tipo: 'descubrir' | 'trending' | 'recientes' = 'descubrir',
    page = 1
): Promise<RespuestaApi<SampleResumen[]>> => {
    return apiGet<SampleResumen[]>('/feed', { tipo, page });
};

/* Respuesta del endpoint de subida */
export interface RespuestaSubida {
    ok: boolean;
    sample_id: number | null;
    id_corto: string;
    slug: string;
    url: string;
    estado: string;
}

/* Datos para construir el FormData de subida */
export interface DatosSubida {
    audio: File;
    titulo?: string;
    contenido?: string;
    tags?: string[];
    permitirDescarga?: boolean;
    licenciaLibre?: boolean;
}

/*
 * Sube un sample al backend via multipart/form-data.
 * Endpoint: POST /kamples/v1/samples/upload
 */
export const subirSample = async (datos: DatosSubida): Promise<RespuestaApi<RespuestaSubida>> => {
    const formData = new FormData();

    formData.append('audio', datos.audio, datos.audio.name);

    if (datos.titulo) formData.append('titulo', datos.titulo);
    if (datos.contenido) formData.append('contenido', datos.contenido);
    if (datos.tags && datos.tags.length > 0) {
        formData.append('tags', JSON.stringify(datos.tags));
    }
    formData.append('permitir_descarga', String(datos.permitirDescarga ?? true));
    formData.append('licencia_libre', String(datos.licenciaLibre ?? false));

    return apiPostFormData<RespuestaSubida>('/samples/upload', formData);
};
