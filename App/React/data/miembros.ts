/*
 * Datos de miembros del equipo centralizados.
 * Fuente: window.GLORY_CONTEXT.miembros (PHP) → Fallback estático.
 */
import {Miembro} from '../types/contenido';
import wanImg from '../../Assets/equipo/wan.jpg';
import anthonyImg from '../../Assets/equipo/anthony.jpg';
import misaelImg from '../../Assets/equipo/misael.jpg';

const MIEMBROS_FALLBACK: Miembro[] = [
    {
        id: 'wan',
        nombre: 'Wan',
        bio: 'Fundadora y directora creativa con visión estratégica para soluciones digitales de alto impacto.',
        cargo: 'CEO & Founder',
        avatar: wanImg,
        linkedin: '#',
        github: '#'
    },
    {
        id: 'anthony',
        nombre: 'Anthony',
        bio: 'Ingeniero de software principal, especializado en arquitecturas escalables y rendimiento.',
        cargo: 'Lead Developer',
        avatar: anthonyImg,
        linkedin: '#',
        github: '#'
    },
    {
        id: 'misael',
        nombre: 'Misael',
        bio: 'Ingeniero DevOps enfocado en la automatización, despliegue continuo y estabilidad de infraestructura.',
        cargo: 'DevOps Engineer',
        avatar: misaelImg,
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
