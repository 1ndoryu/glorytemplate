/*
 * Datos de blog centralizados.
 * Fuente temporal hasta conectar con WP REST API.
 */
import {PostBlog} from '../types/contenido';

export const POSTS_BLOG: PostBlog[] = [
    {
        id: 1,
        titulo: 'The Future of Digital Design',
        resumen: 'Exploring how AI and spatial computing are reshaping the landscape of user interfaces and experience design in 2026.',
        fecha: 'Feb 7, 2026',
        categoria: 'Design'
    },
    {
        id: 7,
        titulo: 'Building Scalable Systems',
        resumen: 'A comprehensive guide to architecting modern web applications that can handle millions of users without compromising performance.',
        fecha: 'Jan 28, 2026',
        categoria: 'Engineering'
    },
    {
        id: 12,
        titulo: 'Brand Identity in the AI Era',
        resumen: 'How brands can maintain authenticity and emotional connection in a world increasingly saturated with synthetic content.',
        fecha: 'Jan 15, 2026',
        categoria: 'Strategy'
    }
];
