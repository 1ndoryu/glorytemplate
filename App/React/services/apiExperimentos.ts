/*
 * Service: apiExperimentos — Kamples
 * Genera contenido de test realista (solo admin).
 */

import { apiPost, type RespuestaApi } from './apiCliente';

export interface ResultadoExperimento {
    usuario?: {
        pgId: number;
        username: string;
        nombre: string;
        mensaje: string;
    };
    notificacion?: {
        tipo: string;
        destino: number;
        actor: number;
        mensaje: string;
    };
    mensaje?: {
        conversacionId: number;
        contenido: string;
        remitente: string;
        mensaje: string;
        error?: string;
    };
}

type Accion = 'usuario' | 'notificacion' | 'mensaje';

export const generarExperimento = (
    acciones?: Accion[]
): Promise<RespuestaApi<{ ok: boolean; data: ResultadoExperimento }>> =>
    apiPost('/admin/experimentos/generar', acciones ? { acciones } : {});

/* Embeddings pgvector */
export interface ResultadoEmbeddings {
    ok: boolean;
    actualizados: number;
    tiempoMs: number;
    mensaje: string;
}

export const generarEmbeddings = (): Promise<RespuestaApi<ResultadoEmbeddings>> =>
    apiPost('/admin/embeddings/generar', {});

export const regenerarEmbeddings = (): Promise<RespuestaApi<ResultadoEmbeddings>> =>
    apiPost('/admin/embeddings/regenerar', {});
