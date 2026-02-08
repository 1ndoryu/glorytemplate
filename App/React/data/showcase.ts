/*
 * Datos de showcase/proyectos centralizados.
 * Fuente: window.GLORY_CONTEXT.proyectos (PHP) → Fallback estático.
 * Se organizan en categorías para la sección showcase del home.
 */
import {Proyecto, CategoriaShowcase} from '../types/contenido';
import {obtenerImagenShowcase} from '../hooks/useImagenes';

const PROYECTOS_FALLBACK: Proyecto[] = [
    {
        id: 'aureva',
        titulo: 'AUREVA',
        cliente: 'Luxury Interior Design',
        categorias: ['branding', 'web'],
        imagen: obtenerImagenShowcase(0),
        descripcion: 'Diseño de marca e identidad visual para una firma de diseño de interiores de lujo.',
        link: '/proyectos/aureva',
        skills: [
            {id: 1, titulo: 'Branding', descripcion: 'Identidad visual completa desde cero.'},
            {id: 2, titulo: 'Web Design', descripcion: 'Sitio web que refleja elegancia y sofisticación.'},
        ]
    },
    {
        id: 'venture',
        titulo: 'VENTURE',
        cliente: 'Digital Product Design',
        categorias: ['web', 'app'],
        imagen: obtenerImagenShowcase(1),
        descripcion: 'Producto digital completo para una plataforma de inversiones.',
        link: '/proyectos/venture',
        skills: [
            {id: 1, titulo: 'Product Design', descripcion: 'Diseño de producto digital end-to-end.'},
            {id: 2, titulo: 'Design System', descripcion: 'Sistema escalable de componentes.'},
        ]
    },
    {
        id: 'payby',
        titulo: 'PAYBY',
        cliente: 'Banking Mobile App',
        categorias: ['app', 'web'],
        imagen: obtenerImagenShowcase(2),
        descripcion: 'Aplicación móvil de banca con flujos de pago intuitivos.',
        link: '/proyectos/payby',
        skills: [
            {id: 1, titulo: 'App Design', descripcion: 'Diseño mobile-first para fintech.'},
            {id: 2, titulo: 'Motion Design', descripcion: 'Micro-interacciones que generan confianza.'},
        ]
    },
    {
        id: 'kinetic',
        titulo: 'KINETIC',
        cliente: 'EV Startup',
        categorias: ['branding'],
        imagen: obtenerImagenShowcase(3),
        descripcion: 'Estrategia de marca para startup de vehículos eléctricos.',
        link: '/proyectos/kinetic'
    },
    {
        id: 'lumos',
        titulo: 'LUMOS',
        cliente: 'Smart Lighting',
        categorias: ['branding', 'web'],
        imagen: obtenerImagenShowcase(4),
        descripcion: 'Packaging y diseño web para marca de iluminación inteligente.',
        link: '/proyectos/lumos'
    },
    {
        id: 'elevate',
        titulo: 'ELEVATE',
        cliente: 'Fitness Brand',
        categorias: ['branding', 'ai'],
        imagen: obtenerImagenShowcase(5),
        descripcion: 'Campaña digital y redes sociales para marca de fitness premium.',
        link: '/proyectos/elevate'
    }
];

/* Obtener proyectos del contexto PHP o usar fallback */
const getProyectosData = (): Proyecto[] => {
    if (typeof window !== 'undefined' && window.GLORY_CONTEXT?.proyectos) {
        return window.GLORY_CONTEXT.proyectos as Proyecto[];
    }
    return PROYECTOS_FALLBACK;
};

export const PROYECTOS_DATA: Proyecto[] = getProyectosData();

/*
 * Agrupar proyectos en categorías para la sección showcase del home.
 * Se dividen en 2 grupos para el carrusel de categorías.
 */
export const CATEGORIAS_SHOWCASE: CategoriaShowcase[] = [
    {
        titulo: 'Website & Digital Experiences',
        proyectos: PROYECTOS_DATA.filter(p => {
            const cats = Array.isArray(p.categorias) ? p.categorias : [p.categorias];
            return cats.includes('web') || cats.includes('app');
        }).slice(0, 3)
    },
    {
        titulo: 'Brand Identity & Strategy',
        proyectos: PROYECTOS_DATA.filter(p => {
            const cats = Array.isArray(p.categorias) ? p.categorias : [p.categorias];
            return cats.includes('branding');
        }).slice(0, 3)
    }
];
