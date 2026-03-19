/*
 * Service: apiArticulos — Kamples (183A-109)
 * CRUD de artículos del blog.
 * Normalizador snake_case → camelCase para datos de PostgreSQL.
 */

import { apiGet, apiPost, apiPut, apiDelete, apiPostFormData } from './apiCliente';
import type { RespuestaApi } from './apiCliente';
import type { Articulo, ArticuloResumen, CategoriaArticulo, UsuarioResumen } from '../types';

/* Normalizador: convierte respuesta raw de PostgreSQL (snake_case)
 * a la interfaz Articulo (camelCase). */
const normalizarArticulo = (raw: Record<string, unknown>): Articulo => ({
    id: (raw.id ?? 0) as number,
    autorId: (raw.autor_id ?? raw.autorId ?? 0) as number,
    titulo: (raw.titulo ?? '') as string,
    slug: (raw.slug ?? '') as string,
    contenido: (raw.contenido ?? '') as string,
    extracto: (raw.extracto ?? '') as string,
    portadaUrl: (raw.portada_url ?? raw.portadaUrl ?? null) as string | null,
    categoria: (raw.categoria ?? 'inspiracion') as CategoriaArticulo,
    embeds: Array.isArray(raw.embeds)
        ? raw.embeds as Articulo['embeds']
        : (typeof raw.embeds === 'string' ? JSON.parse(raw.embeds) : []),
    descargaPublica: (raw.descarga_publica ?? raw.descargaPublica ?? false) as boolean,
    totalLikes: (raw.total_likes ?? raw.totalLikes ?? 0) as number,
    totalComentarios: (raw.total_comentarios ?? raw.totalComentarios ?? 0) as number,
    moderacionEstado: (raw.moderacion_estado ?? raw.moderacionEstado ?? 'pendiente') as Articulo['moderacionEstado'],
    creadoAt: (raw.created_at ?? raw.creadoAt ?? '') as string,
    publicadoEn: (raw.publicado_en ?? raw.publicadoEn ?? null) as string | null,
    /* [193A-15] Backend devuelve autor_username/autor_nombre/autor_avatar, no username plano */
    autor: (raw.autor_username ?? raw.username) ? {
        id: (raw.autor_id ?? raw.autorId ?? 0) as number,
        username: (raw.autor_username ?? raw.username) as string,
        nombreVisible: (raw.autor_nombre ?? raw.nombre_visible ?? raw.nombreVisible ?? raw.autor_username ?? raw.username) as string,
        avatarUrl: (raw.autor_avatar ?? raw.avatar_url ?? raw.avatarUrl ?? null) as string | null,
        verificado: (raw.autor_verificado ?? raw.verificado ?? false) as boolean,
    } as UsuarioResumen : (raw.autor as UsuarioResumen ?? { id: 0, username: '', nombreVisible: '', avatarUrl: null }),
    liked: (raw.liked ?? raw.esta_likeado ?? false) as boolean,
});

const normalizarResumen = (raw: Record<string, unknown>): ArticuloResumen => ({
    id: (raw.id ?? 0) as number,
    titulo: (raw.titulo ?? '') as string,
    slug: (raw.slug ?? '') as string,
    extracto: (raw.extracto ?? '') as string,
    portadaUrl: (raw.portada_url ?? raw.portadaUrl ?? null) as string | null,
    categoria: (raw.categoria ?? 'inspiracion') as CategoriaArticulo,
    totalLikes: (raw.total_likes ?? raw.totalLikes ?? 0) as number,
    totalComentarios: (raw.total_comentarios ?? raw.totalComentarios ?? 0) as number,
    publicadoEn: (raw.publicado_en ?? raw.publicadoEn ?? null) as string | null,
    /* [183A-110-E] moderacionEstado incluido para vista Mis artículos */
    moderacionEstado: ((raw.moderacion_estado ?? raw.moderacionEstado) ?? undefined) as ArticuloResumen['moderacionEstado'],
    /* [193A-15] Backend devuelve autor_username/autor_nombre/autor_avatar, no username plano */
    autor: (raw.autor_username ?? raw.username) ? {
        id: (raw.autor_id ?? raw.autorId ?? 0) as number,
        username: (raw.autor_username ?? raw.username) as string,
        nombreVisible: (raw.autor_nombre ?? raw.nombre_visible ?? raw.nombreVisible ?? raw.autor_username ?? raw.username) as string,
        avatarUrl: (raw.autor_avatar ?? raw.avatar_url ?? raw.avatarUrl ?? null) as string | null,
        verificado: (raw.autor_verificado ?? raw.verificado ?? false) as boolean,
    } as UsuarioResumen : (raw.autor as UsuarioResumen ?? { id: 0, username: '', nombreVisible: '', avatarUrl: null }),
    liked: (raw.liked ?? raw.esta_likeado ?? false) as boolean,
});

const normalizarLista = (data: unknown[]): ArticuloResumen[] =>
    Array.isArray(data) ? data.map(d => normalizarResumen(d as Record<string, unknown>)) : [];

