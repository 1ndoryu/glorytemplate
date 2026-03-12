/*
 * Service: apiAdmin — Kamples (FASE 13)
 * Endpoints exclusivos de administración.
 * Todos requieren rol admin (protección backend via AuthMiddleware::requerirAdmin).
 */

import { apiGet, apiPost, apiPut, apiDelete } from './apiCliente';
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
    autor_id: number;
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

export const rechazarTodosPendientes = async (): Promise<RespuestaApi<{ ok: boolean; afectados: number }>> => {
    return apiPost<{ ok: boolean; afectados: number }>('/admin/moderacion/rechazar-pendientes', {});
};

export const banearUsuarioAdmin = async (
    usuarioId: number,
    duracion: '1h' | '24h' | '7d' | '30d',
    razon: string
): Promise<RespuestaApi<{ ok: boolean }>> => {
    return apiPost<{ ok: boolean }>('/admin/moderacion/banear-usuario', { usuario_id: usuarioId, duracion, razon });
};

export const rechazarPublicacionesDeUsuarioAdmin = async (
    autorId: number
): Promise<RespuestaApi<{ ok: boolean; afectados: number }>> => {
    return apiPost<{ ok: boolean; afectados: number }>('/admin/moderacion/rechazar-usuario-publicaciones', { autor_id: autorId });
};

/* Duplicados pendientes (D5) */

export interface DuplicadoAdmin {
    id: number;
    tipo: string;
    estado: string;
    created_at: string;
    original_id: number;
    original_titulo: string;
    original_subido_at: string;
    original_ruta_preview: string | null;
    original_creador: string;
    original_creador_id: number;
    original_slug: string | null;
    duplicado_id: number;
    duplicado_titulo: string;
    duplicado_subido_at: string;
    duplicado_ruta_preview: string | null;
    duplicado_creador: string;
    duplicado_creador_id: number;
    duplicado_slug: string | null;
}

export interface ListaDuplicados {
    duplicados: DuplicadoAdmin[];
    total: number;
    pagina: number;
    porPagina: number;
}

export const listarDuplicados = async (
    estado = 'pendiente',
    tipo?: string,
    pagina = 1
): Promise<RespuestaApi<ListaDuplicados>> => {
    return apiGet<ListaDuplicados>('/admin/duplicados', { estado, tipo, pagina });
};

export const contarDuplicados = async (): Promise<RespuestaApi<{ total: number }>> => {
    return apiGet<{ total: number }>('/admin/duplicados/contar');
};

export const fusionarDuplicado = async (id: number): Promise<RespuestaApi<{ ok: boolean; accion: string }>> => {
    return apiPost<{ ok: boolean; accion: string }>(`/admin/duplicados/${id}/fusionar`, {});
};

export const aprobarDuplicado = async (id: number): Promise<RespuestaApi<{ ok: boolean; accion: string }>> => {
    return apiPost<{ ok: boolean; accion: string }>(`/admin/duplicados/${id}/aprobar`, {});
};

export const rechazarDuplicado = async (id: number): Promise<RespuestaApi<{ ok: boolean; accion: string }>> => {
    return apiPost<{ ok: boolean; accion: string }>(`/admin/duplicados/${id}/rechazar`, {});
};

export const intercambiarDuplicado = async (id: number): Promise<RespuestaApi<{ ok: boolean; accion: string }>> => {
    return apiPost<{ ok: boolean; accion: string }>(`/admin/duplicados/${id}/intercambiar`, {});
};

export interface StatsBackfill {
    procesados: number;
    hasheados: number;
    duplicados: number;
    sin_archivo: number;
}

export const ejecutarBackfillHash = async (batch = 100): Promise<RespuestaApi<{ stats: StatsBackfill }>> => {
    return apiPost<{ stats: StatsBackfill }>('/admin/duplicados/backfill', { batch });
};

/* Herramienta de dev: eliminación masiva de samples */

export interface ResultadoBorradoMasivo {
    ok: boolean;
    eliminados: number;
    errores: number;
}

/*
 * DELETE /admin/samples/todos — Elimina todos los samples de la BD y disco.
 * Solo disponible para admin en modo dev. No hay marcha atrás.
 */
export const eliminarTodosSamples = async (): Promise<RespuestaApi<ResultadoBorradoMasivo>> => {
    return apiDelete<ResultadoBorradoMasivo>('/admin/samples/todos');
};
