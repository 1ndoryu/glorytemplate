// Componente InternalLinks
// Seccion de interlinking interno segun project-extends.md
// Se coloca antes del footer para mejorar SEO y navegacion

import {ArrowRight} from 'lucide-react';

interface InternalLink {
    text: string;
    href: string;
}

interface InternalLinksProps {
    // Titulo opcional de la seccion
    title?: string;
    // Lista de enlaces internos
    links: InternalLink[];
}

// Enlaces predefinidos para HOME segun project-extends.md
export const homeInternalLinks: InternalLink[] = [
    {text: 'Servicios de chatbots y automatizacion', href: '/servicios'},
    {text: 'Ver planes y empezar gratis', href: '/planes'},
    {text: 'Probar una demo real', href: '/demos'},
    {text: 'Articulos practicos', href: '/blog'},
    {text: 'Quien soy y como trabajo', href: '/sobre-mi'},
    {text: 'Escribeme o reserva', href: '/contacto'}
];

// Enlaces predefinidos para SERVICIOS
export const serviciosInternalLinks: InternalLink[] = [
    {text: 'Ver planes (primer mes gratis)', href: '/planes'},
    {text: 'Probar una demo', href: '/demos'},
    {text: 'Escribeme por WhatsApp', href: '/contacto#whatsapp'},
    {text: 'Reservar una llamada', href: '/contacto#calendario'},
    {text: 'Formulario de contacto', href: '/contacto#formulario'},
    {text: 'Articulos practicos', href: '/blog'}
];

// Enlaces predefinidos para PLANES
export const planesInternalLinks: InternalLink[] = [
    {text: 'Ver servicios en detalle', href: '/servicios'},
    {text: 'Probar una demo', href: '/demos'},
    {text: 'Escribeme por WhatsApp', href: '/contacto#whatsapp'},
    {text: 'Reservar una llamada', href: '/contacto#calendario'},
    {text: 'Formulario de contacto', href: '/contacto#formulario'}
];

// Enlaces predefinidos para DEMOS
export const demosInternalLinks: InternalLink[] = [
    {text: 'Ver servicios en detalle', href: '/servicios'},
    {text: 'Ver planes (primer mes gratis)', href: '/planes'},
    {text: 'Escribeme por WhatsApp', href: '/contacto#whatsapp'},
    {text: 'Reservar una llamada', href: '/contacto#calendario'},
    {text: 'Formulario de contacto', href: '/contacto#formulario'},
    {text: 'Quien soy y como trabajo', href: '/sobre-mi'}
];

// Enlaces predefinidos para SOBRE MI
export const sobreMiInternalLinks: InternalLink[] = [
    {text: 'Ver servicios', href: '/servicios'},
    {text: 'Mira demos reales', href: '/demos'},
    {text: 'Elegir plan', href: '/planes'},
    {text: 'Hablar por contacto', href: '/contacto'}
];

export function InternalLinks({title = 'Te puede interesar', links}: InternalLinksProps) {
    if (!links || links.length === 0) return null;

    return (
        <section className="mx-auto w-full max-w-4xl">
            <div className="rounded-xl p-6 md:p-8 bg-secondary border border-[var(--color-border-subtle)]">
                {/* Titulo de la seccion */}
                <h2 className="text-lg font-semibold mb-4 text-primary">{title}</h2>

                {/* Grid de enlaces */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {links.map((link, index) => (
                        <a key={index} href={link.href} className="group flex items-center gap-2 px-4 py-3 rounded-lg transition-all hover:translate-x-1 bg-surface border border-primary text-secondary">
                            <ArrowRight className="w-4 h-4 flex-shrink-0 transition-transform group-hover:translate-x-1 text-[var(--color-accent-primary)]" />
                            <span className="text-sm font-medium group-hover:underline">{link.text}</span>
                        </a>
                    ))}
                </div>
            </div>
        </section>
    );
}
