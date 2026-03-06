/*
 * Service: apiSamples — Kamples
 * Funciones de acceso a datos de samples.
 * Conecta directamente con la API real, sin fallback a mock.
 */

import { apiGet, apiPostFormData, apiDelete, apiPut } from './apiCliente';
import type { RespuestaApi } from './apiCliente';
import type { SampleResumen, Sample } from '../types';
import type { CategoriaTag } from './tagUtils';

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
    creador?: string;
    page?: number;
    perPage?: number;
}

/*
 * Lista samples con filtros y paginación.
 */
export const listarSamples = async (filtros: FiltrosSamples = {}): Promise<RespuestaApi<RespuestaListaSamples>> => {
    return apiGet<RespuestaListaSamples>('/samples', {
        page: filtros.page ?? 1,
        per_page: filtros.perPage ?? 12,
        busqueda: filtros.busqueda,
        genero: filtros.genero,
        bpm_min: filtros.bpmMin,
        bpm_max: filtros.bpmMax,
        key: filtros.key,
        tipo: filtros.tipo,
        creador: filtros.creador,
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

/*
 * C4: Tags agregados con conteo, calculados en el servidor.
 * Soporta mismos filtros que listarSamples para faceted search.
 */
export type TagConConteo = { tag: string; conteo: number };
export type TagsAgregadosResp = Record<CategoriaTag, TagConConteo[]>;

export const obtenerTagsAgregados = async (
    filtros: Pick<FiltrosSamples, 'genero' | 'bpmMin' | 'bpmMax' | 'key' | 'tipo'> = {}
): Promise<RespuestaApi<TagsAgregadosResp>> => {
    return apiGet<TagsAgregadosResp>('/tags/aggregates', {
        genero: filtros.genero,
        bpm_min: filtros.bpmMin,
        bpm_max: filtros.bpmMax,
        key: filtros.key,
        tipo: filtros.tipo,
    });
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
    esPremium?: boolean;
    precio?: number;
    /* C220: Toggle visibilidad en comunidad */
    mostrarEnComunidad?: boolean;
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
    formData.append('es_premium', String(datos.esPremium ?? false));
    formData.append('mostrar_en_comunidad', String(datos.mostrarEnComunidad ?? true));
    if (datos.precio != null && datos.precio > 0) {
        formData.append('precio', String(datos.precio));
    }

    return apiPostFormData<RespuestaSubida>('/samples/upload', formData);
};

/*
 * Eliminar un sample.
 * Solo el propietario o un admin pueden borrar.
 * Endpoint: DELETE /samples/{id}
 */
export const eliminarSample = async (sampleId: number): Promise<RespuestaApi<{ eliminado: boolean }>> => {
    return apiDelete<{ eliminado: boolean }>(`/samples/${sampleId}`);
};

/* D8: Subir/reemplazar imagen de portada de un sample */
export const subirImagenSample = async (
    sampleId: number,
    archivo: File
): Promise<RespuestaApi<{ imagenUrl: string }>> => {
    const fd = new FormData();
    fd.append('imagen', archivo);
    return apiPostFormData<{ imagenUrl: string }>(`/samples/${sampleId}/imagen`, fd);
};

/* C126: Datos editables de un sample */
export interface DatosActualizarSample {
    titulo?: string;
    descripcion?: string;
    tags?: string[];
    tipo?: string;
    esPremium?: boolean;
    precio?: number | null;
    permitirDescarga?: boolean;
    licenciaLibre?: boolean;
    imagenUrl?: string;
    estado?: string; /* solo admin */
    verificado?: boolean; /* solo admin — C178 */
    /* C220: Toggle visibilidad en comunidad */
    mostrarEnComunidad?: boolean;
}

/*
 * C126: Actualizar metadatos de un sample.
 * Solo el propietario o admin pueden editar.
 * Endpoint: PUT /samples/{id}
 */
export const actualizarSample = async (
    sampleId: number,
    datos: DatosActualizarSample
): Promise<RespuestaApi<Sample>> => {
    return apiPut<Sample>(`/samples/${sampleId}`, datos);
};

/*
 * C87: Obtiene los samples favoritos (liked) del usuario autenticado.
 */
export const obtenerMisFavoritos = async (page = 1, perPage = 20): Promise<RespuestaApi<RespuestaListaSamples>> => {
    return apiGet<RespuestaListaSamples>('/me/favoritos', { page, per_page: perPage });
};

/*
 * C87: Obtiene los samples descargados por el usuario autenticado.
 */
export const obtenerMisDescargas = async (page = 1, perPage = 20): Promise<RespuestaApi<RespuestaListaSamples>> => {
    return apiGet<RespuestaListaSamples>('/me/descargas', { page, per_page: perPage });
};
