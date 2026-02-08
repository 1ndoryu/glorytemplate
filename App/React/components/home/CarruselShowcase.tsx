/// <reference types="vite/client" />
/*
 * Componente: CarruselShowcase
 * Carrusel infinito de imágenes con desplazamiento automático y soporte drag.
 * Imágenes centralizadas en hooks/useImagenes.ts (DRY).
 */
import React from 'react';
import {Badge} from '../ui/Badge';
import './CarruselShowcase.css';
import {useCarruselInfinito} from '../../hooks/useCarruselInfinito';
import {IMAGENES_SHOWCASE} from '../../hooks/useImagenes';

export const CarruselShowcase: React.FC = () => {
    if (IMAGENES_SHOWCASE.length === 0) return null;

    const itemsTotales = [...IMAGENES_SHOWCASE, ...IMAGENES_SHOWCASE];

    const {indiceActual, conTransicion, dragOffset, handlers} = useCarruselInfinito({
        totalItems: IMAGENES_SHOWCASE.length,
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
                {itemsTotales.map((src, index) => (
                    <div key={`img-${index}`} className="carruselItem">
                        <div className="carruselImagenWrapper">
                            <img
                                src={src}
                                alt={`Imagen showcase ${index + 1}`}
                                className="carruselImagen"
                                draggable={false}
                            />
                        </div>
                        <div className="carruselContenido">
                            <h3 className="carruselTitulo">Proyecto {index + 1}</h3>
                            <div className="carruselTags">
                                <Badge label="Diseño" />
                                <Badge label="UX/UI" />
                                <Badge label="Branding" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            <div className="carruselOverlay" />
        </div>
    );
};
