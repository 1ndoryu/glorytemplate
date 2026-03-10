/*
 * Service: API Canciones — Kamples
 * Endpoints de Sample Discovery: canciones, artistas, relaciones.
 * Los endpoints son públicos (información cultural abierta).
 */

import { apiGet, apiDelete, apiPost } from './apiCliente';
import type { RespuestaApi } from './apiCliente';
import type {
    Cancion,
    CancionDetalle,
    ArtistaDetalle,
    EstadisticaRelaciones,
    RelacionSample,
    RelacionDetalleCompleta,
} from '@app/types/cancion';

/* Listar canciones recientes */
export const listarCanciones = (perPage = 20): Promise<RespuestaApi<Cancion[]>> =>
    apiGet<Cancion[]>('/canciones', { per_page: perPage });

/* Buscar canciones por texto */
export const buscarCanciones = (
    query: string,
    perPage = 20
): Promise<RespuestaApi<Cancion[]>> =>
    apiGet<Cancion[]>('/canciones/buscar', { q: query, per_page: perPage });

/* Canciones más sampleadas */
export const cancionesTopSampleadas = (
    limit = 50
): Promise<RespuestaApi<Cancion[]>> =>
    apiGet<Cancion[]>('/canciones/top', { limit });

/* Detalle de canción con relaciones */
export const obtenerCancionDetalle = (
    slug: string
): Promise<RespuestaApi<CancionDetalle>> =>
    apiGet<CancionDetalle>(`/canciones/${encodeURIComponent(slug)}`);

/* Top artistas por canciones */
export const artistasTop = (
    limit = 50
): Promise<RespuestaApi<Array<{ id: number; nombre: string; slug: string; totalCanciones: number }>>> =>
    apiGet('/artistas/top', { limit });

/* Detalle de artista con canciones */
export const obtenerArtistaDetalle = (
    slug: string
): Promise<RespuestaApi<ArtistaDetalle>> =>
    apiGet<ArtistaDetalle>(`/artistas/${encodeURIComponent(slug)}`);

/* Estadísticas generales */
export const obtenerEstadisticasRelaciones = (): Promise<RespuestaApi<EstadisticaRelaciones>> =>
    apiGet<EstadisticaRelaciones>('/sample-discovery/estadisticas');

/*
 * Relación vinculada a un sample de Kamples (S4.4).
 * Retorna null si el sample no tiene relación con canciones.
 */
export const obtenerRelacionPorSampleId = (
    sampleId: number
): Promise<RespuestaApi<RelacionSample | null>> =>
    apiGet<RelacionSample | null>(`/sample-discovery/relacion/${sampleId}`);

/* Detalle completo de una relación de sampleo (ambas canciones + metadata) */
export const obtenerRelacionDetalle = (
    id: number
): Promise<RespuestaApi<RelacionDetalleCompleta>> =>
    apiGet<RelacionDetalleCompleta>(`/relaciones/${id}`);

/* Cadena de samples: A sampleó B sampleó C... (S4.5) */
export interface CadenaSamplesResp {
    cancion_raiz: Cancion;
    cadena: NodoCadena[];
}

export interface NodoCadena {
    id: number;
    cancion_fuente_id: number;
    cancion_destino_id: number;
    tipo_relacion: string;
    nivel: number;
    fuente_titulo: string;
    fuente_slug: string;
    fuente_artista: string;
    destino_titulo: string;
    destino_slug: string;
    destino_artista: string;
}

export const obtenerCadenaSamples = (
    slug: string,
    profundidad = 5
): Promise<RespuestaApi<CadenaSamplesResp>> =>
    apiGet<CadenaSamplesResp>(`/canciones/${encodeURIComponent(slug)}/cadena`, { profundidad });

/* ── Endpoints de desarrollo (solo disponibles con WP_DEBUG = true) ── */

interface RespuestaPurga {
    ok: boolean;
    mensaje: string;
    tablas: string[];
}

interface RespuestaScraper {
    ok: boolean;
    mensaje: string;
    pid?: number;
    log?: string;
}

/* Trunca todas las tablas del módulo Sample Discovery */
export const devPurgarCanciones = (): Promise<RespuestaApi<RespuestaPurga>> =>
    apiDelete<RespuestaPurga>('/dev/canciones');

/* Lanza el spider indicado en segundo plano.
 * Si se pasa url (URL de WhoSampled), se usa el spider 'track' automáticamente. */
export const devEjecutarScraper = (
    spider: 'hot_samples' | 'browse_year' | 'track' = 'hot_samples',
    limit = 0,
    url = ''
): Promise<RespuestaApi<RespuestaScraper>> =>
    apiPost<RespuestaScraper>('/dev/scraper/run', { spider, limit, ...(url ? { url } : {}) });

interface RespuestaCola {
    ok: boolean;
    cola_vacia: boolean;
    mensaje: string;
    url?: string;
    tipo?: string;
    spider?: string;
    pid?: number;
}

/* Toma la URL pendiente más antigua de la cola y lanza el spider correspondiente. */
export const devProcesarDeCola = (): Promise<RespuestaApi<RespuestaCola>> =>
    apiPost<RespuestaCola>('/dev/scraper/cola', {});
