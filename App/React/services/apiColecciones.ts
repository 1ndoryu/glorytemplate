/*
 * Service: apiColecciones — Kamples
 * CRUD de colecciones de samples del usuario.
 * Fallback a mock cuando la API no está disponible.
 */

import { apiGet, apiPost, apiPut, apiDelete } from './apiCliente';
import type { RespuestaApi } from './apiCliente';
import type { Coleccion, ColeccionResumen } from '../types';

/* ========== MOCK DATA ========== */

const coleccionesMock: Coleccion[] = [
    {
        id: 1,
        usuarioId: 1,
        nombre: 'Favoritos Trap',
        descripcion: 'Mis samples favoritos de trap y drill',
        esPublica: true,
        imagenUrl: null,
        totalSamples: 8,
        creadoAt: '2025-12-01T10:00:00Z',
        actualizadoAt: '2025-12-15T14:30:00Z',
    },
    {
        id: 2,
        usuarioId: 1,
        nombre: 'Lo-Fi Chill',
        descripcion: 'Sonidos relajantes para producir',
        esPublica: false,
        imagenUrl: null,
        totalSamples: 5,
        creadoAt: '2025-11-20T08:00:00Z',
        actualizadoAt: '2025-12-10T09:00:00Z',
    },
    {
        id: 3,
        usuarioId: 1,
        nombre: 'Drums Kit',
        descripcion: 'Kicks, snares y hi-hats seleccionados',
        esPublica: true,
        imagenUrl: null,
        totalSamples: 12,
        creadoAt: '2025-10-05T12:00:00Z',
        actualizadoAt: '2025-12-20T16:00:00Z',
    },
];

/* ========== LISTAR ========== */

export const listarColecciones = async (usuarioId?: number): Promise<RespuestaApi<Coleccion[]>> => {
    const resp = await apiGet<Coleccion[]>('/colecciones', usuarioId ? { usuario_id: usuarioId } : {});
    if (!resp.ok) return { ok: true, data: [...coleccionesMock], error: null, status: 200 };
    return resp;
};

/* ========== OBTENER DETALLE ========== */

export const obtenerColeccion = async (id: number): Promise<RespuestaApi<Coleccion>> => {
    const resp = await apiGet<Coleccion>(`/colecciones/${id}`);
    if (!resp.ok) {
        const mock = coleccionesMock.find((c) => c.id === id);
        if (mock) return { ok: true, data: { ...mock, samples: [] }, error: null, status: 200 };
        return { ok: false, data: null, error: 'Colección no encontrada', status: 404 };
    }
    return resp;
};

/* ========== CREAR ========== */

export const crearColeccion = async (datos: {
    nombre: string;
    descripcion?: string;
    esPublica?: boolean;
}): Promise<RespuestaApi<Coleccion>> => {
    const resp = await apiPost<Coleccion>('/colecciones', datos);
    if (!resp.ok) {
        /* Mock: simular creación */
        const nueva: Coleccion = {
            id: Date.now(),
            usuarioId: 1,
            nombre: datos.nombre,
            descripcion: datos.descripcion ?? '',
            esPublica: datos.esPublica ?? false,
            imagenUrl: null,
            totalSamples: 0,
            creadoAt: new Date().toISOString(),
            actualizadoAt: new Date().toISOString(),
        };
        return { ok: true, data: nueva, error: null, status: 201 };
    }
    return resp;
};

/* ========== ACTUALIZAR ========== */

export const actualizarColeccion = async (
    id: number,
    datos: Partial<{ nombre: string; descripcion: string; esPublica: boolean }>
): Promise<RespuestaApi<Coleccion>> => {
    const resp = await apiPut<Coleccion>(`/colecciones/${id}`, datos);
    if (!resp.ok) {
        const mock = coleccionesMock.find((c) => c.id === id);
        if (mock) {
            const actualizada = { ...mock, ...datos, actualizadoAt: new Date().toISOString() };
            return { ok: true, data: actualizada, error: null, status: 200 };
        }
        return { ok: false, data: null, error: 'No encontrada', status: 404 };
    }
    return resp;
};

/* ========== ELIMINAR ========== */

export const eliminarColeccion = async (id: number): Promise<RespuestaApi<{ eliminada: boolean }>> => {
    const resp = await apiDelete<{ eliminada: boolean }>(`/colecciones/${id}`);
    if (!resp.ok) return { ok: true, data: { eliminada: true }, error: null, status: 200 };
    return resp;
};

/* ========== SAMPLES EN COLECCIÓN ========== */

export const agregarSampleAColeccion = async (
    coleccionId: number,
    sampleId: number
): Promise<RespuestaApi<{ agregado: boolean }>> => {
    const resp = await apiPost<{ agregado: boolean }>(`/colecciones/${coleccionId}/samples`, { sampleId });
    if (!resp.ok) return { ok: true, data: { agregado: true }, error: null, status: 200 };
    return resp;
};

export const quitarSampleDeColeccion = async (
    coleccionId: number,
    sampleId: number
): Promise<RespuestaApi<{ eliminado: boolean }>> => {
    const resp = await apiDelete<{ eliminado: boolean }>(`/colecciones/${coleccionId}/samples/${sampleId}`);
    if (!resp.ok) return { ok: true, data: { eliminado: true }, error: null, status: 200 };
    return resp;
};
