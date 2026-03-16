/*
 * Service: apiColecciones — Kamples (C139/C137)
 * CRUD de colecciones de samples del usuario.
 * Incluye normalizador snake_case → camelCase para datos de PostgreSQL.
 */

import { apiGet, apiPost, apiPut, apiDelete, apiPostFormData } from './apiCliente';
import type { RespuestaApi } from './apiCliente';
import type { Coleccion, ColeccionResumen, SampleResumen, UsuarioResumen } from '../types';

/*
 * Normalizador: convierte respuesta raw de PostgreSQL (snake_case)
 * a la interfaz Coleccion (camelCase).
 * Acepta ambos formatos para robustez.
 */
const normalizarColeccion = (raw: Record<string, unknown>): Coleccion => ({
    id: (raw.id ?? 0) as number,
    usuarioId: (raw.usuario_id ?? raw.usuarioId ?? 0) as number,
    nombre: (raw.nombre ?? '') as string,
    slug: (raw.slug ?? null) as string | null,
    descripcion: (raw.descripcion ?? '') as string,
    esPublica: (raw.publica ?? raw.esPublica ?? true) as boolean,
    imagenUrl: (raw.imagen_url ?? raw.imagenUrl ?? null) as string | null,
    totalSamples: (raw.total_items ?? raw.total_samples ?? raw.totalSamples ?? 0) as number,
    creadoAt: (raw.created_at ?? raw.creadoAt ?? '') as string,
    actualizadoAt: (raw.updated_at ?? raw.actualizadoAt ?? '') as string,
    parentId: (raw.parent_id ?? raw.parentId ?? null) as number | null,
    tags: Array.isArray(raw.tags) ? raw.tags as string[] : [],
    usuario: raw.username ? {
        id: (raw.usuario_id ?? raw.usuarioId ?? 0) as number,
        username: raw.username as string,
        nombreVisible: (raw.nombre_visible ?? raw.nombreVisible ?? raw.username) as string,
        avatarUrl: (raw.avatar_url ?? raw.avatarUrl ?? null) as string | null,
    } as UsuarioResumen : raw.usuario as Coleccion['usuario'],
    samples: raw.samples as Coleccion['samples'],
    subcolecciones: Array.isArray(raw.subcolecciones)
        ? (raw.subcolecciones as Record<string, unknown>[]).map(normalizarColeccionResumen)
        : undefined,
    contieneElSample: (raw.contieneElSample ?? raw.contiene_el_sample) as boolean | undefined,
});

/* Normalizador para resumen de subcolección */
const normalizarColeccionResumen = (raw: Record<string, unknown>): ColeccionResumen => ({
    id: (raw.id ?? 0) as number,
    nombre: (raw.nombre ?? '') as string,
    slug: (raw.slug ?? null) as string | null,
    imagenUrl: (raw.imagen_url ?? raw.imagenUrl ?? null) as string | null,
    totalSamples: (raw.total_items ?? raw.total_samples ?? raw.totalSamples ?? 0) as number,
    esPublica: (raw.publica ?? raw.esPublica ?? true) as boolean,
    parentId: (raw.parent_id ?? raw.parentId ?? null) as number | null,
    tags: Array.isArray(raw.tags) ? raw.tags as string[] : [],
});

/* Normalizar array de colecciones */
const normalizarLista = (data: unknown[]): Coleccion[] =>
    Array.isArray(data) ? data.map(d => normalizarColeccion(d as Record<string, unknown>)) : [];

/* C388: Respuesta de listar colecciones con tags frecuentes */
export interface RespuestaListarColecciones {
    colecciones: Coleccion[];
    tagsFrecuentes: string[];
}

/* Tipo raw backend: { colecciones: [...], tags_frecuentes: [...] } */
interface ListarRaw {
    colecciones: unknown[];
    tags_frecuentes: string[];
}

/*
 * Listar colecciones del usuario (o de otro si se pasa usuarioId) — C169: con búsqueda.
 * C388: Devuelve colecciones + tags_frecuentes del backend.
 */
export const listarColecciones = async (
    usuarioId?: number,
    busqueda?: string
): Promise<RespuestaApi<RespuestaListarColecciones>> => {
    const params: Record<string, string | number | boolean | undefined> = {};
    if (usuarioId) params.usuario_id = usuarioId;
    if (busqueda) params.busqueda = busqueda;

    const resp = await apiGet<ListarRaw>('/colecciones', params);

    if (resp.ok && resp.data) {
        /*
         * Backend retorna { data: { colecciones: [...], tags_frecuentes: [...] } }
         * apiGet extrae json.data → resp.data = { colecciones, tags_frecuentes }
         * Fallback: si resp.data es array directamente (compat con formato anterior)
         */
        const raw = resp.data;
        const coleccionesRaw = Array.isArray(raw) ? raw : (raw.colecciones ?? []);
        const tagsFrecuentes = Array.isArray(raw) ? [] : (raw.tags_frecuentes ?? []);

        return {
            ok: true,
            data: {
                colecciones: normalizarLista(coleccionesRaw as unknown[]),
                tagsFrecuentes,
            },
            error: null,
            status: resp.status,
        };
    }

    return {
        ok: false,
        data: null,
        error: resp.error,
        status: resp.status,
    };
};

