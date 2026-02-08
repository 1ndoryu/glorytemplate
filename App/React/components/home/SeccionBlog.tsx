/**
 * Componente: SeccionBlog
 * Muestra las últimas entradas del blog.
 * Datos centralizados en data/blog.ts (DRY).
 * Imágenes centralizadas en hooks/useImagenes.ts (DRY).
 */
import React from 'react';
import {SeccionHeader} from '../ui/SeccionHeader';
import {obtenerImagenBlog} from '../../hooks/useImagenes';
import {POSTS_BLOG} from '../../data/blog';
import './SeccionBlog.css';

export const SeccionBlog: React.FC = () => {
    return (
        <section className="seccionBlog" id="blog">
            <div className="blogContenedor">
                <SeccionHeader titulo="Journal" />

                <div className="blogGrid">
                    {POSTS_BLOG.slice(0, 3).map(post => (
                        <article key={post.id} className="blogCard">
                            <div className="blogImagenWrapper">
                                <img src={obtenerImagenBlog(post.id)} alt={post.titulo} className="blogImagen" loading="lazy" />
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
