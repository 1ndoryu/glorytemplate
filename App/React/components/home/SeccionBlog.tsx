/**
 * Componente: SeccionBlog
 * Muestra las últimas entradas del blog o novedades.
 * Diseño: Grid de 3 columnas con imágenes aleatorias y contenido placeholder.
 */
import React from 'react';
import {SeccionHeader} from '../ui/SeccionHeader';
import './SeccionBlog.css';

// Importación dinámica de imágenes de colores (Glory/assets/images/colors)
const modulosImagenes = import.meta.glob('../../../../Glory/assets/images/colors/*.{jpg,jpeg,png,webp}', {
    eager: true,
    query: '?url',
    import: 'default'
});

const IMAGENES_BLOG = Object.values(modulosImagenes) as string[];

// Función para obtener imagen determinista basada en ID para evitar saltos en hidratación
const obtenerImagenPorId = (id: number) => {
    if (IMAGENES_BLOG.length === 0) return 'https://placehold.co/600x400/e2e8f0/1e293b?text=Blog';
    return IMAGENES_BLOG[id % IMAGENES_BLOG.length];
};

interface BlogPost {
    id: number;
    titulo: string;
    resumen: string;
    fecha: string;
    categoria: string;
}

const BLOG_POSTS: BlogPost[] = [
    {
        id: 1,
        titulo: 'The Future of Digital Design',
        resumen: 'Exploring how AI and spatial computing are reshaping the landscape of user interfaces and experience design in 2026.',
        fecha: 'Feb 7, 2026',
        categoria: 'Design'
    },
    {
        id: 7, // ID elegido para variar la imagen
        titulo: 'Building Scalable Systems',
        resumen: 'A comprehensive guide to architecting modern web applications that can handle millions of users without compromising performance.',
        fecha: 'Jan 28, 2026',
        categoria: 'Engineering'
    },
    {
        id: 12, // ID elegido para variar la imagen
        titulo: 'Brand Identity in the AI Era',
        resumen: 'How brands can maintain authenticity and emotional connection in a world increasingly saturated with synthetic content.',
        fecha: 'Jan 15, 2026',
        categoria: 'Strategy'
    }
];

export const SeccionBlog: React.FC = () => {
    return (
        <section className="seccionBlog" id="blog">
            <div className="blogContenedor">
                <SeccionHeader titulo="Journal" />

                <div className="blogGrid">
                    {BLOG_POSTS.map(post => (
                        <article key={post.id} className="blogCard">
                            <div className="blogImagenWrapper">
                                <img src={obtenerImagenPorId(post.id)} alt={post.titulo} className="blogImagen" loading="lazy" />
                            </div>
                            <div className="blogInfo">
                                <div className="blogMeta">
                                    <span className="blogCategoria">{post.categoria}</span>
                                    <span className="blogSeparador">•</span>
                                    <span className="blogFecha">{post.fecha}</span>
                                </div>
                                <h3 className="blogTitulo">{post.titulo}</h3>
                                <p className="blogResumen">{post.resumen}</p>
                            </div>
                        </article>
                    ))}
                </div>
            </div>
        </section>
    );
};
