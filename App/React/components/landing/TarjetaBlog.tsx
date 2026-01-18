import React from 'react';
import {Tarjeta, TarjetaCuerpo, TarjetaFooter, Etiqueta, Boton, ImagenGlory} from '../ui';

/*
 * TarjetaBlog: Tarjeta individual de artículo de blog.
 * Muestra imagen, categoría, título, extracto y fecha.
 * Extraído de SeccionBlog para reutilización.
 */

export interface ArticuloBlog {
    id: string;
    titulo: string;
    extracto: string;
    categoria: string;
    imagen: string;
    imagenRef?: string;
    fecha: string;
    enlace?: string;
}

interface TarjetaBlogProps {
    articulo: ArticuloBlog;
}

export const TarjetaBlog: React.FC<TarjetaBlogProps> = ({articulo}) => {
    return (
        <Tarjeta interactiva className="tarjetaBlog">
            <div className="blogImagenContenedor">
                <ImagenGlory src={articulo.imagenRef || articulo.imagen} alt={articulo.titulo} className="tarjetaImagen" variante="cover" />
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

export default TarjetaBlog;
