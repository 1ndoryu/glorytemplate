/**
 * useSiteConfig - Hook para acceder a la configuracion del sitio
 *
 * Este hook proporciona acceso tipado a la configuracion inyectada desde PHP.
 * Los valores se configuran en WordPress Admin > Theme Options.
 *
 * Uso:
 *   const { urls, identity, social, images, analytics } = useSiteConfig();
 *   // URLs de contacto
 *   <a href={urls.calendly}>Agendar</a>
 *   <a href={urls.whatsapp}>WhatsApp</a>
 *
 * La configuracion se inyecta desde:
 * - PHP: App/Config/opcionesTema.php (definicion de opciones)
 * - PHP: App/Content/reactContent.php (inyeccion a React)
 */

import {useContent} from './useContent';

// Tipos para la configuracion del sitio
export interface SiteIdentity {
    name: string;
    tagline: string;
    phone: string;
    email: string;
    siteUrl: string;
}

export interface SiteUrls {
    // URLs externas (configurables)
    calendly: string;
    whatsapp: string;
    whatsappNumber: string;
    // Paginas internas (estaticas)
    servicios: string;
    planes: string;
    demos: string;
    blog: string;
    sobreMi: string;
    contacto: string;
    privacidad: string;
    cookies: string;
}

export interface SocialProfiles {
    linkedin: string;
    twitter: string;
    youtube: string;
    instagram: string;
}

export interface SiteImages {
    hero: string;
    secondary: string;
    logo: string;
    logoMode: 'text' | 'image';
    logoText: string;
}

export interface AnalyticsConfig {
    gtmId: string;
    ga4Id: string;
    gscCode: string;
}

export interface UserPermissions {
    isLoggedIn: boolean;
    isAdmin: boolean;
}

export interface SiteConfig {
    identity: SiteIdentity;
    urls: SiteUrls;
    social: SocialProfiles;
    images: SiteImages;
    analytics: AnalyticsConfig;
    user: UserPermissions;
}

// Valores por defecto (fallback si no hay config desde PHP)
const defaultConfig: SiteConfig = {
    identity: {
        name: 'Glory Site',
        tagline: '',
        phone: '',
        email: '',
        siteUrl: ''
    },
    urls: {
        calendly: 'https://calendly.com/test',
        whatsapp: 'https://wa.me/0000000000',
        whatsappNumber: '0000000000',
        servicios: '/servicios',
        planes: '/planes',
        demos: '/demos',
        blog: '/blog',
        sobreMi: '/sobre-mi',
        contacto: '/contacto',
        privacidad: '/privacidad',
        cookies: '/cookies'
    },
    social: {
        linkedin: '',
        twitter: '',
        youtube: '',
        instagram: ''
    },
    images: {
        hero: '',
        secondary: '',
        logo: '',
        logoMode: 'text',
        logoText: ''
    },
    analytics: {
        gtmId: '',
        ga4Id: '',
        gscCode: ''
    },
    user: {
        isLoggedIn: false,
        isAdmin: false
    }
};

/**
 * Hook principal para obtener la configuracion completa del sitio.
 * Usa los valores de Theme Options inyectados desde PHP.
 */
export function useSiteConfig(): SiteConfig {
    const config = useContent<SiteConfig>('siteConfig', defaultConfig);
    return config;
}

/**
 * Hook para obtener solo las URLs del sitio.
 * Util cuando solo necesitas links de contacto o navegacion.
 */
export function useSiteUrls(): SiteUrls {
    const config = useSiteConfig();
    return config.urls;
}

/**
 * Hook para obtener la identidad del sitio.
 * Nombre, tagline, telefono, email.
 */
export function useSiteIdentity(): SiteIdentity {
    const config = useSiteConfig();
    return config.identity;
}

/**
 * Hook para obtener los perfiles sociales.
 */
export function useSocialProfiles(): SocialProfiles {
    const config = useSiteConfig();
    return config.social;
}

/**
 * Hook para obtener las imagenes del sitio.
 */
export function useSiteImages(): SiteImages {
    const config = useSiteConfig();
    return config.images;
}

/**
 * Hook para obtener la configuracion de analytics.
 */
export function useAnalyticsConfig(): AnalyticsConfig {
    const config = useSiteConfig();
    return config.analytics;
}

/**
 * Hook para obtener los permisos del usuario actual.
 * Devuelve si el usuario esta logueado y si es administrador.
 */
export function useUserPermissions(): UserPermissions {
    const config = useSiteConfig();
    return config.user;
}

/**
 * Hook para verificar si hay perfiles sociales configurados.
 */
export function useHasSocialProfiles(): boolean {
    const social = useSocialProfiles();
    return Boolean(social.linkedin || social.twitter || social.youtube || social.instagram);
}

/**
 * Obtiene un array de perfiles sociales activos (no vacios).
 */
export function useActiveSocialProfiles(): Array<{platform: keyof SocialProfiles; url: string}> {
    const social = useSocialProfiles();
    const profiles: Array<{platform: keyof SocialProfiles; url: string}> = [];

    if (social.linkedin) profiles.push({platform: 'linkedin', url: social.linkedin});
    if (social.twitter) profiles.push({platform: 'twitter', url: social.twitter});
    if (social.youtube) profiles.push({platform: 'youtube', url: social.youtube});
    if (social.instagram) profiles.push({platform: 'instagram', url: social.instagram});

    return profiles;
}
