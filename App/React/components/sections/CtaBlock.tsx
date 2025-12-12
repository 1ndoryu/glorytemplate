import {Calendar, MessageSquare} from 'lucide-react';
import {Button} from '../ui';
// Configuracion dinamica desde Theme Options
import {useSiteUrls} from '../../hooks/useSiteConfig';

interface CtaItem {
    text: string;
    href: string;
    variant?: 'primary' | 'outline' | 'ghost' | 'white';
    icon?: React.ComponentType<{className?: string}>;
}

interface CtaBlockProps {
    /** Titulo del bloque, por defecto "Hablamos?" */
    title?: string;
    /** Subtitulo opcional, por defecto "Elige como prefieres:" */
    subtitle?: string;
    /** Items de CTA personalizados. Si no se pasan, usa los por defecto */
    items?: CtaItem[];
    /** Clase CSS adicional para el contenedor */
    className?: string;
    /** ID de la seccion para navegacion */
    id?: string;
}

/**
 * Bloque de CTAs reutilizable.
 * Usado al final de cada island para ofrecer multiples formas de contacto.
 * Mantiene consistencia visual en todo el sitio.
 */
export function CtaBlock({title = 'Hablamos?', subtitle = 'Elige como prefieres:', items, className = '', id = 'cta-block'}: CtaBlockProps) {
    // Obtener URLs dinamicas desde Theme Options (configurables en WP Admin)
    const urls = useSiteUrls();

    // CTAs por defecto usados en todas las islands: Calendario, WhatsApp y Formulario.
    const defaultCtaItems: CtaItem[] = [
        {text: 'Agenda en 30 s', href: urls.calendly, variant: 'primary', icon: Calendar},
        {text: 'Hablame ahora', href: urls.whatsapp, variant: 'outline', icon: MessageSquare},
        {text: 'Te leo y te respondo hoy', href: '#formulario', variant: 'ghost'}
    ];

    const ctaItems = items || defaultCtaItems;

    return (
        <section id={id} className={`py-16 text-center ${className}`}>
            <h2 className="text-3xl font-heading font-bold mb-4 text-primary">{title}</h2>
            {subtitle && <p className="mb-8 text-lg text-secondary">{subtitle}</p>}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                {ctaItems.map((item, idx) => (
                    <Button key={idx} href={item.href} variant={item.variant} icon={item.icon}>
                        {item.text}
                    </Button>
                ))}
            </div>
        </section>
    );
}
