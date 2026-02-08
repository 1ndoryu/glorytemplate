/**
 * Componente: BlogIsland
 * Página de listado de artículos del blog.
 * TO-DO: Conectar con WP REST API para paginación real.
 */
import React, {useState, useMemo} from 'react';
import '../styles/variables.css';
import './BlogIsland.css';
import {LayoutPagina} from '../components/layout/LayoutPagina';
import {SeccionContacto} from '../components/home/SeccionContacto';
import {POSTS_BLOG} from '../data/blog';
import {PostBlog} from '../types/contenido';
import {obtenerImagenBlog} from '../hooks/useImagenes';

interface BlogIslandProps {
    titulo?: string;
}

/*
 * Tarjeta de artículo con layout horizontal.
 * Siempre muestra imagen: backend -> fallback colors (obtenerImagenBlog).
 */
const TarjetaArticulo: React.FC<{post: PostBlog; destacado?: boolean}> = ({post, destacado = false}) => {
    const imagenFinal = post.imagen || obtenerImagenBlog(post.id);

    return (
        <a href={post.link || '#'} className={`tarjetaArticulo ${destacado ? 'tarjetaArticuloDestacado' : ''}`}>
            <div className="articuloImagenWrapper">
                <img src={imagenFinal} alt={post.titulo} className="articuloImagen" loading="lazy" />
            </div>
            <div className="articuloContenido">
                <div className="articuloMeta">
                    <span className="articuloCategoria">{post.categoria}</span>
                    <span className="articuloFecha">{post.fecha}</span>
                </div>
                <h3 className="articuloTitulo">{post.titulo}</h3>
                <p className="articuloResumen">{post.resumen}</p>
                <span className="articuloLeer">Leer artículo →</span>
            </div>
        </a>
    );
};

export const BlogIsland = ({titulo = 'Blog'}: BlogIslandProps): JSX.Element => {
    const [categoriaActiva, setCategoriaActiva] = useState('todos');

    /* Categorías únicas extraídas de los posts */
    const categorias = useMemo(() => {
        const cats = new Set(POSTS_BLOG.map(p => p.categoria));
        return ['todos', ...Array.from(cats)];
    }, []);

    const postsFiltrados = useMemo(() => {
        if (categoriaActiva === 'todos') return POSTS_BLOG;
        return POSTS_BLOG.filter(p => p.categoria === categoriaActiva);
    }, [categoriaActiva]);

    return (
        <LayoutPagina className="blogMain" id="paginaBlog">
            {/* Hero */}
            <section className="blogHero">
                <div className="blogHeroContenido">
                    <div>
                        <h1 className="blogHeroTitulo">{titulo}</h1>
                    </div>
                    <div className="blogHeroDescripcion">
                        <p>Ideas, reflexiones y aprendizajes sobre diseño, tecnología y el futuro digital.</p>
                    </div>
                </div>
            </section>

            <section className="blogContenido">
                <div className="blogContenedor">
                    {/* Filtros de categoría */}
                    <div className="blogFiltros">
                        {categorias.map(cat => (
                            <button
                                key={cat}
                                className={`blogFiltroBtn ${categoriaActiva === cat ? 'blogFiltroBtnActivo' : ''}`}
                                onClick={() => setCategoriaActiva(cat)}
                            >
                                {cat === 'todos' ? 'Todos' : cat}
                            </button>
                        ))}
                    </div>

                    {/* Todos los posts dentro de un solo contenedor */}
                    {postsFiltrados.length > 0 && (
                        <div className="blogListaArticulos">
                            {postsFiltrados.map((post, i) => (
                                <TarjetaArticulo key={post.id} post={post} destacado={i === 0} />
                            ))}
                        </div>
                    )}

                    {postsFiltrados.length === 0 && (
                        <p className="blogSinResultados">No hay artículos para esta categoría.</p>
                    )}
                </div>
            </section>

            <SeccionContacto />
        </LayoutPagina>
    );
};

export default BlogIsland;
