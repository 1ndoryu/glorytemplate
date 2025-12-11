/**
 * URLs centralizadas del sitio.
 * Editar aqui para cambiar en todas las paginas.
 */
export const siteUrls = {
    calendly: '#calendly',
    whatsapp: 'https://wa.me/34XXXXXXXXX',
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
