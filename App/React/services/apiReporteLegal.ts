/*
 * Service: API Reporte Legal — Kamples
 * Endpoint publico para reclamaciones DMCA / derechos de autor.
 * No requiere autenticacion (titulares externos pueden reportar).
 */

import { apiPost } from './apiCliente';
import type { RespuestaApi } from './apiCliente';

export interface DatosReporteLegal {
    tipo: 'legal_sample' | 'legal_relacion';
    target_id: number;
    razon: string;
    nombre: string;
    email: string;
    tipo_derecho: 'copyright' | 'trademark' | 'otro';
    obra_protegida: string;
    declaracion: boolean;
}

export interface RespuestaReporteLegal {
    ok: boolean;
    reporte_id?: number;
    mensaje?: string;
    error?: string;
}

export const crearReporteLegal = (
    datos: DatosReporteLegal
): Promise<RespuestaApi<RespuestaReporteLegal>> =>
    apiPost<RespuestaReporteLegal>('/reportar-legal', datos);