/* ── Endpoints públicos ── */

export interface RespuestaListarArticulos {
    articulos: ArticuloResumen[];
    total: number;
    hayMas: boolean;
}

export const listarArticulos = async (params: {
    categoria?: CategoriaArticulo;
    pagina?: number;
    limite?: number;
}): Promise<RespuestaApi<RespuestaListarArticulos>> => {
    const res = await apiGet<Record<string, unknown>>('/articulos', {
        categoria: params.categoria,
        pagina: params.pagina,
        limite: params.limite,
    });
    if (!res.ok || !res.data) return res as unknown as RespuestaApi<RespuestaListarArticulos>;

    const raw = res.data;
    const articulos = normalizarLista(raw.articulos as unknown[] ?? []);
    return {
        ...res,
        data: {
            articulos,
            total: (raw.total ?? 0) as number,
            hayMas: (raw.hay_mas ?? raw.hayMas ?? false) as boolean,
        },
    };
};

export const obtenerArticulo = async (slug: string): Promise<RespuestaApi<Articulo>> => {
    const res = await apiGet<Record<string, unknown>>(`/articulos/${encodeURIComponent(slug)}`);
    if (!res.ok || !res.data) return res as unknown as RespuestaApi<Articulo>;
    return { ...res, data: normalizarArticulo(res.data) };
};

export const obtenerCategorias = async (): Promise<RespuestaApi<Record<string, string[]>>> => {
    return apiGet<Record<string, string[]>>('/articulos/categorias');
};

/* ── Mis artículos ── */

export const listarMisArticulos = async (params?: {
    pagina?: number;
    limite?: number;
    /* [183A-110-E] Filtro por estado de moderación — muestra publicados/pendiente/rechazados */
    moderacionEstado?: 'aprobado' | 'pendiente' | 'rechazado';
}): Promise<RespuestaApi<RespuestaListarArticulos>> => {
    const res = await apiGet<Record<string, unknown>>('/articulos/mis-articulos', {
        pagina: params?.pagina,
        limite: params?.limite,
        moderacion_estado: params?.moderacionEstado,
    });
    if (!res.ok || !res.data) return res as unknown as RespuestaApi<RespuestaListarArticulos>;

    const raw = res.data;
    return {
        ...res,
        data: {
            articulos: normalizarLista(raw.articulos as unknown[] ?? []),
            total: (raw.total ?? 0) as number,
            hayMas: (raw.hay_mas ?? raw.hayMas ?? false) as boolean,
        },
    };
};

/* ── CRUD ── */

export interface DatosCrearArticulo {
    titulo: string;
    contenido: string;
    extracto: string;
    categoria: CategoriaArticulo;
    portada?: File;
    embeds?: string;
    descargaPublica?: boolean;
}

export const crearArticulo = async (datos: DatosCrearArticulo): Promise<RespuestaApi<Articulo>> => {
    const fd = new FormData();
    fd.append('titulo', datos.titulo);
    fd.append('contenido', datos.contenido);
    fd.append('extracto', datos.extracto);
    fd.append('categoria', datos.categoria);
    if (datos.portada) fd.append('portada', datos.portada);
    if (datos.embeds) fd.append('embeds', datos.embeds);
    if (datos.descargaPublica !== undefined) fd.append('descarga_publica', String(datos.descargaPublica));

    const res = await apiPostFormData<Record<string, unknown>>('/articulos', fd);
    if (!res.ok || !res.data) return res as unknown as RespuestaApi<Articulo>;
    return { ...res, data: normalizarArticulo(res.data) };
};

export const actualizarArticulo = async (
    id: number,
    datos: Partial<DatosCrearArticulo>
): Promise<RespuestaApi<Articulo>> => {
    const body: Record<string, unknown> = {};
    if (datos.titulo !== undefined) body.titulo = datos.titulo;
    if (datos.contenido !== undefined) body.contenido = datos.contenido;
    if (datos.extracto !== undefined) body.extracto = datos.extracto;
    if (datos.categoria !== undefined) body.categoria = datos.categoria;
    if (datos.embeds !== undefined) body.embeds = datos.embeds;
    if (datos.descargaPublica !== undefined) body.descarga_publica = datos.descargaPublica;

    const res = await apiPut<Record<string, unknown>>(`/articulos/${id}`, body);
    if (!res.ok || !res.data) return res as unknown as RespuestaApi<Articulo>;
    return { ...res, data: normalizarArticulo(res.data) };
};

export const eliminarArticulo = async (id: number): Promise<RespuestaApi<{ eliminado: boolean }>> => {
    return apiDelete<{ eliminado: boolean }>(`/articulos/${id}`);
};

/* ── Like ── */

export const toggleLikeArticulo = async (id: number): Promise<RespuestaApi<{ liked: boolean; total: number }>> => {
    return apiPost<{ liked: boolean; total: number }>(`/articulos/${id}/like`);
};
