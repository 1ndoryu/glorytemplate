/*
 * Tipos base — Usuario
 * Representa el perfil extendido de un usuario en Kamples.
 * Incluye ubicacion y sitioWeb opcionales (C119).
 * Union types derivados del Schema System (CHECK constraints de la DB).
 */

import type { IUsuariosExt } from './_generated/schema';

/* Derivados del schema — se actualizan automaticamente con npx glory schema:generate */
export type TipoPlan = IUsuariosExt['plan'];
export type RolUsuario = IUsuariosExt['rol'];

export interface Usuario {
    id: number;
    wpUserId: number;
    username: string;
    email: string;
    nombreVisible: string;
    bio: string;
    avatarUrl: string | null;
    portadaUrl: string | null;
    ubicacion: string | null;
    sitioWeb: string | null;
    plan: TipoPlan;
    rol: RolUsuario;
    verificado: boolean;
    totalSeguidores: number;
    totalSeguidos: number;
    totalSamples: number;
    totalDescargas: number;
    siguiendo?: boolean;
    stripeCustomerId: string | null;
    stripeConnectId: string | null;
    creadoAt: string;
    actualizadoAt: string;
}

/* Version resumida para tarjetas, listas y relaciones */
export interface UsuarioResumen {
    id: number;
    username: string;
    nombreVisible: string;
    avatarUrl: string | null;
    verificado: boolean;
}

/* Datos del usuario autenticado (incluye campos privados) */
export interface UsuarioAutenticado extends Usuario {
    descargasHoy: number;
    limiteDescargas: number;
    subidasEsteMes: number;
    limiteSubidas: number;
    mensajesHoy: number;
    limiteMensajes: number;
}
