/*
 * Servicio: apiMensajes — Kamples (Fase 7.2-7.3)
 * Gestión de conversaciones y mensajes del chat.
 * Mock data para desarrollo, backend pendiente (WebSocket en Fase 7.1).
 */

import { apiGet, apiPost, type RespuestaApi } from './apiCliente';
import { crearLogger } from './logger';
import type { Conversacion, Mensaje } from '../types';

const log = crearLogger('apiMensajes');

/* Mock de conversaciones para desarrollo */
const mockConversaciones: Conversacion[] = [
    {
        id: 1,
        participante: {
            id: 2,
            username: 'beatmaker99',
            nombreVisible: 'BeatMaker 99',
            avatarUrl: null,
            verificado: true,
        },
        ultimoMensaje: 'Ese 808 estuvo heavy, tienes más así?',
        ultimoMensajeAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        noLeidos: 2,
        enLinea: true,
    },
    {
        id: 2,
        participante: {
            id: 3,
            username: 'lofi_girl',
            nombreVisible: 'Lo-Fi Girl',
            avatarUrl: null,
            verificado: false,
        },
        ultimoMensaje: 'Gracias por el follow! Me encantan tus loops de piano',
        ultimoMensajeAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        noLeidos: 0,
        enLinea: false,
    },
    {
        id: 3,
        participante: {
            id: 4,
            username: 'drillmaster',
            nombreVisible: 'DrillMaster',
            avatarUrl: null,
            verificado: true,
        },
        ultimoMensaje: 'Colaboramos en un pack? Yo pongo los drums',
        ultimoMensajeAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        noLeidos: 1,
        enLinea: false,
    },
    {
        id: 4,
        participante: {
            id: 5,
            username: 'synthwave_kid',
            nombreVisible: 'Synthwave Kid',
            avatarUrl: null,
            verificado: false,
        },
        ultimoMensaje: 'Uso tus samples en casi todos mis beats jaja',
        ultimoMensajeAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        noLeidos: 0,
        enLinea: true,
    },
];

/* Mock de mensajes por conversación */
const mockMensajesPorConversacion: Record<number, Mensaje[]> = {
    1: [
        {
            id: 1,
            conversacionId: 1,
            remitenteId: 2,
            contenido: 'Bro, acabo de escuchar tu pack de 808s',
            leido: true,
            creadoAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        },
        {
            id: 2,
            conversacionId: 1,
            remitenteId: 1,
            contenido: 'Gracias! Subí unos nuevos ayer',
            leido: true,
            creadoAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
        },
        {
            id: 3,
            conversacionId: 1,
            remitenteId: 2,
            contenido: 'Los vi, están brutales. El sub bass es tremendo',
            leido: true,
            creadoAt: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
        },
        {
            id: 4,
            conversacionId: 1,
            remitenteId: 1,
            contenido: 'Ese lo grabé de un sintetizador analógico, por eso suena diferente',
            leido: true,
            creadoAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        },
        {
            id: 5,
            conversacionId: 1,
            remitenteId: 2,
            contenido: 'Se nota la diferencia, suenan más cálidos',
            leido: true,
            creadoAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
        },
        {
            id: 6,
            conversacionId: 1,
            remitenteId: 2,
            contenido: 'Ese 808 estuvo heavy, tienes más así?',
            leido: false,
            creadoAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        },
    ],
    2: [
        {
            id: 10,
            conversacionId: 2,
            remitenteId: 3,
            contenido: 'Hey! Vi que me seguiste, gracias!',
            leido: true,
            creadoAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
        },
        {
            id: 11,
            conversacionId: 2,
            remitenteId: 1,
            contenido: 'De nada! Tus loops de lo-fi son increíbles',
            leido: true,
            creadoAt: new Date(Date.now() - 2.5 * 60 * 60 * 1000).toISOString(),
        },
        {
            id: 12,
            conversacionId: 2,
            remitenteId: 3,
            contenido: 'Gracias por el follow! Me encantan tus loops de piano',
            leido: true,
            creadoAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        },
    ],
    3: [
        {
            id: 20,
            conversacionId: 3,
            remitenteId: 4,
            contenido: 'Ey, he visto tus melodies y creo que pegarían con mis drums',
            leido: true,
            creadoAt: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(),
        },
        {
            id: 21,
            conversacionId: 3,
            remitenteId: 1,
            contenido: 'Me interesa! ¿Qué tipo de drums haces?',
            leido: true,
            creadoAt: new Date(Date.now() - 24.5 * 60 * 60 * 1000).toISOString(),
        },
        {
            id: 22,
            conversacionId: 3,
            remitenteId: 4,
            contenido: 'Colaboramos en un pack? Yo pongo los drums',
            leido: false,
            creadoAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        },
    ],
    4: [
        {
            id: 30,
            conversacionId: 4,
            remitenteId: 5,
            contenido: 'Uso tus samples en casi todos mis beats jaja',
            leido: true,
            creadoAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        },
    ],
};

