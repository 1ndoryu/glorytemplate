/*
 * Service: apiColecciones — Kamples
 * CRUD de colecciones de samples del usuario.
 * Conecta directamente con la API sin fallback a mock.
 */

import { apiGet, apiPost, apiPut, apiDelete } from './apiCliente';
import type { RespuestaApi } from './apiCliente';
import type { Coleccion, SampleResumen } from '../types';

/* Listar colecciones del usuario (o de otro si se pasa usuarioId) */
export const listarColecciones = async (usuarioId?: number): Promise<RespuestaApi<Coleccion[]>> => {
    return apiGet<Coleccion[]>('/colecciones', usuarioId ? { usuario_id: usuarioId } : {});
};

/* Colecciones públicas para explorar */
export const listarColeccionesPublicas = async (): Promise<RespuestaApi<Coleccion[]>> => {
    return apiGet<Coleccion[]>('/colecciones/explorar');
};

/* Detalle de una colección */
export const obtenerColeccion = async (id: number): Promise<RespuestaApi<Coleccion>> => {
    return apiGet<Coleccion>(`/colecciones/${id}`);
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
    return apiGet<Coleccion[]>(`/colecciones/relevantes/${sampleId}`);
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
