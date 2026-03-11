/*
 * Service: API Contribuciones — Kamples
 * Endpoints del sistema de contribuciones comunitarias de Sample Discovery.
 * Los usuarios registrados pueden proponer relaciones sample-cancion.
 */

import { apiGet, apiPost, apiPut, apiDelete } from './apiCliente';
import type { RespuestaApi } from './apiCliente';

export interface DatosContribucion {
    tipo_relacion: 'sample' | 'cover' | 'remix' | 'interpolation';
    tipo_elemento: 'hook_riff' | 'vocals_lyrics' | 'drums' | 'bass' | 'keys_synth' | 'sound_effect' | 'multiple_elements' | 'other';
    cancion_destino_id?: number;
    cancion_fuente_id?: number;
    cancion_nueva_titulo?: string;
    cancion_nueva_artista?: string;
    cancion_nueva_youtube_url?: string;
    cancion_nueva_lado?: 'destino' | 'fuente';
    timing_fuente?: number;
    timing_destino?: number;
}

export interface ContribucionResumen {
    id: number;
    contribuidorId: number;
    cancionDestinoId: number | null;
    cancionFuenteId: number | null;
    cancionNuevaTitulo: string | null;
    cancionNuevaArtista: string | null;
    tipoRelacion: string;
    tipoElemento: string;
    estado: 'pendiente' | 'aprobada' | 'rechazada';
    tipoContribucion?: 'nueva' | 'edicion' | 'eliminacion';
    relacionExistenteId?: number | null;
    cambiosPropuestos?: Record<string, unknown> | null;
    moderadorNota?: string | null;
    createdAt: string;
    resuelloAt?: string | null;
    /* campos de join opcionales */
    destinoTitulo?: string;
    fuenteTitulo?: string;
}

export interface RespuestaContribucion {
    ok: boolean;
    id?: number;
    error?: string;
}

/* Crear contribucion pendiente (requiere auth) */
export const crearContribucion = (
    datos: DatosContribucion
): Promise<RespuestaApi<RespuestaContribucion>> =>
    apiPost<RespuestaContribucion>('/contribuciones', datos);

/* Mis contribuciones (requiere auth) */
export const misContribuciones = (
    pagina = 1,
    porPagina = 20
): Promise<RespuestaApi<{ ok: boolean; items: ContribucionResumen[] }>> =>
    apiGet<{ ok: boolean; items: ContribucionResumen[] }>('/contribuciones/mis', {
        page: pagina,
        limit: porPagina,
    });

/* L6.1c: Editar contribucion propia pendiente */
export const editarContribucion = (
    id: number,
    datos: Partial<DatosContribucion>
): Promise<RespuestaApi<{ ok: boolean }>> =>
    apiPut<{ ok: boolean }>(`/contribuciones/${id}`, datos);

/* L6.1c: Eliminar contribucion propia pendiente */
export const eliminarContribucion = (
    id: number
): Promise<RespuestaApi<{ ok: boolean }>> =>
    apiDelete<{ ok: boolean }>(`/contribuciones/${id}`);

/* L6.2: Proponer edicion a relacion existente */
export const proponerEdicion = (
    relacionId: number,
    cambios: Record<string, unknown>
): Promise<RespuestaApi<RespuestaContribucion>> =>
    apiPost<RespuestaContribucion>('/contribuciones/edicion', {
        relacion_id: relacionId,
        cambios,
    });

/* L6.2: Proponer eliminacion de relacion existente */
export const proponerEliminacion = (
    relacionId: number,
    razon: string
): Promise<RespuestaApi<RespuestaContribucion>> =>
    apiPost<RespuestaContribucion>('/contribuciones/eliminacion', {
        relacion_id: relacionId,
        razon,
    });

/* ── Admin: gestión de contribuciones pendientes (C807) ── */

/* Tipo extendido con joins de admin */
export interface ContribucionAdmin extends ContribucionResumen {
    contribuidorUsername: string;
    cancionDestinoSlug?: string;
    cancionFuenteSlug?: string;
}

/* Listar contribuciones pendientes (admin) */
export const listarContribucionesAdmin = (
    pagina = 1,
    porPagina = 20
): Promise<RespuestaApi<{ ok: boolean; items: ContribucionAdmin[]; total: number }>> =>
    apiGet<{ ok: boolean; items: ContribucionAdmin[]; total: number }>(
        '/admin/contribuciones',
        { page: pagina, limit: porPagina }
    );

/* Moderar contribucion: aprobar o rechazar (admin) */
export const moderarContribucionAdmin = (
    id: number,
    accion: 'aprobada' | 'rechazada',
    nota?: string
): Promise<RespuestaApi<{ ok: boolean }>> =>
    apiPost<{ ok: boolean }>('/admin/contribuciones/moderar', {
        id,
        accion,
        nota: nota ?? '',
    });
