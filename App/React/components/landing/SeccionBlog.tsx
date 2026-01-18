import React from 'react';
import {Boton} from '../ui';
import {TarjetaBlog, ArticuloBlog} from './TarjetaBlog';

/*
 * SeccionBlog: Sección de artículos del blog con grid de tarjetas.
 * Refactorizado para usar TarjetaBlog como componente separado.
 */

export type {ArticuloBlog};

interface SeccionBlogProps {
    articulos: ArticuloBlog[];
    tituloSeccion?: string;
    botonTexto?: string;
    botonEnlace?: string;
}

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
