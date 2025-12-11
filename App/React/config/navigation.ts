import {siteUrls} from './urls';

/**
 * Tipo para items de navegacion.
 */
export interface NavItem {
    label: string;
    href: string;
}

/**
 * Items de navegacion principal.
 * Se usa en el Header de todas las paginas.
 */
export const mainNavItems: NavItem[] = [
    {label: 'Inicio', href: '/'},
    {label: 'Servicios', href: siteUrls.servicios},
    {label: 'Planes', href: siteUrls.planes},
    {label: 'Demos', href: siteUrls.demos},
    {label: 'Blog', href: siteUrls.blog},
    {label: 'Sobre Mi', href: siteUrls.sobreMi}
];

/**
 * Texto del logo usado en el Header.
 */
export const logoText = 'Guillermo';
