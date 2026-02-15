/*
 * Service: apiSamples — Kamples
 * Funciones de acceso a datos de samples.
 * Usa mock data como fallback cuando la API no está disponible.
 */

import { apiGet, apiPost } from './apiCliente';
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
 * Fallback a mock data si la API falla.
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

    if (!resp.ok) {
        return { ok: true, data: filtrarMock(filtros), error: null, status: 200 };
    }
    return resp;
};

/*
 * Obtiene un sample individual por slug.
 */
export const obtenerSample = async (slug: string): Promise<RespuestaApi<Sample>> => {
    const resp = await apiGet<Sample>(`/samples/${slug}`);

    if (!resp.ok) {
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
 */
export const obtenerFeed = async (
    tipo: 'descubrir' | 'trending' | 'recientes' = 'descubrir',
    page = 1
): Promise<RespuestaApi<SampleResumen[]>> => {
    const resp = await apiGet<SampleResumen[]>('/feed', { tipo, page });

    if (!resp.ok) {
        const datos =
            tipo === 'trending' ? trendingMock :
            tipo === 'recientes' ? recientesMock :
            descubrirMock;
        return { ok: true, data: datos, error: null, status: 200 };
    }
    return resp;
};

/*
 * Subir un sample (TO-DO: implementar con FormData cuando el pipeline esté listo).
 */
export const subirSample = async (datos: FormData) => {
    return apiPost<Sample>('/samples', datos);
};
