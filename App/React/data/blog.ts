/*
 * Datos de blog centralizados.
 * Fuente: window.GLORY_CONTEXT.blog (PHP/WP posts nativos) -> Fallback estatico.
 * TO-DO: Conectar con WP REST API para posts reales.
 */
import {PostBlog} from '../types/contenido';
import {obtenerImagenBlog} from '../hooks/useImagenes';

const POSTS_FALLBACK: PostBlog[] = [
    {
        id: 1,
        titulo: 'The Future of Digital Design',
        resumen: 'Exploring how AI and spatial computing are reshaping the landscape of user interfaces and experience design in 2026.',
        fecha: 'Feb 7, 2026',
        categoria: 'Design',
        link: '/blog/the-future-of-digital-design',
        imagen: obtenerImagenBlog(1)
    },
    {
        id: 7,
        titulo: 'Building Scalable Systems',
        resumen: 'A comprehensive guide to architecting modern web applications that can handle millions of users without compromising performance.',
        fecha: 'Jan 28, 2026',
        categoria: 'Engineering',
        link: '/blog/building-scalable-systems',
        imagen: obtenerImagenBlog(7)
    },
    {
        id: 12,
        titulo: 'Brand Identity in the AI Era',
        resumen: 'How brands can maintain authenticity and emotional connection in a world increasingly saturated with synthetic content.',
        fecha: 'Jan 15, 2026',
        categoria: 'Strategy',
        link: '/blog/brand-identity-in-the-ai-era',
        imagen: obtenerImagenBlog(12)
    }
];

const getBlogData = (): PostBlog[] => {
    if (typeof window !== 'undefined' && window.GLORY_CONTEXT?.blog) {
        return window.GLORY_CONTEXT.blog as PostBlog[];
    }
    return POSTS_FALLBACK;
};

export const POSTS_BLOG: PostBlog[] = getBlogData();
