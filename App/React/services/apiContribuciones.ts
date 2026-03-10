/*
 * Service: API Contribuciones — Kamples
 * Endpoints del sistema de contribuciones comunitarias de Sample Discovery.
 * Los usuarios registrados pueden proponer relaciones sample-cancion.
 */

import { apiGet, apiPost } from './apiCliente';
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
    createdAt: string;
    /* campos de join opcionales */
    destinoTitulo?: string;
    fuenteTitulo?: string;
}

export interface RespuestaContribucion {
    ok: boolean;
    contribucion_id?: number;
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
): Promise<RespuestaApi<ContribucionResumen[]>> =>
    apiGet<ContribucionResumen[]>('/contribuciones/mis', {
        pagina,
        por_pagina: porPagina,
    });