/* B1: Colecciones públicas para explorar — ahora retorna tags_frecuentes también */
export const listarColeccionesPublicas = async (
    busqueda?: string
): Promise<RespuestaApi<RespuestaListarColecciones>> => {
    const params: Record<string, string | number | boolean | undefined> = {};
    if (busqueda) params.busqueda = busqueda;
    const resp = await apiGet<ListarRaw>('/colecciones/explorar', params);

    if (resp.ok && resp.data) {
        const raw = resp.data;
        const coleccionesRaw = Array.isArray(raw) ? raw : (raw.colecciones ?? []);
        const tagsFrecuentes = Array.isArray(raw) ? [] : (raw.tags_frecuentes ?? []);

        return {
            ok: true,
            data: {
                colecciones: normalizarLista(coleccionesRaw as unknown[]),
                tagsFrecuentes,
            },
            error: null,
            status: resp.status,
        };
    }

    return { ok: false, data: null, error: resp.error, status: resp.status };
};

/* Detalle de una colección por ID numérico */
export const obtenerColeccion = async (
    id: number,
    opciones?: { incluirSubcolecciones?: boolean; orden?: string },
): Promise<RespuestaApi<Coleccion>> => {
    const searchParams = new URLSearchParams();
    if (opciones?.incluirSubcolecciones) searchParams.set('incluirSubcolecciones', '1');
    if (opciones?.orden) searchParams.set('orden', opciones.orden);
    const qs = searchParams.toString();
    const resp = await apiGet<Coleccion>(`/colecciones/${id}${qs ? `?${qs}` : ''}`);
    if (resp.ok && resp.data) resp.data = normalizarColeccion(resp.data as unknown as Record<string, unknown>);
    return resp;
};

/* Detalle de una colección por slug */
export const obtenerColeccionPorSlug = async (
    slug: string,
    opciones?: { incluirSubcolecciones?: boolean; orden?: string },
): Promise<RespuestaApi<Coleccion>> => {
    const searchParams = new URLSearchParams();
    if (opciones?.incluirSubcolecciones) searchParams.set('incluirSubcolecciones', '1');
    if (opciones?.orden) searchParams.set('orden', opciones.orden);
    const qs = searchParams.toString();
    const resp = await apiGet<Coleccion>(`/colecciones/por-slug/${encodeURIComponent(slug)}${qs ? `?${qs}` : ''}`);
    if (resp.ok && resp.data) resp.data = normalizarColeccion(resp.data as unknown as Record<string, unknown>);
    return resp;
};

/* Crear colección (opcionalmente como subcolección con parentId) */
export const crearColeccion = async (datos: {
    nombre: string;
    descripcion?: string;
    esPublica?: boolean;
    parentId?: number;
}): Promise<RespuestaApi<Coleccion>> => {
    const body: Record<string, unknown> = { nombre: datos.nombre };
    if (datos.descripcion !== undefined) body.descripcion = datos.descripcion;
    if (datos.esPublica !== undefined) body.publica = datos.esPublica;
    if (datos.parentId !== undefined) body.parent_id = datos.parentId;
    return apiPost<Coleccion>('/colecciones', body);
};

/* Actualizar colección */
export const actualizarColeccion = async (
    id: number,
    datos: Partial<{ nombre: string; descripcion: string; esPublica: boolean; imagenUrl: string | null }>
): Promise<RespuestaApi<Coleccion>> => {
    const body: Record<string, unknown> = {};
    if (datos.nombre !== undefined) body.nombre = datos.nombre;
    if (datos.descripcion !== undefined) body.descripcion = datos.descripcion;
    if (datos.esPublica !== undefined) body.publica = datos.esPublica;
    if (datos.imagenUrl !== undefined) body.imagen_url = datos.imagenUrl;
    return apiPut<Coleccion>(`/colecciones/${id}`, body);
};

/* Subir/reemplazar imagen de portada de la colección */
export const subirImagenColeccion = async (
    id: number,
    archivo: File
): Promise<RespuestaApi<{ imagenUrl: string }>> => {
    const fd = new FormData();
    fd.append('imagen', archivo);
    return apiPostFormData<{ imagenUrl: string }>(`/colecciones/${id}/imagen`, fd);
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

/* Sugerencias "Más Ideas" — samples similares no incluidos en la colección.
 * Params: page/per_page (convención WP REST, registrados en la ruta). */
export const obtenerSugerencias = async (
    coleccionId: number,
    page = 1,
    per_page = 20
): Promise<RespuestaApi<SampleResumen[]>> => {
    return apiGet<SampleResumen[]>(`/colecciones/${coleccionId}/sugerencias`, { page, per_page });
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
