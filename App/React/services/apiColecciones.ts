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
const normalizarColeccion = (raw: Record<string, unknown>): Coleccion => {
    const samples = raw.samples as Coleccion['samples'];
    /* [183A-61] Priorizar total_items (count real de BD) sobre samples.length (paginado).
     * Antes: si raw.samples existía, usaba su length (ej: 30 del LIMIT) como total.
     * Ahora: siempre prioriza el count real, fallback a array length si no hay total. */
    const totalReal = (raw.total_items ?? raw.total_samples ?? raw.totalSamples ?? null) as number | null;
    const totalSamples = totalReal != null ? totalReal
        : (Array.isArray(samples) ? samples.length : 0);

    return {
        id: (raw.id ?? 0) as number,
        usuarioId: (raw.usuario_id ?? raw.usuarioId ?? 0) as number,
        nombre: (raw.nombre ?? '') as string,
        slug: (raw.slug ?? null) as string | null,
        descripcion: (raw.descripcion ?? '') as string,
        esPublica: (raw.publica ?? raw.esPublica ?? true) as boolean,
        imagenUrl: (raw.imagen_url ?? raw.imagenUrl ?? null) as string | null,
        /* [183A-13] El detalle prioriza el total del payload ya cargado para no mostrar 0 incorrecto. */
        totalSamples,
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
        samples,
        subcolecciones: Array.isArray(raw.subcolecciones)
            ? (raw.subcolecciones as Record<string, unknown>[]).map(normalizarColeccionResumen)
            : undefined,
        coleccionPadre: raw.coleccionPadre
            ? raw.coleccionPadre as Coleccion['coleccionPadre']
            : raw.coleccion_padre
                ? raw.coleccion_padre as Coleccion['coleccionPadre']
                : null,
        contieneElSample: (raw.contieneElSample ?? raw.contiene_el_sample) as boolean | undefined,
        estaGuardada: (raw.estaGuardada ?? raw.esta_guardada) as boolean | undefined,
        /* [183A-22] Like de colección */
        estaLikeada: (raw.estaLikeada ?? raw.esta_likeada) as boolean | undefined,
        totalLikes: (raw.totalLikes ?? raw.total_likes ?? 0) as number,
    };
};

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

/* B1: Colecciones públicas para explorar — ahora retorna tags_frecuentes también.
 * [2003A-39] Soporte de paginación con parámetro page. */
export const listarColeccionesPublicas = async (
    busqueda?: string,
    page?: number
): Promise<RespuestaApi<RespuestaListarColecciones>> => {
    const params: Record<string, string | number | boolean | undefined> = {};
    if (busqueda) params.busqueda = busqueda;
    if (page && page > 1) params.page = page;
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
    const resp = await apiPost<Coleccion>('/colecciones', body);
    if (resp.ok && resp.data) resp.data = normalizarColeccion(resp.data as unknown as Record<string, unknown>);
    return resp;
};

/* Actualizar colección — QL114: incluye parentId para reasignar padre */
export const actualizarColeccion = async (
    id: number,
    datos: Partial<{ nombre: string; descripcion: string; esPublica: boolean; imagenUrl: string | null; parentId: number | null }>
): Promise<RespuestaApi<Coleccion>> => {
    const body: Record<string, unknown> = {};
    if (datos.nombre !== undefined) body.nombre = datos.nombre;
    if (datos.descripcion !== undefined) body.descripcion = datos.descripcion;
    if (datos.esPublica !== undefined) body.publica = datos.esPublica;
    if (datos.imagenUrl !== undefined) body.imagen_url = datos.imagenUrl;
    if (datos.parentId !== undefined) body.parent_id = datos.parentId;
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
    coleccionId: number,
    codigoGratis?: string
): Promise<RespuestaApi<ResultadoDescargaZip>> => {
    /* [183A-106] Si hay codigo gratis reclamado, incluirlo para saltear limites de plan */
    const body = codigoGratis ? { codigoGratis } : undefined;
    return apiPost<ResultadoDescargaZip>(`/colecciones/${coleccionId}/descargar-zip`, body);
};

/*
 * QL92: Guardar (bookmark) coleccion ajena.
 * Idempotente: llamar multiples veces no falla.
 */
export const guardarColeccionBookmark = async (
    coleccionId: number
): Promise<RespuestaApi<{ guardada: boolean }>> => {
    return apiPost<{ guardada: boolean }>(`/colecciones/${coleccionId}/guardar`);
};

/* QL92: Quitar bookmark de coleccion */
export const desguardarColeccionBookmark = async (
    coleccionId: number
): Promise<RespuestaApi<{ guardada: boolean }>> => {
    return apiDelete<{ guardada: boolean }>(`/colecciones/${coleccionId}/guardar`);
};

