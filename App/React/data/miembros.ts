/*
 * Datos de miembros del equipo centralizados.
 * Fuente: window.GLORY_CONTEXT.miembros (PHP) → Fallback estático.
 */
import {Miembro} from '../types/contenido';

const MIEMBROS_FALLBACK: Miembro[] = [
    {
        id: 'carlos-nakomi',
        nombre: 'Carlos Nakomi',
        bio: 'Fundador y director creativo con más de 10 años de experiencia en diseño digital y desarrollo de software.',
        cargo: 'CEO & Director Creativo',
        avatar: 'https://i.pravatar.cc/300?u=carlos',
        linkedin: '#',
        twitter: '#'
    },
    {
        id: 'maria-design',
        nombre: 'María López',
        bio: 'Diseñadora UX/UI senior especializada en sistemas de diseño y accesibilidad.',
        cargo: 'Lead UX/UI Designer',
        avatar: 'https://i.pravatar.cc/300?u=maria',
        linkedin: '#',
        twitter: '#'
    },
    {
        id: 'andres-dev',
        nombre: 'Andrés Rivero',
        bio: 'Ingeniero de software full-stack con expertise en React, TypeScript y arquitecturas serverless.',
        cargo: 'Lead Software Engineer',
        avatar: 'https://i.pravatar.cc/300?u=andres',
        linkedin: '#',
        github: '#'
    },
    {
        id: 'lucia-ai',
        nombre: 'Lucía Fernández',
        bio: 'Especialista en inteligencia artificial y machine learning. Diseña los agentes de IA del estudio.',
        cargo: 'AI & ML Engineer',
        avatar: 'https://i.pravatar.cc/300?u=lucia',
        linkedin: '#',
        github: '#'
    }
];

const getMiembrosData = (): Miembro[] => {
    if (typeof window !== 'undefined' && window.GLORY_CONTEXT?.miembros) {
        return window.GLORY_CONTEXT.miembros as Miembro[];
    }
    return MIEMBROS_FALLBACK;
};

export const MIEMBROS_DATA: Miembro[] = getMiembrosData();
