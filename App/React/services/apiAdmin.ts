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
    estado: string | null;
    suspendido_hasta: string | null;
    suspension_razon: string | null;
    sera_eliminado_en: string | null;
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
    razon: string;
    detalles: string | null;
    estado: string;
    created_at: string;
}

/* [183A-109 Fase 4] Artículo pendiente de moderación */
export interface ArticuloModeracion {
    id: number;
    titulo: string;
    slug: string;
    extracto: string | null;
    moderacion_estado: string;
    moderacion_razon: string | null;
    created_at: string;
    autor_username: string;
    autor_nombre: string | null;
    autor_avatar: string | null;
}

export interface DatosModeracion {
    publicaciones: PublicacionModeracion[];
    articulos: ArticuloModeracion[];
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
    tipo: 'publicacion' | 'comentario' | 'articulo',
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
    original_ruta_waveform: string | null;
    original_creador: string;
    original_creador_id: number;
    original_slug: string | null;
    /* QL70: Hashes para agrupación de duplicados */
    original_hash: string | null;
    duplicado_id: number;
    duplicado_titulo: string;
    duplicado_subido_at: string;
    duplicado_ruta_preview: string | null;
    duplicado_ruta_waveform: string | null;
    duplicado_creador: string;
    duplicado_creador_id: number;
    duplicado_slug: string | null;
    duplicado_hash: string | null;
}

/*
 * QL70: Grupo de duplicados del mismo original.
 * Agrupa registros de duplicados_pendientes que comparten el mismo sample_original_id.
 */
export interface GrupoDuplicados {
    originalId: number;
    originalTitulo: string;
    originalCreador: string;
    originalCreadorId: number;
    originalSubidoAt: string;
    originalRutaPreview: string | null;
    originalRutaWaveform: string | null;
    originalSlug: string | null;
    originalHash: string | null;
    instancias: DuplicadoAdmin[];
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

/* QQ65: Suspensión de usuarios */

export const suspenderUsuarioAdmin = async (
    id: number,
    horas: number,
    razon: string
): Promise<RespuestaApi<{ ok: boolean }>> => {
    return apiPost<{ ok: boolean }>(`/admin/usuarios/${id}/suspender`, { horas, razon });
};

export const desuspenderUsuarioAdmin = async (
    id: number
): Promise<RespuestaApi<{ ok: boolean }>> => {
    return apiPost<{ ok: boolean }>(`/admin/usuarios/${id}/desuspender`, {});
};

/* QK40: Scrapers (scraping_log) */

export interface ScraperItemAdmin {
    id: number;
    url: string;
    tipo_pagina: string;
    estado: string;
    intentos: number;
    bytes_descargados: number;
    error_mensaje: string | null;
    re_scrapeable: boolean;
    veces_rescrapeado: number;
    procesado_at: string | null;
    created_at: string;
}

export const listarScrapersAdmin = async (
    page = 1,
    busqueda = '',
    estado = '',
    sortCol = '',
    sortDir = ''
): Promise<RespuestaApi<ScraperItemAdmin[]>> => {
    return apiGet<ScraperItemAdmin[]>('/admin/scrapers', { page, busqueda, estado, sort_col: sortCol, sort_dir: sortDir });
};

/* QK40: Cola de extracción (cola_extraccion_samples) */

export interface ColaExtraccionItemAdmin {
    id: number;
    relacion_id: number;
    youtube_id: string | null;
    spotify_id: string | null;
    estado: string;
    intentos: number;
    lado: string;
    error_mensaje: string | null;
    sample_id: number | null;
    timing_inicio_seg: number | null;
    compas_inicio_seg: number | null;
    compas_fin_seg: number | null;
    bpm_detectado: number | null;
    procesado_at: string | null;
    created_at: string;
    proximo_intento_at: string | null;
}

export const listarColaExtraccionAdmin = async (
    page = 1,
    busqueda = '',
    estado = '',
    sortCol = '',
    sortDir = '',
    lado = ''
): Promise<RespuestaApi<ColaExtraccionItemAdmin[]>> => {
    return apiGet<ColaExtraccionItemAdmin[]>('/admin/cola-extraccion', { page, busqueda, estado, sort_col: sortCol, sort_dir: sortDir, lado });
};

export const marcarEliminacionUsuarioAdmin = async (
    id: number,
    razon: string
): Promise<RespuestaApi<{ ok: boolean }>> => {
    return apiPost<{ ok: boolean }>(`/admin/usuarios/${id}/eliminar`, { razon });
};

export const cancelarEliminacionUsuarioAdmin = async (
    id: number
): Promise<RespuestaApi<{ ok: boolean }>> => {
    return apiPost<{ ok: boolean }>(`/admin/usuarios/${id}/cancelar-eliminacion`, {});
};
