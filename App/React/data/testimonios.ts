/*
 * Datos de testimonios centralizados.
 * Fuente: window.GLORY_CONTEXT.testimonios (PHP) → Fallback estático.
 */
import {Testimonio} from '../types/contenido';

const TESTIMONIOS_FALLBACK: Testimonio[] = [
    {
        id: 'rory-codrington',
        texto: 'I would highly, highly recommend Nakomi. They took our often naively lofty aspirations for our new website, creative visuals, and brand touch up and overdelivered on all of them.',
        autor: 'Rory Codrington',
        cargo: 'CEO, Trust Keith',
        avatar: 'https://i.pravatar.cc/150?u=rory'
    },
    {
        id: 'naz-malik',
        texto: 'Nakomi is a fantastic quality designer. His communication is top notch, making him a breeze to work with. We worked together on onfolk.com and have confidence that the result will help us.',
        autor: 'Naz Malik',
        cargo: 'Founder, Onfolk',
        avatar: 'https://i.pravatar.cc/150?u=naz'
    },
    {
        id: 'alex-smith',
        texto: "It's a 10/10 experience working with the team. They bring a deep understanding of early stage startups and used that to our advantage to create a brand that punched way above its weight.",
        autor: 'Alex Smith',
        cargo: 'CTO, TechStart',
        avatar: 'https://i.pravatar.cc/150?u=alex'
    },
    {
        id: 'sarah-johnson',
        texto: 'The attention to detail and creative solutions provided were outstanding. Our clear choice for any future design work.',
        autor: 'Sarah Johnson',
        cargo: 'Product Lead, Innovate',
        avatar: 'https://i.pravatar.cc/150?u=sarah'
    }
];

const getTestimoniosData = (): Testimonio[] => {
    if (typeof window !== 'undefined' && window.GLORY_CONTEXT?.testimonios) {
        return window.GLORY_CONTEXT.testimonios as Testimonio[];
    }
    return TESTIMONIOS_FALLBACK;
};

export const TESTIMONIOS: Testimonio[] = getTestimoniosData();
