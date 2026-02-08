import {Servicio} from '../types/servicios';
import {Skill} from '../types/contenido';
import {obtenerImagen} from '../hooks/useImagenes';

/* Fuente única de verdad para los servicios */

declare global {
    interface Window {
        GLORY_CONTEXT?: {
            servicios?: Servicio[];
            proyectos?: unknown[];
            testimonios?: unknown[];
            marcas?: unknown[];
            miembros?: unknown[];
            blog?: unknown[];
        };
    }
}

const SERVICIOS_FALLBACK: Servicio[] = [
    {
        id: '1',
        titulo: 'Diseño de Sitios Web',
        descripcion: 'Sitios web únicos y memorables que destacan tu marca y conectan con tu audiencia.',
        imagen: obtenerImagen(0),
        categorias: ['web', 'branding'],
        link: '/servicios/diseno-web',
        skills: [
            {id: 1, titulo: 'Responsive Design', descripcion: 'Diseño adaptativo para todos los dispositivos.'},
            {id: 2, titulo: 'Performance', descripcion: 'Optimización de velocidad de carga.'},
            {id: 3, titulo: 'SEO On-page', descripcion: 'Estructura semántica y meta tags optimizados.'},
            {id: 4, titulo: 'CMS Integration', descripcion: 'Integración con WordPress u otros CMS.'},
        ]
    },
    {
        id: '2',
        titulo: 'Desarrollo de Aplicaciones',
        descripcion: 'Software a medida para automatizar y optimizar tus procesos de negocio.',
        imagen: obtenerImagen(5),
        categorias: ['software'],
        link: '/servicios/desarrollo-apps',
        skills: [
            {id: 1, titulo: 'React / React Native', descripcion: 'Framework para apps web y móviles.'},
            {id: 2, titulo: 'API Development', descripcion: 'APIs REST y GraphQL robustas.'},
            {id: 3, titulo: 'Cloud Architecture', descripcion: 'Infraestructura escalable en la nube.'},
            {id: 4, titulo: 'Testing & QA', descripcion: 'Suite de tests automatizados.'},
        ]
    },
    {
        id: '3',
        titulo: 'Agentes de IA',
        descripcion: 'Implementación de asistentes inteligentes y automatización con IA.',
        imagen: obtenerImagen(10),
        categorias: ['ai', 'software'],
        link: '/servicios/agentes-ia'
    },
    {
        id: '4',
        titulo: 'Identidad de Marca',
        descripcion: 'Creación de identidad visual que comunica la esencia de tu negocio.',
        imagen: obtenerImagen(15),
        categorias: ['branding'],
        link: '/servicios/branding'
    },
    {
        id: '5',
        titulo: 'E-commerce',
        descripcion: 'Tiendas online optimizadas para convertir visitantes en clientes.',
        imagen: obtenerImagen(20),
        categorias: ['web', 'software'],
        link: '/servicios/ecommerce'
    },
    {
        id: '6',
        titulo: 'Chatbots Personalizados',
        descripcion: 'Bots conversacionales que mejoran la atención al cliente 24/7.',
        imagen: obtenerImagen(25),
        categorias: ['ai'],
        link: '/servicios/chatbots'
    },
    {
        id: '7',
        titulo: 'Diseño UX/UI',
        descripcion: 'Interfaces intuitivas centradas en la experiencia del usuario.',
        imagen: obtenerImagen(30),
        categorias: ['web', 'software'],
        link: '/servicios/ux-ui'
    },
    {
        id: '8',
        titulo: 'Automatización de Procesos',
        descripcion: 'Herramientas que eliminan tareas repetitivas y optimizan flujos de trabajo.',
        imagen: obtenerImagen(35),
        categorias: ['software', 'ai'],
        link: '/servicios/automatizacion'
    },
    {
        id: '9',
        titulo: 'Consultoría Digital',
        descripcion: 'Estrategia y asesoramiento para tu transformación digital.',
        imagen: obtenerImagen(40),
        categorias: ['branding'],
        link: '/servicios/consultoria'
    }
];

/* Intentar obtener datos del contexto global (PHP) o usar fallback */
const getServiciosData = (): Servicio[] => {
    if (typeof window !== 'undefined' && window.GLORY_CONTEXT?.servicios) {
        return window.GLORY_CONTEXT.servicios;
    }
    return SERVICIOS_FALLBACK;
};

export const SERVICIOS_DATA: Servicio[] = getServiciosData();

/* Subconjuntos derivados para uso en diferentes secciones */

/* Para la Home (primeros 6) */
export const SERVICIOS_PRINCIPALES = SERVICIOS_DATA.slice(0, 6);

/*
 * Obtener servicios relacionados excluyendo el servicio actual.
 * Si no se pasa ID, retorna 3 servicios aleatorios.
 */
export const obtenerServiciosRelacionados = (servicioActualId?: string, cantidad: number = 3): Servicio[] => {
    const filtrados = servicioActualId
        ? SERVICIOS_DATA.filter(s => String(s.id) !== String(servicioActualId))
        : SERVICIOS_DATA;

    /* Mezcla simple para variedad */
    const mezclados = [...filtrados].sort(() => Math.random() - 0.5);
    return mezclados.slice(0, cantidad);
};

/* Alias retrocompatible (sin filtro) */
export const SERVICIOS_RELACIONADOS = SERVICIOS_DATA.slice(0, 3);
