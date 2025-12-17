/*
 * Tipos TypeScript para la API de WordPress
 */

export interface WPPost {
    id: number;
    slug: string;
    title: {rendered: string};
    excerpt: {rendered: string};
    content: {rendered: string};
    date: string;
    featured_media: number;
    _embedded?: {
        'wp:featuredmedia'?: Array<{source_url: string; alt_text: string}>;
        author?: Array<{name: string; avatar_urls: {'96': string}}>;
    };
}

export interface WPPage {
    id: number;
    slug: string;
    title: {rendered: string};
    content: {rendered: string};
}

export interface ConfiguracionSitio {
    nombreSitio: string;
    descripcion: string;
    urlWordPress: string;
}
