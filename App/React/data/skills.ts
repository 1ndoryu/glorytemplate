/*
 * Skills por defecto para servicios individuales.
 * TO-DO: Migrar a datos del backend cuando cada servicio tenga sus propios skills en PHP.
 */
import {Skill} from '../types/contenido';

export const SKILLS_POR_DEFECTO: Skill[] = [
    {
        id: 1,
        titulo: 'User Experience (UX)',
        imagen: 'https://placehold.co/300x200/f3e8ff/151411?text=UX'
    },
    {
        id: 2,
        titulo: 'User Interface (UI)',
        imagen: 'https://placehold.co/300x200/f0fdf4/151411?text=UI'
    },
    {
        id: 3,
        titulo: 'Prototyping',
        imagen: 'https://placehold.co/300x200/ecfdf5/151411?text=Proto'
    },
    {
        id: 4,
        titulo: 'Design Systems',
        imagen: 'https://placehold.co/300x200/ffedd5/151411?text=System'
    }
];
