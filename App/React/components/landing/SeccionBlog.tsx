import React from 'react';
import {Tarjeta, TarjetaImagen, TarjetaCuerpo, TarjetaFooter, Etiqueta, Boton} from '../ui';

/*
 * SeccionBlog: Sección de artículos del blog con grid de tarjetas.
 * Cada artículo muestra imagen, categoría, título, extracto y fecha.
 * Refactorizado para usar sistema UI base.
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

/* Componente para tarjeta individual de blog usando sistema UI */
const TarjetaBlog: React.FC<{articulo: ArticuloBlog}> = ({articulo}) => {
    return (
        <Tarjeta interactiva className="tarjetaBlog">
            <div className="blogImagenContenedor">
                <TarjetaImagen src={articulo.imagen} alt={articulo.titulo} />
                <Etiqueta variante="categoria" tamano="xs" className="blogCategoria">
                    {articulo.categoria}
                </Etiqueta>
            </div>
            <TarjetaCuerpo className="blogContenido">
                <h3 className="blogTitulo">{articulo.titulo}</h3>
                <p className="blogExtracto">{articulo.extracto}</p>
                <TarjetaFooter className="blogFooter">
                    <time className="blogFecha">{articulo.fecha}</time>
                    <Boton href={articulo.enlace || '#'} variante="link" tamano="sm">
                        Leer más
                    </Boton>
                </TarjetaFooter>
            </TarjetaCuerpo>
        </Tarjeta>
    );
};

export const SeccionBlog: React.FC<SeccionBlogProps> = ({articulos, tituloSeccion = 'Blog', botonTexto = 'Ver todos', botonEnlace = '/blog'}) => {
    return (
        <section id="seccionBlog" className="seccionBlog">
            <div className="blogSeccionContenedor">
                <header className="blogHeader">
                    <h2 className="blogTituloGrande">{tituloSeccion}</h2>
                    <Boton href={botonEnlace} variante="outline" tamano="sm">
                        {botonTexto}
                    </Boton>
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
