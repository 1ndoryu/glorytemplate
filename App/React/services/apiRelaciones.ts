/*
 * Service: API Relaciones — Kamples
 * Endpoints para vincular/desvincular samples a relaciones de sampleo.
 * L7.3 y L7.5: operaciones directas sobre relaciones_sample.
 */

import { apiPost, apiDelete, apiPut } from './apiCliente';
import type { RespuestaApi } from './apiCliente';

export type LadoRelacion = 'fuente' | 'destino';

/* L7.3: Vincular un sample existente a una relacion */
export const vincularSample = (
    relacionId: number,
    sampleId: number,
    lado: LadoRelacion,
): Promise<RespuestaApi<void>> =>
    apiPost(`/relaciones/${relacionId}/vincular-sample`, { sample_id: sampleId, lado });

/* L7.5: Desvincular sample de una relacion (no elimina el sample) */
export const desvincularSample = (
    relacionId: number,
    lado: LadoRelacion,
): Promise<RespuestaApi<void>> =>
    apiDelete(`/relaciones/${relacionId}/sample/${lado}`);

/* Verificar o desverificar una relacion — solo admin */
export const verificarRelacion = (
    relacionId: number,
    verificada: boolean,
): Promise<RespuestaApi<{ ok: boolean; verificada: boolean }>> =>
    apiPut(`/relaciones/${relacionId}/verificar`, { verificada });
