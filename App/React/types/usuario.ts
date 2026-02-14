/*
 * Tipos base — Usuario
 * Representa el perfil extendido de un usuario en Kamples.
 */

export type TipoPlan = 'free' | 'pro' | 'premium';
export type RolUsuario = 'usuario' | 'creador' | 'admin';

export interface Usuario {
    id: number;
    wpUserId: number;
    username: string;
    email: string;
    nombreVisible: string;
    bio: string;
    avatarUrl: string | null;
    portadaUrl: string | null;
    plan: TipoPlan;
    rol: RolUsuario;
    verificado: boolean;
    totalSeguidores: number;
    totalSeguidos: number;
    totalSamples: number;
    totalDescargas: number;
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
