/*
 * Cliente para conectar con WordPress REST API
 * Todas las funciones son async y se ejecutan en el servidor (SSR)
 */

import {WPPost, WPPage} from './types';

const API_URL = process.env.WORDPRESS_API_URL || 'http://glorybuilder.local';

/*
 * Obtener lista de posts
 */
export async function obtenerPosts(
    opciones: {
        porPagina?: number;
        pagina?: number;
    } = {}
): Promise<WPPost[]> {
    const {porPagina = 10, pagina = 1} = opciones;

    try {
        const res = await fetch(`${API_URL}/wp-json/wp/v2/posts?per_page=${porPagina}&page=${pagina}&_embed`, {next: {revalidate: 60}});

        if (!res.ok) {
            console.error('Error obteniendo posts:', res.status);
            return [];
        }

        return res.json();
    } catch (error) {
        console.error('Error de conexion con WordPress:', error);
        return [];
    }
}

/*
 * Obtener un post por su slug
 */
export async function obtenerPostPorSlug(slug: string): Promise<WPPost | null> {
    try {
        const res = await fetch(`${API_URL}/wp-json/wp/v2/posts?slug=${slug}&_embed`, {next: {revalidate: 60}});

        if (!res.ok) return null;

        const posts = await res.json();
        return posts[0] || null;
    } catch (error) {
        console.error('Error obteniendo post:', error);
        return null;
    }
}

/*
 * Obtener una pagina por su slug
 */
export async function obtenerPagina(slug: string): Promise<WPPage | null> {
    try {
        const res = await fetch(`${API_URL}/wp-json/wp/v2/pages?slug=${slug}&_embed`, {next: {revalidate: 60}});

        if (!res.ok) return null;

        const pages = await res.json();
        return pages[0] || null;
    } catch (error) {
        console.error('Error obteniendo pagina:', error);
        return null;
    }
}

/*
 * Obtener informacion del sitio
 */
export async function obtenerInfoSitio(): Promise<{
    nombre: string;
    descripcion: string;
} | null> {
    try {
        const res = await fetch(`${API_URL}/wp-json`, {
            next: {revalidate: 3600}
        });

        if (!res.ok) return null;

        const data = await res.json();
        return {
            nombre: data.name || 'Glory',
            descripcion: data.description || ''
        };
    } catch (error) {
        console.error('Error obteniendo info del sitio:', error);
        return null;
    }
}
