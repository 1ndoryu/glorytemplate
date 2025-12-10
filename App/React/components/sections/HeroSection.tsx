// Componente HeroSection
// Seccion principal con titulo, subtitulo, CTAs e indicadores de estado

import {ArrowRight} from 'lucide-react';
import {Button} from '../ui/Button';

interface StatusIndicator {
    label: string;
}

interface HeroSectionProps {
    title: React.ReactNode;
    subtitle: string;
    primaryCta: {
        text: string;
        href: string;
    };
    secondaryCta: {
        text: string;
        href: string;
    };
    statusIndicators?: StatusIndicator[];
    activeIndicatorIndex?: number;
    onIndicatorClick?: (index: number) => void;
}

export function HeroSection({title, subtitle, primaryCta, secondaryCta, statusIndicators = [], activeIndicatorIndex = 0, onIndicatorClick}: HeroSectionProps) {
    return (
        <section className="mx-auto w-full max-w-7xl">
            <div className="grid grid-cols-12 gap-6 items-start">
                <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tighter text-balance leading-[1.1]" style={{color: 'var(--color-text-primary)'}}>
                        {title}
                    </h1>
                    <p className="text-lg md:text-xl max-w-2xl leading-relaxed tracking-tight font-normal" style={{color: 'var(--color-text-muted)'}}>
                        {subtitle}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 pt-4">
                        <Button href={secondaryCta.href} variant="outline" className="h-10 px-6">
                            {secondaryCta.text}
                        </Button>
                        <Button href={primaryCta.href} icon={ArrowRight} className="h-10 px-6">
                            {primaryCta.text}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Indicadores de proceso - clicables */}
            {statusIndicators.length > 0 && (
                <div className="mt-16">
                    <div className="flex w-full flex-wrap items-center justify-between gap-6 text-[13px] md:text-sm font-medium tracking-tight font-mono" style={{color: 'var(--color-text-muted)'}}>
                        {statusIndicators.map((indicator, index) => {
                            const isActive = index === activeIndicatorIndex;
                            const isAnimated = isActive;

                            return (
                                <button key={index} onClick={() => onIndicatorClick?.(index)} className={`flex items-center gap-2 transition-all ${isActive ? 'hover:opacity-80 cursor-pointer scale-105' : 'opacity-50 hover:opacity-70 cursor-pointer'}`} style={{color: isActive ? 'var(--color-text-primary)' : 'inherit'}}>
                                    <div className={`h-4 w-4 rounded-full ${isActive && isAnimated ? 'border-[2px] border-dotted border-orange-500 animate-spin' : 'border'}`} style={{borderColor: isActive && isAnimated ? undefined : 'var(--color-border-secondary)'}}></div>
                                    <span>{indicator.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </section>
    );
}
