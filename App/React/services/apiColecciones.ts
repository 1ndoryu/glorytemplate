/*
 * Service: apiColecciones — Kamples (C139/C137)
 * CRUD de colecciones de samples del usuario.
 * Incluye normalizador snake_case → camelCase para datos de PostgreSQL.
 */

import { apiGet, apiPost, apiPut, apiDelete } from './apiCliente';
import type { RespuestaApi } from './apiCliente';
import type { Coleccion, SampleResumen } from '../types';

/*
 * Normalizador: convierte respuesta raw de PostgreSQL (snake_case)
 * a la interfaz Coleccion (camelCase).
 * Acepta ambos formatos para robustez.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
const normalizarColeccion = (raw: any): Coleccion => ({
    id: raw.id,
    usuarioId: raw.usuario_id ?? raw.usuarioId ?? 0,
    nombre: raw.nombre ?? '',
    descripcion: raw.descripcion ?? '',
    esPublica: raw.publica ?? raw.esPublica ?? true,
    imagenUrl: raw.imagen_url ?? raw.imagenUrl ?? null,
    totalSamples: raw.total_items ?? raw.total_samples ?? raw.totalSamples ?? 0,
    creadoAt: raw.created_at ?? raw.creadoAt ?? '',
    actualizadoAt: raw.updated_at ?? raw.actualizadoAt ?? '',
    usuario: raw.username ? {
        id: raw.usuario_id ?? raw.usuarioId ?? 0,
        username: raw.username,
        nombreVisible: raw.nombre_visible ?? raw.nombreVisible ?? raw.username,
        avatarUrl: raw.avatar_url ?? raw.avatarUrl ?? null,
    } : raw.usuario,
    samples: raw.samples,
});

/* Normalizar array de colecciones */
const normalizarLista = (data: any[]): Coleccion[] =>
    Array.isArray(data) ? data.map(normalizarColeccion) : [];
/* eslint-enable @typescript-eslint/no-explicit-any */

/* Listar colecciones del usuario (o de otro si se pasa usuarioId) — C169: con búsqueda */
export const listarColecciones = async (usuarioId?: number, busqueda?: string): Promise<RespuestaApi<Coleccion[]>> => {
    const params: Record<string, string | number | boolean | undefined> = {};
    if (usuarioId) params.usuario_id = usuarioId;
    if (busqueda) params.busqueda = busqueda;
    const resp = await apiGet<Coleccion[]>('/colecciones', params);
    if (resp.ok && resp.data) resp.data = normalizarLista(resp.data);
    return resp;
};

/* Colecciones públicas para explorar — C169: con búsqueda */
export const listarColeccionesPublicas = async (busqueda?: string): Promise<RespuestaApi<Coleccion[]>> => {
    const params: Record<string, string | number | boolean | undefined> = {};
    if (busqueda) params.busqueda = busqueda;
    const resp = await apiGet<Coleccion[]>('/colecciones/explorar', params);
    if (resp.ok && resp.data) resp.data = normalizarLista(resp.data);
    return resp;
};

/* Detalle de una colección */
export const obtenerColeccion = async (id: number): Promise<RespuestaApi<Coleccion>> => {
    const resp = await apiGet<Coleccion>(`/colecciones/${id}`);
    if (resp.ok && resp.data) resp.data = normalizarColeccion(resp.data);
    return resp;
};

/* Crear colección */
export const crearColeccion = async (datos: {
    nombre: string;
    descripcion?: string;
    esPublica?: boolean;
}): Promise<RespuestaApi<Coleccion>> => {
    return apiPost<Coleccion>('/colecciones', datos);
};

/* Actualizar colección */
export const actualizarColeccion = async (
    id: number,
    datos: Partial<{ nombre: string; descripcion: string; esPublica: boolean }>
): Promise<RespuestaApi<Coleccion>> => {
    return apiPut<Coleccion>(`/colecciones/${id}`, datos);
};

/* Eliminar colección */
export const eliminarColeccion = async (id: number): Promise<RespuestaApi<{ eliminada: boolean }>> => {
    return apiDelete<{ eliminada: boolean }>(`/colecciones/${id}`);
};

/* Agregar sample a colección */
export const agregarSampleAColeccion = async (
    coleccionId: number,
    sampleId: number
): Promise<RespuestaApi<{ agregado: boolean }>> => {
    return apiPost<{ agregado: boolean }>(`/colecciones/${coleccionId}/samples`, { sampleId });
};

/* Quitar sample de colección */
export const quitarSampleDeColeccion = async (
    coleccionId: number,
    sampleId: number
): Promise<RespuestaApi<{ eliminado: boolean }>> => {
    return apiDelete<{ eliminado: boolean }>(`/colecciones/${coleccionId}/samples/${sampleId}`);
};

/* Sugerencias "Más Ideas" — samples similares no incluidos en la colección */
export const obtenerSugerencias = async (
    coleccionId: number,
    pagina = 1,
    limite = 20
): Promise<RespuestaApi<SampleResumen[]>> => {
    return apiGet<SampleResumen[]>(`/colecciones/${coleccionId}/sugerencias`, { pagina, limite });
};

/* Colecciones más relevantes para un sample (para modal "Guardar en colección") */
export const obtenerRelevantesParaSample = async (
    sampleId: number
): Promise<RespuestaApi<Coleccion[]>> => {
    const resp = await apiGet<Coleccion[]>(`/colecciones/relevantes/${sampleId}`);
    if (resp.ok && resp.data) resp.data = normalizarLista(resp.data);
    return resp;
};

/* Resultado de descarga ZIP de colección */
export interface ResultadoDescargaZip {
    url: string;
    nombre: string;
    tamano: number;
    totalSamples: number;
    creditosUsados: number;
    yaDescargados: number;
}

/* Descargar colección como ZIP (consume créditos por samples no descargados previamente) */
export const descargarColeccionZip = async (
    coleccionId: number
): Promise<RespuestaApi<ResultadoDescargaZip>> => {
    return apiPost<ResultadoDescargaZip>(`/colecciones/${coleccionId}/descargar-zip`);
};
