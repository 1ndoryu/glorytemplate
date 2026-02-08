/**
 * Componente: SeccionGaleriaServicio
 * Descripcion: Galeria de imagenes con scroll infinito, efecto de arrastre y formato 3:4.
 * Ubicacion: App/React/components/servicios/SeccionGaleriaServicio.tsx
 */
import React from 'react';
import {useCarruselInfinito} from '../../hooks/useCarruselInfinito';
import {useImagenes} from '../../hooks/useImagenes';
import './SeccionGaleriaServicio.css';

export const SeccionGaleriaServicio: React.FC = () => {
    const {imagenes} = useImagenes();

    // Si no hay imagenes, no renderizar nada
    if (imagenes.length === 0) return null;

    // Duplicamos las imagenes para efecto infinito
    const itemsTotales = [...imagenes, ...imagenes];

    const {indiceActual, conTransicion, dragOffset, handlers} = useCarruselInfinito({
        totalItems: imagenes.length,
        tiempoEspera: 6000,
        tiempoTransicion: 800
    });

    return (
        <section className="seccionGaleriaServicio">
            <div className="galeriaContenedorPrincipal">
                <div
                    className="galeriaPista"
                    {...handlers}
                    style={
                        {
                            transform: `translateX(calc( -1 * (var(--galeria-item-width) + var(--galeria-item-gap)) * ${indiceActual} + ${dragOffset}px))`,
                            transition: conTransicion ? 'transform 800ms cubic-bezier(0.25, 1, 0.5, 1)' : 'none',
                            cursor: 'grab',
                            touchAction: 'pan-y'
                        } as React.CSSProperties
                    }>
                    {itemsTotales.map((src, index) => (
                        <div key={`img-${index}`} className="galeriaItem">
                            <div className="galeriaImagenWrapper">
                                <img src={src} alt={`Galeria servicio ${index + 1}`} className="galeriaImagen" draggable={false} loading="lazy" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};
