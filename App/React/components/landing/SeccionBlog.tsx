import React from 'react';

/*
 * SeccionBlog: Sección de artículos del blog con grid de tarjetas.
 * Cada artículo muestra imagen, categoría, título, extracto y fecha.
 */

export interface ArticuloBlog {
    id: string;
    titulo: string;
    extracto: string;
    categoria: string;
    imagen: string;
    fecha: string;
    enlace?: string;
}

interface SeccionBlogProps {
    articulos: ArticuloBlog[];
    tituloSeccion?: string;
    botonTexto?: string;
    botonEnlace?: string;
}

/* Componente para tarjeta individual de blog */
const TarjetaBlog: React.FC<{articulo: ArticuloBlog}> = ({articulo}) => {
    return (
        <article className="tarjetaBlog">
            <div className="blogImagenContenedor">
                <img src={articulo.imagen} alt={articulo.titulo} className="blogImagen" loading="lazy" />
                <span className="blogCategoria">{articulo.categoria}</span>
            </div>
            <div className="blogContenido">
                <h3 className="blogTitulo">{articulo.titulo}</h3>
                <p className="blogExtracto">{articulo.extracto}</p>
                <div className="blogFooter">
                    <time className="blogFecha">{articulo.fecha}</time>
                    <a href={articulo.enlace || '#'} className="blogLeerMas">
                        Leer más
                    </a>
                </div>
            </div>
        </article>
    );
};

export const SeccionBlog: React.FC<SeccionBlogProps> = ({articulos, tituloSeccion = 'Blog', botonTexto = 'Ver todos', botonEnlace = '/blog'}) => {
    return (
        <section id="seccionBlog" className="seccionBlog">
            <div className="blogSeccionContenedor">
                <header className="blogHeader">
                    <h2 className="blogTituloGrande">{tituloSeccion}</h2>
                    <a href={botonEnlace} className="blogBotonVer">
                        {botonTexto}
                    </a>
                </header>
                <div className="gridBlog">
                    {articulos.map(articulo => (
                        <TarjetaBlog key={articulo.id} articulo={articulo} />
                    ))}
                </div>
            </div>
        </section>
    );
};

export default SeccionBlog;
