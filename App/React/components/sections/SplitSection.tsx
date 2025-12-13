import {ReactNode} from 'react';

interface SplitSectionProps {
    id?: string;
    visual: ReactNode;
    content: ReactNode;
    visualPosition?: 'left' | 'right';
    className?: string;
    /** URL de imagen de fondo opcional para el panel visual */
    backgroundImage?: string;
}

/**
 * SplitSection: Componente de layout reutilizable para secciones divididas 50/50.
 * Utiliza el mismo diseno de tarjeta "bordeada" que WhatsAppShowcase y AnalyticsSection.
 */
export function SplitSection({id, visual, content, visualPosition = 'left', className = '', backgroundImage}: SplitSectionProps) {
    return (
        <section id={id} className={`mx-auto w-full max-w-7xl ${className}`}>
            <div className="border rounded-xl overflow-hidden shadow-sm border-primary bg-surface">
                <div className="grid grid-cols-1 lg:grid-cols-2">
                    {/* Visual Side */}
                    <div className={`p-6 md:p-8 lg:p-12 flex items-center justify-center border-b lg:border-b-0 relative overflow-hidden min-h-[300px] md:min-h-[340px] ${visualPosition === 'left' ? 'lg:border-r lg:order-1' : 'lg:border-l lg:order-2'} bg-secondary border-primary`}>
                        {/* Imagen de fondo opcional */}
                        {backgroundImage && <div className="absolute inset-0 bg-cover bg-center opacity-40" style={{backgroundImage: `url(${backgroundImage})`}} />}

                        {/* Abstract Grid Background */}
                        <div className="absolute inset-0 opacity-[0.4]" style={{backgroundImage: `linear-gradient(var(--color-border-primary) 1px, transparent 1px), linear-gradient(to right, var(--color-border-primary) 1px, transparent 1px)`, backgroundSize: '40px 40px'}}></div>

                        {/* Visual Content Wrapper */}
                        <div className="relative z-10 w-full flex justify-center">{visual}</div>
                    </div>

                    {/* Content Side */}
                    <div className={`p-8 md:p-12 flex flex-col justify-center ${visualPosition === 'left' ? 'lg:order-2' : 'lg:order-1'}`}>{content}</div>
                </div>
            </div>
        </section>
    );
}
