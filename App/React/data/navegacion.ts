/*
 * Configuración centralizada de navegación.
 * Header, Footer, filtros: toda la estructura de links del sitio.
 */
import {EnlaceNavegacion, EnlaceFooter, FiltroCategoria} from '../types/navegacion';

/* Enlaces del Header */
export const ENLACES_HEADER: EnlaceNavegacion[] = [
    {label: 'Research', href: '#research'},
    {label: 'Economic Futures', href: '#economics'},
    {label: 'Commitments', href: '#commitments', hasDropdown: true},
    {label: 'Learn', href: '#learn', hasDropdown: true},
    {label: 'News', href: '#news'}
];

/* Enlaces del Footer */
export const ENLACES_FOOTER: EnlaceFooter[] = [
    {label: 'Home', href: '#'},
    {label: 'Services', href: '#servicios'},
    {label: 'Contact', href: '#contacto'},
    {label: 'Privacy Policy', href: '#'}
];

/* Categorías de filtrado para la página de servicios */
export const CATEGORIAS_SERVICIOS: FiltroCategoria[] = [
    {id: 'todos', label: 'Todos'},
    {id: 'web', label: 'Diseño Web'},
    {id: 'software', label: 'Software'},
    {id: 'ai', label: 'Inteligencia Artificial'},
    {id: 'branding', label: 'Branding'}
];
