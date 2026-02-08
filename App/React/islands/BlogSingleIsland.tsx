/**
 * Island: BlogSingleIsland
 * Página individual de un post del blog.
 * Consume datos de window.GLORY_CONTEXT para el post actual.
 * TO-DO: Conectar con WP REST API para contenido real de posts.
 */
import React from 'react';
import {LayoutPagina} from '../components/layout/LayoutPagina';
import {SeccionContacto} from '../components/home/SeccionContacto';
import {POSTS_BLOG} from '../data/blog';
import {obtenerImagenBlog} from '../hooks/useImagenes';
import './BlogSingleIsland.css';

interface BlogSingleIslandProps {
    slug?: string;
    titulo?: string;
    contenido?: string;
    fecha?: string;
    categoria?: string;
    imagen?: string;
}

export const BlogSingleIsland = ({
    slug = '',
    titulo: tituloProp,
    contenido: contenidoProp,
    fecha: fechaProp,
    categoria: categoriaProp,
    imagen: imagenProp
}: BlogSingleIslandProps): JSX.Element => {
    /*
     * Si venimos de un single-post.php con datos inyectados,
     * usamos las props. Si no, buscamos en los datos locales por slug.
     */
    let titulo = tituloProp || 'Post del Blog';
    let contenido = contenidoProp || '';
    let fecha = fechaProp || '';
    let categoria = categoriaProp || '';
    let imagen = imagenProp || '';

    if (!contenidoProp && slug) {
        const postLocal = POSTS_BLOG.find(p => {
            const postSlug = p.link?.split('/').filter(Boolean).pop() || '';
            return postSlug === slug;
        });

        if (postLocal) {
            titulo = postLocal.titulo;
            contenido = postLocal.resumen || '';
            fecha = postLocal.fecha;
            categoria = postLocal.categoria;
            imagen = postLocal.imagen || obtenerImagenBlog(postLocal.id);
        }
    }

    if (!imagen) imagen = obtenerImagenBlog(1);

    return (
        <LayoutPagina className="blogSingleMain" id="paginaBlogSingle">
            {/* Hero del articulo */}
            <section className="blogSingleHero">
                <div className="blogSingleHeroContenido">
                    <div className="blogSingleMeta">
                        {categoria && <span className="blogSingleCategoria">{categoria}</span>}
                        {fecha && (
                            <>
                                <span className="blogSingleSeparador">•</span>
                                <span className="blogSingleFecha">{fecha}</span>
                            </>
                        )}
                    </div>
                    <h1 className="blogSingleTitulo">{titulo}</h1>
                </div>
            </section>

            {/* Imagen destacada */}
            <section className="blogSingleImagenSeccion">
                <div className="blogSingleImagenWrapper">
                    <img src={imagen} alt={titulo} className="blogSingleImagen" />
                </div>
            </section>

            {/* Contenido del articulo */}
            <section className="blogSingleContenido">
                <article className="blogSingleArticulo">
                    {contenido ? (
                        <div
                            className="blogSingleTexto"
                            dangerouslySetInnerHTML={{__html: contenido}}
                        />
                    ) : (
                        <div className="blogSingleTexto">
                            <p>
                                Este artículo está en proceso de redacción. Pronto tendrás el contenido completo disponible.
                                Mientras tanto, explorá nuestros otros artículos y descubrí más sobre diseño, tecnología y estrategia digital.
                            </p>
                            <p>
                                En nuestro blog compartimos insights, tendencias y guías prácticas que pueden ayudarte
                                a tomar mejores decisiones para tu próximo proyecto digital.
                            </p>
                        </div>
                    )}
                </article>
            </section>

            {/* Articulos relacionados */}
            <section className="blogSingleRelacionados">
                <div className="blogSingleRelacionadosContenedor">
                    <h2 className="blogSingleRelacionadosTitulo">Más artículos</h2>
                    <div className="blogSingleRelacionadosGrid">
                        {POSTS_BLOG.filter(p => {
                            const postSlug = p.link?.split('/').filter(Boolean).pop() || '';
                            return postSlug !== slug;
                        }).slice(0, 2).map(post => (
                            <a key={post.id} href={post.link} className="blogSingleRelacionadoCard">
                                <div className="blogSingleRelacionadoImagen">
                                    <img src={post.imagen || obtenerImagenBlog(post.id)} alt={post.titulo} loading="lazy" />
                                </div>
                                <div className="blogSingleRelacionadoInfo">
                                    <span className="blogSingleRelacionadoCategoria">{post.categoria}</span>
                                    <h3 className="blogSingleRelacionadoNombre">{post.titulo}</h3>
                                </div>
                            </a>
                        ))}
                    </div>
                </div>
            </section>

            <SeccionContacto />
        </LayoutPagina>
    );
};

export default BlogSingleIsland;
