/**
 * URLs centralizadas del sitio.
 *
 * NOTA: Este archivo mantiene valores hardcodeados para compatibilidad.
 * Para obtener valores dinamicos desde Theme Options, usar:
 *
 *   import { useSiteUrls } from '../hooks/useSiteConfig';
 *   const urls = useSiteUrls();
 *
 * Los valores de siteUrls se usan como fallback cuando el hook
 * no esta disponible (fuera de componentes React).
 */

// Valores estaticos de fallback (usados fuera de React o como defaults)
export const siteUrls = {
    calendly: 'https://calendly.com/andoryyu',
    whatsapp: 'https://wa.me/584120825234',
    // Paginas internas
    servicios: '/servicios',
    planes: '/planes',
    demos: '/demos',
    blog: '/blog',
    sobreMi: '/sobre-mi',
    contacto: '/contacto',
    privacidad: '/privacidad',
    cookies: '/cookies'
} as const;

// Tipo para autocompletado
export type SiteUrlKey = keyof typeof siteUrls;

/**
 * @deprecated Usar useSiteUrls() en componentes React para obtener
 * valores dinamicos desde Theme Options.
 *
 * Ejemplo:
 *   // Antes (estatico):
 *   import { siteUrls } from '../config/urls';
 *   <a href={siteUrls.calendly}>...</a>
 *
 *   // Ahora (dinamico):
 *   import { useSiteUrls } from '../hooks/useSiteConfig';
 *   const urls = useSiteUrls();
 *   <a href={urls.calendly}>...</a>
 */
