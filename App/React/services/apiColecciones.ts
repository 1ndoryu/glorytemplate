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

/* ========== COLECCIONES PÚBLICAS (explorar) ========== */

/* Mock de colecciones públicas de otros usuarios */
const coleccionesPublicasMock: Coleccion[] = [
    {
        id: 101,
        usuarioId: 5,
        nombre: 'Texturas Ambient',
        descripcion: 'Pads y texturas para lo-fi y ambient',
        esPublica: true,
        imagenUrl: null,
        totalSamples: 24,
        creadoAt: '2025-11-01T10:00:00Z',
        actualizadoAt: '2025-12-28T14:30:00Z',
        usuario: { id: 5, username: 'ambientprod', nombreVisible: 'Ambient Producer', avatarUrl: null, verificado: false },
    },
    {
        id: 102,
        usuarioId: 8,
        nombre: 'Drum Breaks Gold',
        descripcion: 'Los mejores breaks seleccionados',
        esPublica: true,
        imagenUrl: null,
        totalSamples: 18,
        creadoAt: '2025-10-15T08:00:00Z',
        actualizadoAt: '2025-12-20T09:00:00Z',
        usuario: { id: 8, username: 'breakbeats', nombreVisible: 'Break Beats', avatarUrl: null, verificado: false },
    },
    {
        id: 103,
        usuarioId: 12,
        nombre: 'Vocal Chops 2025',
        descripcion: 'Chops vocales frescos para hip-hop y pop',
        esPublica: true,
        imagenUrl: null,
        totalSamples: 31,
        creadoAt: '2025-09-20T12:00:00Z',
        actualizadoAt: '2025-12-15T16:00:00Z',
        usuario: { id: 12, username: 'vocalking', nombreVisible: 'Vocal King', avatarUrl: null, verificado: true },
    },
    {
        id: 104,
        usuarioId: 3,
        nombre: '808 Essentials',
        descripcion: 'Kicks y bass 808 para trap y drill',
        esPublica: true,
        imagenUrl: null,
        totalSamples: 42,
        creadoAt: '2025-08-01T10:00:00Z',
        actualizadoAt: '2025-12-22T11:00:00Z',
        usuario: { id: 3, username: 'trapmaster', nombreVisible: 'Trap Master', avatarUrl: null, verificado: true },
    },
    {
        id: 105,
        usuarioId: 7,
        nombre: 'Synth Leads Fire',
        descripcion: 'Leads analógicos y digitales seleccionados',
        esPublica: true,
        imagenUrl: null,
        totalSamples: 16,
        creadoAt: '2025-11-10T14:00:00Z',
        actualizadoAt: '2025-12-25T18:00:00Z',
        usuario: { id: 7, username: 'synthwave', nombreVisible: 'Synth Wave', avatarUrl: null, verificado: false },
    },
    {
        id: 106,
        usuarioId: 15,
        nombre: 'Foley & FX Pack',
        descripcion: 'Efectos de sonido y foley para producción',
        esPublica: true,
        imagenUrl: null,
        totalSamples: 55,
        creadoAt: '2025-07-05T09:00:00Z',
        actualizadoAt: '2025-12-18T20:00:00Z',
        usuario: { id: 15, username: 'soundfx', nombreVisible: 'Sound FX Pro', avatarUrl: null, verificado: false },
    },
];

export const listarColeccionesPublicas = async (): Promise<RespuestaApi<Coleccion[]>> => {
    const resp = await apiGet<Coleccion[]>('/colecciones/publicas');
    if (!resp.ok) return { ok: true, data: [...coleccionesPublicasMock], error: null, status: 200 };
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
