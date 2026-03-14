/*
 * Tipos base — Mensaje
 * Representa las conversaciones y mensajes del chat.
 * Soporta mensajes multimedia: texto, imagen, audio, sample.
 */

import type { UsuarioResumen } from './usuario';

export type TipoMensaje = 'texto' | 'imagen' | 'audio' | 'sample';

export interface MediaMetadataImagen {
    formato: string;
    tamano: number;
    mimeType: string;
}

export interface MediaMetadataAudio {
    formato: string;
    tamano: number;
    mimeType: string;
}

export interface MediaMetadataSample {
    sampleId: number;
    titulo: string;
    idCorto: string;
    slug: string;
    tipo: string;
    bpm: number | null;
    key: string | null;
}

export type MediaMetadata = MediaMetadataImagen | MediaMetadataAudio | MediaMetadataSample;

export interface Conversacion {
    id: number;
    participante: UsuarioResumen;
    ultimoMensaje: string;
    ultimoMensajeTipo?: TipoMensaje;
    ultimoMensajeAt: string;
    noLeidos: number;
    esMutuo: boolean;
    /* QK60: true si el usuario acepto la solicitud (respondio). Independiente de follow mutuo. */
    aceptada: boolean;
    enLinea: boolean;
}

export interface Mensaje {
    id: number;
    conversacionId: number;
    remitenteId: number;
    contenido: string;
    tipo: TipoMensaje;
    mediaUrl?: string | null;
    mediaMetadata?: MediaMetadata | null;
    leido: boolean;
    creadoAt: string;
}
