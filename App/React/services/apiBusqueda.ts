/*
 * Service: apiBusqueda
 * Llamada al endpoint de búsqueda rápida para el dropdown de resultados.
 */

import { apiPeticion, type RespuestaApi } from './apiCliente';

/* Tipos para resultados de búsqueda rápida */

export interface ResultadoCancion {
    id: number;
    titulo: string;
    slug: string;
    artistaNombre: string | null;
    imagenUrl: string | null;
    totalSampleada: number;
}

export interface ResultadoSample {
    id: number;
    titulo: string;
    slug: string;
    imagenUrl: string | null;
    creador: {
        username: string;
        nombreVisible: string;
        avatarUrl: string | null;
    };
}

export interface ResultadoSampleo {
    id: number;
    fuente: {
        titulo: string;
        slug: string;
        imagenUrl: string | null;
        artista: string;
    };
    destino: {
        titulo: string;
        slug: string;
        imagenUrl: string | null;
        artista: string;
    };
}

export interface ResultadoUsuario {
    id: number;
    username: string;
    nombreVisible: string;
    avatarUrl: string | null;
    verificado: boolean;
    totalSeguidores: number;
}

export interface ResultadosBusquedaRapida {
    canciones: ResultadoCancion[];
    samples: ResultadoSample[];
    sampleos: ResultadoSampleo[];
    usuarios: ResultadoUsuario[];
}

/**
 * Busca canciones, samples, sampleos y usuarios en un solo request.
 * Mínimo 2 caracteres para disparar la búsqueda.
 */
export const busquedaRapida = (
    q: string,
    signal?: AbortSignal
): Promise<RespuestaApi<ResultadosBusquedaRapida>> =>
    apiPeticion<ResultadosBusquedaRapida>('/busqueda/rapida', {
        params: { q },
        signal,
    });