/* [183A-22] Toggle like de coleccion (distinto del bookmark) */
export const toggleLikeColeccion = async (
    coleccionId: number
): Promise<RespuestaApi<{ likeada: boolean; totalLikes: number }>> => {
    const resp = await apiPost<{ likeada: boolean; total_likes: number }>(`/colecciones/${coleccionId}/like`);
    if (resp.ok && resp.data) {
        return {
            ok: true,
            data: { likeada: resp.data.likeada, totalLikes: resp.data.total_likes ?? 0 },
            error: null,
            status: resp.status,
        };
    }
    return { ok: false, data: null, error: resp.error, status: resp.status };
};

/* QL92: Listar colecciones guardadas (bookmarkeadas) del usuario con paginacion */
export interface RespuestaGuardadas {
    colecciones: Coleccion[];
    total: number;
    page: number;
}

export const listarColeccionesGuardadas = async (
    page = 1,
    perPage = 30
): Promise<RespuestaApi<RespuestaGuardadas>> => {
    const resp = await apiGet<{ colecciones: unknown[]; total: number; page: number }>(
        '/colecciones/guardadas', { page, per_page: perPage }
    );

    if (resp.ok && resp.data) {
        return {
            ok: true,
            data: {
                colecciones: normalizarLista(resp.data.colecciones).map(coleccion => ({
                    ...coleccion,
                    estaGuardada: true,
                })),
                total: resp.data.total ?? 0,
                page: resp.data.page ?? page,
            },
            error: null,
            status: resp.status,
        };
    }

    return { ok: false, data: null, error: resp.error, status: resp.status };
};

/* QL115: Combinar colecciones */
export interface DatosCombinar {
    origenId: number;
    nombreFinal: string;
    imagenFinal?: string | null;
    manejoHijas?: 'mover' | 'aplanar';
    usuarioDestinoId?: number;
}

export interface ResultadoCombinar {
    ok: boolean;
    destinoId: number;
    samplesMovidos: number;
    totalEnDestino: number;
    undoId: number | null;
    undoExpira: string;
}

export const combinarColecciones = async (
    destinoId: number,
    datos: DatosCombinar
): Promise<RespuestaApi<ResultadoCombinar>> => {
    return apiPost<ResultadoCombinar>(`/colecciones/${destinoId}/combinar`, {
        origenId: datos.origenId,
        nombreFinal: datos.nombreFinal,
        imagenFinal: datos.imagenFinal ?? null,
        manejoHijas: datos.manejoHijas ?? 'mover',
        usuarioDestinoId: datos.usuarioDestinoId,
    });
};

export const deshacerCombinacion = async (
    destinoId: number,
    undoId: number
): Promise<RespuestaApi<{ ok: boolean; origenId: number; message: string }>> => {
    return apiPost<{ ok: boolean; origenId: number; message: string }>(
        `/colecciones/${destinoId}/deshacer-combinacion`,
        { undoId }
    );
};

export interface CombinacionPendiente {
    hayCombinacion: boolean;
    undoId?: number;
    origenNombre?: string;
    combinadoEn?: string;
    expiraEn?: string;
}

export const obtenerCombinacionPendiente = async (
    coleccionId: number
): Promise<RespuestaApi<CombinacionPendiente>> => {
    return apiGet<CombinacionPendiente>(`/colecciones/${coleccionId}/combinacion-pendiente`);
};

export interface ResultadoCrearVolumen {
    ok: boolean;
    nuevaColeccionId: number;
    nombreVolumen: string;
    samplesMovidos: number;
}

export const crearVolumenColeccion = async (
    coleccionId: number,
    numeroVolumen: number
): Promise<RespuestaApi<ResultadoCrearVolumen>> => {
    return apiPost<ResultadoCrearVolumen>(`/colecciones/${coleccionId}/crear-volumen`, {
        numeroVolumen,
    });
};

/* QL119: Eliminar colección con opciones configurables */
export interface OpcionesEliminarColeccion {
    borrarSamples?: boolean;
    manejoHijas?: 'eliminar' | 'huerfanas';
    borrarSamplesHijas?: boolean;
}

export interface ResultadoEliminar {
    ok: boolean;
    samplesEliminados: number;
    hijasEliminadas: number;
    hijasHuerfanas: number;
}

export const eliminarColeccionConOpciones = async (
    coleccionId: number,
    opciones: OpcionesEliminarColeccion
): Promise<RespuestaApi<ResultadoEliminar>> => {
    return apiDelete<ResultadoEliminar>(`/colecciones/${coleccionId}`, opciones);
};
