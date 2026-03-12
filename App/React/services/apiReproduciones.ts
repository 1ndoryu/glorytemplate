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
): Promise<RespuestaApi<SampleResumen[]>> => {
    try {
        /* apiGet auto-unwrap: backend {data:[...],page} → resp.data = [...] */
        return await apiGet<SampleResumen[]>('/reproducciones/historial', {
            page: pagina,
            per_page: porPagina,
        });
    } catch (err) {
        log.error('Error obteniendo historial', err);
        return { ok: false, data: [], error: 'Error cargando historial', status: 0 };
    }
};

/*
 * QQ46: IDs de samples que el usuario ha reproducido (query liviana).
 * Usado por reproducidosStore para mostrar indicador de "no reproducido".
 * Endpoint: GET /reproducciones/ids
 */
export const obtenerIdsReproducidos = async (): Promise<RespuestaApi<number[]>> => {
    try {
        return await apiGet<number[]>('/reproducciones/ids');
    } catch (err) {
        log.error('Error obteniendo IDs reproducidos', err);
        return { ok: false, data: [], error: 'Error de red', status: 0 };
    }
};

/*
 * Samples similares por metadata (tags, BPM, key, tipo).
 * C142: Corregido tipo — apiCliente ya desenvuelve json.data, no hace falta { data: ... }.
 * Endpoint: GET /samples/{id}/similares
 */
export const obtenerSimilares = async (
    sampleId: number,
    limite = 5
): Promise<RespuestaApi<SampleResumen[]>> => {
    try {
        return await apiGet<SampleResumen[]>(
            `/samples/${sampleId}/similares`,
            { limite }
        );
    } catch (err) {
        log.error('Error obteniendo samples similares', err);
        return { ok: false, data: [], error: 'Error de red', status: 0 };
    }
};