/* Obtener lista de conversaciones */
export const obtenerConversaciones = async (): Promise<RespuestaApi<Conversacion[]>> => {
    try {
        const resp = await apiGet<Conversacion[]>('/mensajes/conversaciones');
        if (resp.ok && resp.data && resp.data.length > 0) return resp;
        throw new Error('Sin datos');
    } catch {
        log.debug('Usando conversaciones mock');
        return { ok: true, data: mockConversaciones, error: null, status: 200 };
    }
};

/* Obtener mensajes de una conversación */
export const obtenerMensajes = async (
    conversacionId: number,
    pagina = 1
): Promise<RespuestaApi<Mensaje[]>> => {
    try {
        const resp = await apiGet<Mensaje[]>(`/mensajes/${conversacionId}`, { page: pagina });
        if (resp.ok && resp.data && resp.data.length > 0) return resp;
        throw new Error('Sin datos');
    } catch {
        log.debug('Usando mensajes mock', { conversacionId });
        const mensajes = mockMensajesPorConversacion[conversacionId] ?? [];
        return { ok: true, data: mensajes, error: null, status: 200 };
    }
};

/* Enviar mensaje en una conversación */
export const enviarMensaje = async (
    conversacionId: number,
    contenido: string
): Promise<RespuestaApi<Mensaje>> => {
    try {
        return await apiPost<Mensaje>(`/mensajes/${conversacionId}`, { contenido });
    } catch {
        /* Mock: crear mensaje local */
        const nuevoMensaje: Mensaje = {
            id: Date.now(),
            conversacionId,
            remitenteId: 1,
            contenido,
            leido: false,
            creadoAt: new Date().toISOString(),
        };
        log.debug('Enviado mensaje mock', nuevoMensaje);
        return { ok: true, data: nuevoMensaje, error: null, status: 201 };
    }
};

/* Marcar conversación como leída */
export const marcarConversacionLeida = async (
    conversacionId: number
): Promise<RespuestaApi<void>> => {
    try {
        return await apiPost<void>(`/mensajes/${conversacionId}/leer`);
    } catch {
        log.debug('Marcar leída mock', { conversacionId });
        return { ok: true, data: null, error: null, status: 200 };
    }
};

/* Iniciar nueva conversación con un usuario */
export const iniciarConversacion = async (
    usuarioId: number
): Promise<RespuestaApi<Conversacion>> => {
    try {
        return await apiPost<Conversacion>('/mensajes/nueva', { usuarioId });
    } catch {
        log.debug('Iniciar conversación mock', { usuarioId });
        const nueva: Conversacion = {
            id: Date.now(),
            participante: {
                id: usuarioId,
                username: `usuario_${usuarioId}`,
                nombreVisible: `Usuario ${usuarioId}`,
                avatarUrl: null,
                verificado: false,
            },
            ultimoMensaje: '',
            ultimoMensajeAt: new Date().toISOString(),
            noLeidos: 0,
            enLinea: false,
        };
        return { ok: true, data: nueva, error: null, status: 201 };
    }
};
