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

    /* C388: Tags agregados de los samples de esta colección */
    tags: string[];

    /* Jerarquía: null = colección raíz, number = subcolección */
    parentId: number | null;

    /* Relaciones opcionales (pobladas en detalle) */
    usuario?: UsuarioResumen;
    samples?: SampleResumen[];
    subcolecciones?: ColeccionResumen[];

    /* Campo calculado: indica si un sample específico ya está en esta colección */
    contieneElSample?: boolean;
}

export interface ColeccionResumen {
    id: number;
    nombre: string;
    imagenUrl: string | null;
    totalSamples: number;
    esPublica: boolean;
    parentId: number | null;
    tags: string[];
}
