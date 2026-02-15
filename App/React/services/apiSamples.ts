/*
 * Service: apiSamples — Kamples
 * Funciones de acceso a datos de samples.
 * Usa mock data como fallback cuando la API no está disponible.
 */

import { apiGet, apiPostFormData } from './apiCliente';
import type { RespuestaApi } from './apiCliente';
import type { SampleResumen, Sample } from '../types';
import {
    samplesMock,
    sampleDetalladoMock,
    trendingMock,
    recientesMock,
    descubrirMock,
} from './mockSamples';

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
 * Filtra y pagina samples mock localmente.
 * Simula el comportamiento del backend.
 */
const filtrarMock = (filtros: FiltrosSamples): RespuestaListaSamples => {
    let resultado = [...samplesMock];

    if (filtros.busqueda) {
        const q = filtros.busqueda.toLowerCase();
        resultado = resultado.filter(
            (s) =>
                s.titulo.toLowerCase().includes(q) ||
                s.tags.some((t) => t.includes(q)) ||
                s.creador.nombreVisible.toLowerCase().includes(q)
        );
    }
    if (filtros.tipo) resultado = resultado.filter((s) => s.tipo === filtros.tipo);
    if (filtros.key) resultado = resultado.filter((s) => s.key === filtros.key);
    if (filtros.bpmMin) resultado = resultado.filter((s) => s.bpm !== null && s.bpm >= filtros.bpmMin!);
    if (filtros.bpmMax) resultado = resultado.filter((s) => s.bpm !== null && s.bpm <= filtros.bpmMax!);

    const page = filtros.page ?? 1;
    const perPage = filtros.perPage ?? 20;
    const total = resultado.length;
    const inicio = (page - 1) * perPage;

    return {
        data: resultado.slice(inicio, inicio + perPage),
        pagination: { page, per_page: perPage, total, pages: Math.ceil(total / perPage) },
    };
};

/*
 * Lista samples con filtros y paginación.
 * Fallback a mock data si la API falla o retorna vacío.
 */
export const listarSamples = async (filtros: FiltrosSamples = {}): Promise<RespuestaApi<RespuestaListaSamples>> => {
    const resp = await apiGet<RespuestaListaSamples>('/samples', {
        page: filtros.page ?? 1,
        per_page: filtros.perPage ?? 20,
        busqueda: filtros.busqueda,
        genero: filtros.genero,
        bpm_min: filtros.bpmMin,
        bpm_max: filtros.bpmMax,
        key: filtros.key,
        tipo: filtros.tipo,
    });

    /* Si la API falla o retorna sin datos, usar mock */
    const sinDatos = !resp.ok || !resp.data ||
        (resp.data as RespuestaListaSamples)?.data?.length === 0;

    if (sinDatos) {
        return { ok: true, data: filtrarMock(filtros), error: null, status: 200 };
    }
    return resp;
};

/*
 * Obtiene un sample individual por slug.
 * Fallback a mock si la API falla o no existe.
 */
export const obtenerSample = async (slug: string): Promise<RespuestaApi<Sample>> => {
    const resp = await apiGet<Sample>(`/samples/${slug}`);

    if (!resp.ok || !resp.data) {
        /* Buscar en mock por slug */
        const encontrado = samplesMock.find((s) => s.slug === slug);
        if (encontrado) {
            return {
                ok: true,
                data: { ...sampleDetalladoMock, ...encontrado, creadorId: encontrado.creador.id },
                error: null,
                status: 200,
            };
        }
        return { ok: true, data: sampleDetalladoMock, error: null, status: 200 };
    }
    return resp;
};

/*
 * Obtiene el feed de descubrimiento.
 * Usa mock data si la API falla o retorna vacío (backend sin datos aún).
 */
export const obtenerFeed = async (
    tipo: 'descubrir' | 'trending' | 'recientes' = 'descubrir',
    page = 1
): Promise<RespuestaApi<SampleResumen[]>> => {
    const resp = await apiGet<SampleResumen[]>('/feed', { tipo, page });

    const datosMock =
        tipo === 'trending' ? trendingMock :
        tipo === 'recientes' ? recientesMock :
        descubrirMock;

    /* Fallback a mock si la API falla o retorna vacío */
    if (!resp.ok || !resp.data || (Array.isArray(resp.data) && resp.data.length === 0)) {
        /* Paginar mock para evitar duplicados en infinite scroll */
        const porPagina = 20;
        const inicio = (page - 1) * porPagina;
        const paginado = datosMock.slice(inicio, inicio + porPagina);
        return { ok: true, data: paginado, error: null, status: 200 };
    }
    return resp;
};

/*
 * Respuesta del endpoint de subida.
 */
export interface RespuestaSubida {
    ok: boolean;
    sample_id: number | null;
    id_corto: string;
    slug: string;
    url: string;
    estado: string;
    metadata: string | null;
    bpm: number | null;
    key: string | null;
    tipo: string | null;
}

/*
 * Datos para construir el FormData de subida.
 */
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
 * Construye FormData internamente a partir de los datos estructurados.
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
