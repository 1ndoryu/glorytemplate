/*
 * Tipos base — Notificacion
 * Tipos para el sistema de notificaciones.
 */

import type { UsuarioResumen } from './usuario';

export type TipoNotificacion =
    | 'like'
    | 'encanta'
    | 'follow'
    | 'comentario'
    | 'descarga'
    | 'mensaje'
    | 'pago'
    | 'sistema'
    | 'moderacion'
    | 'duplicado_detectado';

export interface Notificacion {
    id: number;
    tipo: TipoNotificacion;
    titulo: string;
    mensaje: string;
    leida: boolean;
    enlace: string | null;
    creadoAt: string;

    /* El actor que origino la notificacion (quien dio like, etc.) */
    actor?: UsuarioResumen;
}
