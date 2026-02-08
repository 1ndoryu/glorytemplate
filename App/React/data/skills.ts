/*
 * Skills por defecto para servicios individuales.
 * Estos son fallback; los datos reales vienen del contexto PHP (window.GLORY_CONTEXT).
 * Cada skill tiene descripción que explica su relevancia en el proyecto.
 */
import {Skill} from '../types/contenido';

export const SKILLS_POR_DEFECTO: Skill[] = [
    {
        id: 1,
        titulo: 'User Experience (UX)',
        descripcion: 'Investigación y diseño centrado en el usuario para crear experiencias intuitivas que mejoran la retención y satisfacción del cliente.'
    },
    {
        id: 2,
        titulo: 'User Interface (UI)',
        descripcion: 'Diseño de interfaces visuales atractivas y funcionales que comunican la identidad de marca y facilitan la interacción.'
    },
    {
        id: 3,
        titulo: 'Prototyping',
        descripcion: 'Prototipado rápido para validar ideas y flujos antes del desarrollo, reduciendo costos y tiempo de iteración.'
    },
    {
        id: 4,
        titulo: 'Design Systems',
        descripcion: 'Creación de sistemas de diseño escalables que garantizan consistencia visual y aceleran el desarrollo futuro.'
    }
];
