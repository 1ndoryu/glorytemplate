/// <reference types="vite/client" />
/*
 * Componente: CarruselShowcase
 * Carrusel infinito de proyectos con desplazamiento automatico y soporte drag.
 * Datos desde backend (PROYECTOS_DATA) con imagenes reales, titulo y categorias.
 */
import React from 'react';
import {Badge} from '../ui/Badge';
import './CarruselShowcase.css';
import {useCarruselInfinito} from '../../hooks/useCarruselInfinito';
import {PROYECTOS_DATA} from '../../data/showcase';
import {IMAGENES_SHOWCASE} from '../../hooks/useImagenes';

export const CarruselShowcase: React.FC = () => {
    /*
     * Usar imagenes de proyectos del backend si tienen imagen,
     * sino fallback a IMAGENES_SHOWCASE del import.meta.glob.
     */
    const proyectosConImagen = PROYECTOS_DATA.map((proyecto, idx) => ({
        ...proyecto,
        imagen: proyecto.imagen || (IMAGENES_SHOWCASE.length > 0 ? IMAGENES_SHOWCASE[idx % IMAGENES_SHOWCASE.length] : ''),
    }));

    if (proyectosConImagen.length === 0) return null;

    const itemsTotales = [...proyectosConImagen, ...proyectosConImagen];

    const {indiceActual, conTransicion, dragOffset, handlers} = useCarruselInfinito({
        totalItems: proyectosConImagen.length,
        tiempoEspera: 8000,
        tiempoTransicion: 800
    });

    return (
        <div className="carruselContenedorPrincipal">
            <div
                className="carruselPista"
                {...handlers}
                style={
                    {
                        transform: `translateX(calc( -1 * (var(--carrusel-item-width) + var(--carrusel-item-gap)) * ${indiceActual} + ${dragOffset}px))`,
                        transition: conTransicion ? 'transform 800ms cubic-bezier(0.25, 1, 0.5, 1)' : 'none',
                        cursor: 'grab',
                        touchAction: 'pan-y'
                    } as React.CSSProperties
                }>
                {itemsTotales.map((proyecto, index) => {
                    const categoriasArr = Array.isArray(proyecto.categorias)
                        ? proyecto.categorias
                        : (proyecto.categorias ? [proyecto.categorias] : []);

                    return (
                        <a key={`proj-${index}`} href={proyecto.link || '#'} className="carruselItem" draggable={false}>
                            <div className="carruselImagenWrapper">
                                {proyecto.imagen && (
                                    <img
                                        src={proyecto.imagen}
                                        alt={proyecto.titulo}
                                        className="carruselImagen"
                                        draggable={false}
                                    />
                                )}
                            </div>
                            <div className="carruselContenido">
                                <h3 className="carruselTitulo">{proyecto.titulo}</h3>
                                <div className="carruselTags">
                                    {categoriasArr.slice(0, 3).map(cat => (
                                        <Badge key={cat} label={cat} />
                                    ))}
                                </div>
                            </div>
                        </a>
                    );
                })}
            </div>
            <div className="carruselOverlay" />
        </div>
    );
};
