/*
 * Service: apiAdmin — Kamples (FASE 13)
 * Endpoints exclusivos de administración.
 * Todos requieren rol admin (protección backend via AuthMiddleware::requerirAdmin).
 */

import { apiGet, apiPost, apiPut } from './apiCliente';
import type { RespuestaApi } from './apiCliente';

/* Tipos de respuesta */

export interface KpisAdmin {
    total_usuarios: number;
    total_samples: number;
    total_descargas: number;
    total_publicaciones: number;
    pendientes_moderacion: number;
    reportes_pendientes: number;
    usuarios_pro: number;
    usuarios_premium: number;
    samples_semana: number;
    registros_semana: number;
}

export interface PuntoActividad {
    fecha: string;
    total: number;
}

export interface DatosActividad {
    registros: PuntoActividad[];
    uploads: PuntoActividad[];
    descargas: PuntoActividad[];
}

export interface UsuarioAdmin {
    id: number;
    username: string;
    nombre_visible: string;
    email: string;
    avatar_url: string | null;
    plan: string;
    rol: string;
    verificado: boolean;
    ban_hasta: string | null;
    created_at: string;
    updated_at: string;
    total_samples: number;
    total_descargas: number;
}

export interface PublicacionModeracion {
    id: number;
    contenido: string;
    imagenes: string[];
    moderacion_estado: string;
    moderacion_detalle: string | null;
    moderacion_razon: string | null;
    created_at: string;
    username: string;
    nombre_visible: string;
    avatar_url: string | null;
    tipo_contenido: string;
}

export interface ReporteAdmin {
    id: number;
    reportador_id: number;
    reportador_username: string;
    tipo: string;
    target_id: number;
    motivo: string;
    estado: string;
    created_at: string;
}

export interface DatosModeracion {
    publicaciones: PublicacionModeracion[];
    reportes: ReporteAdmin[];
    reportesTotal?: number;
}

export interface DatosHistorialModeracion {
    publicaciones: PublicacionModeracion[];
}

/* Endpoints */

export const obtenerResumenAdmin = async (): Promise<RespuestaApi<KpisAdmin>> => {
    return apiGet<KpisAdmin>('/admin/resumen');
};

export const obtenerActividadAdmin = async (dias = 7): Promise<RespuestaApi<DatosActividad>> => {
    return apiGet<DatosActividad>('/admin/actividad', { dias });
};

export const listarUsuariosAdmin = async (
    page = 1,
    busqueda = '',
    plan = '',
    orden = 'fecha'
): Promise<RespuestaApi<{ data: UsuarioAdmin[]; total: number; page: number }>> => {
    return apiGet<{ data: UsuarioAdmin[]; total: number; page: number }>(
        '/admin/usuarios',
        { page, busqueda, plan, orden }
    );
};

export const actualizarUsuarioAdmin = async (
    id: number,
    cambios: {
        plan?: string;
        rol?: string;
        verificado?: boolean;
        ban_hasta?: string | null;
    }
): Promise<RespuestaApi<{ ok: boolean }>> => {
    return apiPut<{ ok: boolean }>(`/admin/usuarios/${id}`, cambios);
};

export const listarModeracion = async (page = 1): Promise<RespuestaApi<DatosModeracion>> => {
    return apiGet<DatosModeracion>('/admin/moderacion', { page });
};

export const moderarContenido = async (
    tipo: 'publicacion' | 'comentario',
    id: number,
    accion: 'aprobar' | 'rechazar'
): Promise<RespuestaApi<{ ok: boolean }>> => {
    return apiPost<{ ok: boolean }>('/admin/moderar', { tipo, id, accion });
};

export const resolverReporte = async (
    id: number,
    accion: 'resolver' | 'descartar'
): Promise<RespuestaApi<{ ok: boolean }>> => {
    return apiPost<{ ok: boolean }>('/admin/reportes/resolver', { id, accion });
};

export const obtenerHistorialModeracion = async (dias = 2): Promise<RespuestaApi<DatosHistorialModeracion>> => {
    return apiGet<DatosHistorialModeracion>('/admin/moderacion/historial', { dias });
};
