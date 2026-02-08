/*
 * Configuración centralizada de navegación.
 * Header, Footer, filtros: toda la estructura de links del sitio.
 */
import {EnlaceNavegacion, EnlaceFooter, FiltroCategoria} from '../types/navegacion';

/* Enlaces del Header - Navegación principal del sitio */
export const ENLACES_HEADER: EnlaceNavegacion[] = [
    {label: 'Inicio', href: '/'},
    {label: 'Servicios', href: '/servicios/'},
    {label: 'Proyectos', href: '/proyectos/'},
    {label: 'Nosotros', href: '/nosotros/'},
    {label: 'Blog', href: '/blog/'},
    {
        label: 'Soluciones',
        href: '/soluciones/',
        hasDropdown: true,
        subEnlaces: [
            {label: 'Hosting', href: '/soluciones/hosting/'},
            {label: 'VPS', href: '/soluciones/vps/'},
            {label: 'Agentes de IA', href: '/soluciones/agentes-ia/'}
        ]
    }
];

/* Enlaces del Footer */
export const ENLACES_FOOTER: EnlaceFooter[] = [
    {label: 'Inicio', href: '/'},
    {label: 'Servicios', href: '/servicios/'},
    {label: 'Proyectos', href: '/proyectos/'},
    {label: 'Nosotros', href: '/nosotros/'},
    {label: 'Blog', href: '/blog/'},
    {label: 'Contacto', href: '/contacto/'},
    {label: 'Política de Privacidad', href: '/politica-privacidad/'}
];

/* Categorías de filtrado para la página de servicios */
export const CATEGORIAS_SERVICIOS: FiltroCategoria[] = [
    {id: 'todos', label: 'Todos'},
    {id: 'web', label: 'Diseño Web'},
    {id: 'software', label: 'Software'},
    {id: 'ai', label: 'Inteligencia Artificial'},
    {id: 'branding', label: 'Branding'}
];

/* Categorías de filtrado para la página de proyectos */
export const CATEGORIAS_PROYECTOS: FiltroCategoria[] = [
    {id: 'todos', label: 'Todos'},
    {id: 'web', label: 'Web'},
    {id: 'branding', label: 'Branding'},
    {id: 'app', label: 'Aplicaciones'},
    {id: 'ai', label: 'IA'}
];
