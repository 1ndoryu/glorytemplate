/**
 * URLs centralizadas del sitio.
 * Editar aqui para cambiar en todas las paginas.
 */
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
