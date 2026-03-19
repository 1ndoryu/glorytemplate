/*
 * Tipos base — Articulo
 * Representa un artículo del blog de Kamples.
 * Campos derivados del Schema System (ArticulosSchema).
 */

import type { UsuarioResumen } from './usuario';

export type CategoriaArticulo =
    | 'inspiracion' | 'mastering' | 'mezcla' | 'promocion-musical'
    | 'teoria-musical' | 'grabacion' | 'sampling' | 'diseno-sonoro' | 'herramientas'
    | 'ableton-live' | 'bitwig-studio' | 'cubase' | 'fl-studio'
    | 'garageband' | 'logic-pro' | 'pro-tools' | 'studio-one'
    | 'drops-gratis' | 'midi-gratis' | 'plugins-gratis' | 'presets-gratis'
    | 'proyectos-gratis' | 'sonidos-gratis'
    | 'entrevistas' | 'destacados' | 'noticias';

export type ModeracionEstadoArticulo = 'pendiente' | 'revision' | 'aprobado' | 'rechazado';

export interface EmbedArticulo {
    tipo: 'sample' | 'coleccion';
    id: number;
    descargaPublica?: boolean;
}

/* [183A-110-C] Adjunto con datos de visualización para el editor.
 * Extiende EmbedArticulo con info necesaria para renderizar previews
 * (tarjeta sample o cabecera colección) sin re-fetch. */
export interface AdjuntoArticulo {
    tipo: 'sample' | 'coleccion';
    id: number;
    titulo: string;
    imagenUrl: string | null;
    creadorNombre: string;
    slug: string;
    totalSamples?: number;
    descargaPublica: boolean;
}

export interface Articulo {
    id: number;
    autorId: number;
    titulo: string;
    slug: string;
    contenido: string;
    extracto: string;
    portadaUrl: string | null;
    categoria: CategoriaArticulo;
    embeds: EmbedArticulo[];
    descargaPublica: boolean;
    totalLikes: number;
    totalComentarios: number;
    moderacionEstado: ModeracionEstadoArticulo;
    creadoAt: string;
    publicadoEn: string | null;

    /* Relación — inyectada por el backend al normalizar */
    autor: UsuarioResumen;

    /* Estado del usuario autenticado */
    liked?: boolean;
}

export interface ArticuloResumen {
    id: number;
    titulo: string;
    slug: string;
    extracto: string;
    portadaUrl: string | null;
    categoria: CategoriaArticulo;
    totalLikes: number;
    totalComentarios: number;
    publicadoEn: string | null;
    autor: UsuarioResumen;
    liked?: boolean;
    /* [183A-110-E] Estado de moderación — presente en Mis artículos para mostrar badges */
    moderacionEstado?: ModeracionEstadoArticulo;
}
