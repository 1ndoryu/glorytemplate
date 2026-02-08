/**
 * Componente: SeccionTestimonios
 * Muestra un carrusel interactivo de testimonios.
 * Datos centralizados en data/testimonios.ts (DRY).
 */
import React from 'react';
import './SeccionTestimonios.css';
import {useCarruselInfinito} from '../../hooks/useCarruselInfinito';
import {SeccionHeader} from '../ui/SeccionHeader';
import {TESTIMONIOS} from '../../data/testimonios';

export const SeccionTestimonios: React.FC = () => {
    const items = TESTIMONIOS;
    const itemsVisuales = [...items, ...items];

    const {indiceActual, conTransicion, dragOffset, handlers} = useCarruselInfinito({
        totalItems: items.length,
        tiempoEspera: 5000,
        tiempoTransicion: 500
    });

    return (
        <section className="seccionTestimonios">
            <div className="testimoniosContenedor">
                <SeccionHeader titulo="Testimonials" />

                <div
                    className="testimoniosCarruselWindow"
                    {...handlers}
                    style={{touchAction: 'pan-y'}}
                >
                    <div
                        className="testimoniosPista"
                        style={{
                            transform: `translateX(calc( -1 * (var(--testimonio-slide-unit)) * ${indiceActual} + ${dragOffset}px))`,
                            transition: conTransicion ? 'transform 0.5s cubic-bezier(0.25, 1, 0.5, 1)' : 'none'
                        }}>
                        {itemsVisuales.map((item, index) => (
                            <article key={`${item.id}-${index}`} className="testimonioCard">
                                <p className="testimonioTexto">{item.texto}</p>
                                <div className="testimonioAutor">
                                    {item.avatar && <img src={item.avatar} alt={item.autor} className="autorAvatar" />}
                                    <div className="autorInfo">
                                        <span className="autorNombre">{item.autor}</span>
                                        <span className="autorCargo">{item.cargo}</span>
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};
