/**
 * Componente: SeccionTestimonios
 * Muestra un carrusel interactivo de testimonios.
 * Datos centralizados en data/testimonios.ts (DRY).
 * Incluye botón para escribir un testimonio (abre modal).
 */
import React, {useState} from 'react';
import './SeccionTestimonios.css';
import {useCarruselInfinito} from '../../hooks/useCarruselInfinito';
import {SeccionHeader} from '../ui/SeccionHeader';
import {TESTIMONIOS} from '../../data/testimonios';
import {ModalTestimonio} from './ModalTestimonio';

export const SeccionTestimonios: React.FC = () => {
    const items = TESTIMONIOS;
    const itemsVisuales = [...items, ...items];
    const [modalAbierto, setModalAbierto] = useState(false);

    const {indiceActual, conTransicion, dragOffset, handlers} = useCarruselInfinito({
        totalItems: items.length,
        tiempoEspera: 5000,
        tiempoTransicion: 500
    });

    return (
        <section className="seccionTestimonios">
            <div className="testimoniosContenedor">
                <div className="testimoniosHeader">
                    <SeccionHeader titulo="Testimonials" />
                    <button className="testimoniosBotonEscribir" onClick={() => setModalAbierto(true)}>
                        Escribir un comentario
                    </button>
                </div>

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

            <ModalTestimonio abierto={modalAbierto} onCerrar={() => setModalAbierto(false)} />
        </section>
    );
};
