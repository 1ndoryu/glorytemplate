/*
 * Servicio: apiSugerencias — Kamples (C140)
 * Endpoints de sugerencias "Más Ideas" para descargas y favoritos.
 * Patron idéntico a apiColecciones.obtenerSugerencias().
 */

import { apiGet } from './apiCliente';
import type { RespuestaApi } from './apiCliente';
import type { SampleResumen } from '@app/types';

/*
 * Sugerencias basadas en los samples descargados del usuario.
 * Backend analiza tags/BPM/key de descargas y sugiere similares.
 */
export const obtenerSugerenciasDescargas = async (
    pagina = 1, limite = 20
): Promise<RespuestaApi<SampleResumen[]>> => {
    return apiGet<SampleResumen[]>('/me/descargas/sugerencias', { pagina, limite });
};

/*
 * Sugerencias basadas en los samples favoritos del usuario.
 * Backend analiza tags/BPM/key de favoritos y sugiere similares.
 */
export const obtenerSugerenciasFavoritos = async (
    pagina = 1, limite = 20
): Promise<RespuestaApi<SampleResumen[]>> => {
    return apiGet<SampleResumen[]>('/me/favoritos/sugerencias', { pagina, limite });
};
