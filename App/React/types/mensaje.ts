/*
 * Tipos base — Mensaje
 * Representa las conversaciones y mensajes del chat.
 */

import type { UsuarioResumen } from './usuario';

export interface Conversacion {
    id: number;
    participante: UsuarioResumen;
    ultimoMensaje: string;
    ultimoMensajeAt: string;
    noLeidos: number;
    enLinea: boolean;
}

export interface Mensaje {
    id: number;
    conversacionId: number;
    remitenteId: number;
    contenido: string;
    leido: boolean;
    creadoAt: string;
}
