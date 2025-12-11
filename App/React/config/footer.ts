import {siteUrls} from './urls';

/**
 * Tipo para links del footer.
 */
export interface FooterLink {
    label: string;
    href: string;
}

/**
 * Tipo para columnas del footer.
 */
export interface FooterColumn {
    title: string;
    links: FooterLink[];
}

/**
 * Columnas del footer compartidas en todas las paginas.
 */
export const footerColumns: FooterColumn[] = [
    {
        title: 'Servicios',
        links: [
            {label: 'Chatbot WhatsApp', href: `${siteUrls.servicios}#whatsapp`},
            {label: 'Automatizacion', href: `${siteUrls.servicios}#automatizacion`},
            {label: 'Integraciones', href: `${siteUrls.servicios}#integraciones`}
        ]
    },
    {
        title: 'Recursos',
        links: [
            {label: 'Planes', href: siteUrls.planes},
            {label: 'Demos', href: siteUrls.demos},
            {label: 'Blog', href: siteUrls.blog}
        ]
    },
    {
        title: 'Legal',
        links: [
            {label: 'Politica de Privacidad', href: siteUrls.privacidad},
            {label: 'Politica de Cookies', href: siteUrls.cookies}
        ]
    }
];

/**
 * Genera el texto de copyright con el año actual.
 * @param variant - Variante del texto ('default' o 'consultoria')
 */
export function getCopyrightText(variant: 'default' | 'consultoria' = 'default'): string {
    const year = new Date().getFullYear();
    if (variant === 'consultoria') {
        return `© ${year} Guillermo Garcia. Consultoria de Automatizacion. Madrid, España.`;
    }
    return `© ${year} Guillermo Garcia. Chatbots y Automatizacion.`;
}
