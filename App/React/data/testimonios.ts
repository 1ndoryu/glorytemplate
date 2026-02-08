/*
 * Datos de testimonios centralizados.
 * Fuente de verdad única: se pueden mover al backend (PHP) cuando sea necesario.
 */
import {Testimonio} from '../types/contenido';

export const TESTIMONIOS: Testimonio[] = [
    {
        id: 1,
        texto: 'I would highly, highly recommend Nakomi. They took our often naively lofty aspirations for our new website, creative visuals, and brand touch up and overdelivered on all of them.',
        autor: 'Rory Codrington',
        cargo: 'CEO, Trust Keith',
        avatar: 'https://i.pravatar.cc/150?u=rory'
    },
    {
        id: 2,
        texto: 'Nakomi is a fantastic quality designer. His communication is top notch, making him a breeze to work with. We worked together on onfolk.com and have confidence that the result will help us.',
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
