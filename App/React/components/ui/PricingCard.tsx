import {Check} from 'lucide-react';
import {Button} from './Button';
import {Badge} from './Badge';

/**
 * Props para el componente PricingCard.
 */
interface PricingCardProps {
    title: string;
    price: string;
    description: string;
    features: string[];
    recommended?: boolean;
    ctaText?: string;
    ctaHref?: string;
}

/**
 * Tarjeta de plan de precios.
 * Soporta variante normal y destacada (recommended).
 */
export function PricingCard({title, price, description, features, recommended = false, ctaText = 'Elegir Plan', ctaHref = '#calendly'}: PricingCardProps) {
    // Estilos condicionales para la tarjeta destacada vs normal
    const cardClasses = `relative flex flex-col rounded-xl border p-6 md:p-8 transition-all duration-300 ${recommended ? 'bg-[#1c1917] border-[#292524] text-[#f8f8f6] shadow-xl md:-mt-4 md:mb-4 z-10' : 'bg-white border-[#e5e5e0] text-[#292524] hover:border-[#d6d3d1]'}`;

    const cardStyle = recommended
        ? {}
        : {
              backgroundColor: 'var(--color-bg-surface)',
              borderColor: 'var(--color-border-primary)',
              color: 'var(--color-text-primary)'
          };

    return (
        <div className={cardClasses} style={cardStyle}>
            {recommended && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-green-500 border-green-600 text-white font-bold tracking-wide shadow-sm">MAS POPULAR</Badge>
                </div>
            )}

            <div className="mb-6">
                <h3 className={`text-lg font-semibold tracking-tight mb-2 ${recommended ? 'text-white' : 'text-[#292524]'}`} style={!recommended ? {color: 'var(--color-text-primary)'} : {}}>
                    {title}
                </h3>
                <div className="flex items-baseline gap-1 mb-2">
                    <span className={`text-3xl font-bold ${recommended ? 'text-white' : 'text-[#292524]'}`} style={!recommended ? {color: 'var(--color-text-primary)'} : {}}>
                        {price}
                    </span>
                    {price !== 'A medida' && (
                        <span className={`text-sm ${recommended ? 'text-[#a8a29e]' : 'text-[#79716b]'}`} style={!recommended ? {color: 'var(--color-text-muted)'} : {}}>
                            /mes
                        </span>
                    )}
                </div>
                <p className={`text-sm leading-relaxed ${recommended ? 'text-[#d6d3d1]' : 'text-[#79716b]'}`} style={!recommended ? {color: 'var(--color-text-muted)'} : {}}>
                    {description}
                </p>
            </div>

            <div className="flex-1 mb-8">
                <ul className="space-y-3">
                    {features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm">
                            <Check className={`h-4 w-4 shrink-0 mt-0.5 ${recommended ? 'text-green-400' : 'text-[#292524]'}`} style={!recommended ? {color: 'var(--color-text-primary)'} : {}} />
                            <span className={recommended ? 'text-[#e7e5e4]' : 'text-[#57534e]'} style={!recommended ? {color: 'var(--color-text-secondary)'} : {}}>
                                {feature}
                            </span>
                        </li>
                    ))}
                </ul>
            </div>

            <Button href={ctaHref} variant={recommended ? 'white' : 'outline'} className="w-full justify-center">
                {ctaText}
            </Button>

            <div className="mt-4 text-center">
                <span className={`text-[10px] font-mono ${recommended ? 'text-[#79716b]' : ''}`} style={!recommended ? {color: 'var(--color-text-subtle)'} : {}}>
                    {recommended ? 'Mantenimiento incluido' : 'Primer mes GRATIS'}
                </span>
            </div>
        </div>
    );
}
