/*
 * Servicio: apiMensajes — Kamples (Fase 7.2-7.3)
 * Gestión de conversaciones y mensajes del chat.
 * Conectado a API real. Backend WebSocket pendiente (Fase 7.1).
 */

import { apiGet, apiPost, type RespuestaApi } from './apiCliente';
import { crearLogger } from './logger';
import type { Conversacion, Mensaje } from '../types';

const log = crearLogger('apiMensajes');

/* Obtener lista de conversaciones */
export const obtenerConversaciones = async (): Promise<RespuestaApi<Conversacion[]>> => {
    try {
        return await apiGet<Conversacion[]>('/mensajes/conversaciones');
    } catch (err) {
        log.error('Error obteniendo conversaciones', err);
        return { ok: true, data: [], error: null, status: 200 };
    }
};

/* Obtener mensajes de una conversación */
export const obtenerMensajes = async (
    conversacionId: number,
    pagina = 1
): Promise<RespuestaApi<Mensaje[]>> => {
    try {
        return await apiGet<Mensaje[]>(`/mensajes/${conversacionId}`, { page: pagina });
    } catch (err) {
        log.error('Error obteniendo mensajes', err);
        return { ok: true, data: [], error: null, status: 200 };
    }
};

/* Enviar mensaje en una conversación */
export const enviarMensaje = async (
    conversacionId: number,
    contenido: string
): Promise<RespuestaApi<Mensaje>> => {
    try {
        return await apiPost<Mensaje>(`/mensajes/${conversacionId}`, { contenido });
    } catch (err) {
        log.error('Error enviando mensaje', err);
        return { ok: false, data: null, error: 'Error de red', status: 500 };
    }
};

/* Marcar conversación como leída */
export const marcarConversacionLeida = async (
    conversacionId: number
): Promise<RespuestaApi<void>> => {
    try {
        return await apiPost<void>(`/mensajes/${conversacionId}/leer`);
    } catch (err) {
        log.error('Error marcando conversación leída', err);
        return { ok: false, data: null, error: 'Error de red', status: 500 };
    }
};

/* Iniciar nueva conversación con un usuario */
export const iniciarConversacion = async (
    usuarioId: number
): Promise<RespuestaApi<Conversacion>> => {
    try {
        return await apiPost<Conversacion>('/mensajes/nueva', { usuarioId });
    } catch (err) {
        log.error('Error iniciando conversación', err);
        return { ok: false, data: null, error: 'Error de red', status: 500 };
    }
};
