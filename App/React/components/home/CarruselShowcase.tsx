/// <reference types="vite/client" />
/*
 * Componente: CarruselShowcase
 * Muestra un carrusel infinito de imagenes con desplazamiento automatico y soporte drag.
 * Refactorizado para usar el hook useCarruselInfinito.
 */
import React from 'react';
import {Badge} from '../ui/Badge';
import './CarruselShowcase.css';
import {useCarruselInfinito} from '../../hooks/useCarruselInfinito';

// Importacion dinamica de imagenes
const modulosImagenes = import.meta.glob('../../../../Glory/assets/images/showcase/*.{jpg,jpeg,png,webp}', {
    eager: true,
    query: '?url',
    import: 'default'
});

const IMAGENES_SHOWCASE = Object.values(modulosImagenes) as string[];
const imagenesFinales = IMAGENES_SHOWCASE.length > 0 ? IMAGENES_SHOWCASE : [];

export const CarruselShowcase: React.FC = () => {
    if (imagenesFinales.length === 0) return null;

    const itemsTotales = [...imagenesFinales, ...imagenesFinales];

    // Usamos el hook centralizado. Configuracion un poco mas lenta para el showcase (8s)
    const {indiceActual, conTransicion, dragOffset, handlers} = useCarruselInfinito({
        totalItems: imagenesFinales.length,
        tiempoEspera: 8000,
        tiempoTransicion: 800
    });

    return (
        <div className="carruselContenedorPrincipal">
            <div
                className="carruselPista"
                {...handlers} // Agregamos interactividad
                style={
                    {
                        // Usamos variable CSS para el offset de drag (inyectada inline)
                        // La posicion base sigue dependiendo de las variables CSS responsivas
                        // Nota: Se asume que dragOffset esta en pixeles
                        // transform: `translateX(calc( ( -1 * (var(--carrusel-item-width) + var(--carrusel-item-gap)) * ${indiceActual} ) + ${dragOffset}px ))`,
                        // Sin embargo, para evitar conflictos de sintaxis compleja en calc(), lo separamos logicamente:
                        // Base position (CSS vars) + Drag Offset (JS px)
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
                                draggable={false} // Evitar drag nativo de imagen
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
