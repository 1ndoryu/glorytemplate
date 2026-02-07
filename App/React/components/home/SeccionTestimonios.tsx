/**
 * Componente: SeccionTestimonios
 * Muestra un carrusel interactivo de testimonios.
 * Reutiliza logica de carrusel infinito y estilos base de seccion.
 */
import React from 'react';
import './SeccionTestimonios.css';
import {useCarruselInfinito} from '../../hooks/useCarruselInfinito';
import {Button} from '../ui/Button';
import {SeccionHeader} from '../ui/SeccionHeader';

// Interfaz para los datos del testimonio
interface TestimonioData {
    id: number;
    texto: string;
    autor: string;
    cargo: string;
    avatar?: string; // URL opcional
}

// Datos Mock (Basados en la referencia visual y placeholders)
const TESTIMONIOS: TestimonioData[] = [
    {
        id: 1,
        texto: 'I would highly, highly recommend Glory. They took our often naively lofty aspirations for our new website, creative visuals, and brand touch up and overdelivered on all of them.',
        autor: 'Rory Codrington',
        cargo: 'CEO, Trust Keith',
        avatar: 'https://i.pravatar.cc/150?u=rory' // Placeholder avatar
    },
    {
        id: 2,
        texto: 'Glory is a fantastic quality designer. His communication is top notch, making him a breeze to work with. We worked together on onfolk.com and have confidence that the result will help us.',
        autor: 'Naz Malik',
        cargo: 'Founder, Onfolk',
        avatar: 'https://i.pravatar.cc/150?u=naz'
    },
    {
        id: 3,
        texto: "It's a 10/10 experience working with the team. They bring a deep understanding of early stage startups and used that to our advantage to create a brand that punched way above its weight.",
        autor: 'Alex Smith',
        cargo: 'CTO, TechStart',
        avatar: 'https://i.pravatar.cc/150?u=alex'
    },
    {
        id: 4,
        texto: 'The attention to detail and creative solutions provided were outstanding. Our clear choice for any future design work.',
        autor: 'Sarah Johnson',
        cargo: 'Product Lead, Innovate',
        avatar: 'https://i.pravatar.cc/150?u=sarah'
    }
];

export const SeccionTestimonios: React.FC = () => {
    // Usar el hook custom para logica de carrusel
    const items = TESTIMONIOS;
    // Duplicamos items visualmente para efecto infinito, pero el hook maneja el indice logico
    const itemsVisuales = [...items, ...items];

    // Configuración del carrusel: tiempo espera 5s, transicion 0.5s
    const {indiceActual, conTransicion, dragOffset, handlers} = useCarruselInfinito({
        totalItems: items.length,
        tiempoEspera: 5000,
        tiempoTransicion: 500
    });

    // Calculo del estilo de transformacion
    // Asumimos un ancho base de tarjeta + gap.
    // Nota: Para ser "exactamente igual" al responsive, lo ideal seria usar variables CSS o calc dinamico.
    // Aqui usamos un calculo aproximado que debera ajustarse con el CSS grid/flex gap.
    // Mejor opcion: Usar porcentajes o variables CSS inyectadas.

    // Ancho item + gap estimado (ajustar segun CSS)
    // Mobile: 300px + 32px gap = 332px
    // Desktop: 450px + 32px gap = 482px
    const getItemWidth = () => {
        if (typeof window !== 'undefined' && window.innerWidth < 768) return 332;
        return 482;
    };

    // En una implementacion real robusta, esto se calcularia con refs al DOM.
    // Por ahora usamos un valor base y dejamos que CSS maneje el layout visual,
    // pero el transform necesita valores.
    const itemWidth = typeof window !== 'undefined' && window.innerWidth < 768 ? 300 : 550;
    const gap = 32; // var(--spacing-lg) suele ser 32px
    const slideUnit = itemWidth + gap;

    const translateX = -(indiceActual * slideUnit) + dragOffset;

    return (
        <section className="seccionTestimonios">
            <div className="testimoniosContenedor">
                <SeccionHeader titulo="Testimonials" />

                <div
                    className="testimoniosCarruselWindow"
                    {...handlers} // Spread de eventos pointer
                    style={{touchAction: 'pan-y'}} // Permitir scroll vertical normal
                >
                    <div
                        className="testimoniosPista"
                        style={{
                            transform: `translateX(${translateX}px)`,
                            transition: conTransicion ? 'transform 0.5s cubic-bezier(0.25, 1, 0.5, 1)' : 'none'
                        }}>
                        {itemsVisuales.map((item, index) => (
                            <article key={`${item.id}-${index}`} className="testimonioCard" style={{width: `${itemWidth}px`}}>
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
