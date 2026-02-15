/*
 * Servicio: apiReproduciones — Kamples
 * Tracking de reproducciones, historial y samples similares.
 * Conecta con ReproduccionesController.php.
 */

import { apiGet, apiPost, type RespuestaApi } from './apiCliente';
import { crearLogger } from './logger';
import type { SampleResumen } from '../types';

const log = crearLogger('apiReproduciones');

export interface DatosReproduccion {
    duracionEscuchada?: number;
    completada?: boolean;
}

export interface RespuestaHistorial {
    data: SampleResumen[];
    page: number;
}

/*
 * Registra una reproducción con debounce en backend (3s).
 * Endpoint: POST /samples/{id}/reproduccion
 */
export const registrarReproduccion = async (
    sampleId: number,
    datos: DatosReproduccion = {}
): Promise<RespuestaApi<{ ok: boolean; debounce?: boolean }>> => {
    try {
        return await apiPost<{ ok: boolean; debounce?: boolean }>(
            `/samples/${sampleId}/reproduccion`,
            {
                duracion_escuchada: datos.duracionEscuchada ?? 0,
                completada: datos.completada ?? false,
            }
        );
    } catch (err) {
        log.error('Error registrando reproducción', err);
        return { ok: false, data: null, error: 'Error de red', status: 0 };
    }
};

/*
 * Historial de reproducciones del usuario autenticado.
 * Endpoint: GET /reproducciones/historial
 */
export const obtenerHistorial = async (
    pagina = 1,
    porPagina = 20
): Promise<RespuestaApi<RespuestaHistorial>> => {
    try {
        return await apiGet<RespuestaHistorial>('/reproducciones/historial', {
            page: pagina,
            per_page: porPagina,
        });
    } catch (err) {
        log.error('Error obteniendo historial', err);
        return { ok: true, data: { data: [], page: pagina }, error: null, status: 200 };
    }
};

/*
 * Samples similares por metadata (tags, BPM, key, tipo).
 * Usado en SampleDetalleIsland y modal "También te podría gustar".
 * Endpoint: GET /samples/{id}/similares
 */
export const obtenerSimilares = async (
    sampleId: number,
    limite = 5
): Promise<RespuestaApi<{ data: SampleResumen[] }>> => {
    try {
        return await apiGet<{ data: SampleResumen[] }>(
            `/samples/${sampleId}/similares`,
            { limite }
        );
    } catch (err) {
        log.error('Error obteniendo samples similares', err);
        return { ok: true, data: { data: [] }, error: null, status: 200 };
    }
};
