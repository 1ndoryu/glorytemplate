/*
 * Tipos base — Colección
 * Representa una colección/playlist de samples del usuario.
 */

import type { UsuarioResumen } from './usuario';
import type { SampleResumen } from './sample';

export interface Coleccion {
    id: number;
    usuarioId: number;
    nombre: string;
    descripcion: string;
    esPublica: boolean;
    imagenUrl: string | null;
    totalSamples: number;
    creadoAt: string;
    actualizadoAt: string;

    /* Relaciones opcionales (pobladas en detalle) */
    usuario?: UsuarioResumen;
    samples?: SampleResumen[];
}

export interface ColeccionResumen {
    id: number;
    nombre: string;
    imagenUrl: string | null;
    totalSamples: number;
    esPublica: boolean;
}
