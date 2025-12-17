/**
 * HeroBlock - Seccion principal de la landing
 *
 * Bloque editable que muestra el titulo principal,
 * subtitulo, badge y botones de accion.
 */

import {RevealElement} from '../components/shared/RevealElement';
import type {BlockComponentProps, BlockDefinition} from '@/pageBuilder';

/*
 * Props del bloque Hero
 */
export interface HeroBlockProps {
    badge?: string;
    title: string;
    subtitle: string;
    ctaText: string;
    ctaUrl: string;
    secondaryCtaText?: string;
    secondaryCtaUrl?: string;
}

/*
 * Componente HeroBlock
 */
export function HeroBlock({data}: BlockComponentProps<HeroBlockProps>): JSX.Element {
    const {badge = 'v2.0 Disponible Ahora', title = 'Importa productos de Amazon.\nSin complicaciones.', subtitle = 'Glory maneja la infraestructura compleja para que tu solo tengas que vender.', ctaText = 'Prueba 30 dias gratis', ctaUrl = '#', secondaryCtaText = 'Como funciona', secondaryCtaUrl = '#features'} = data;

    // Separar titulo en lineas
    const titleLines = title.split('\n');

    return (
        <header id="hero-section" className="relative pt-40 pb-20 px-6 overflow-hidden">
            {/* Efecto de glow */}
            <div
                className="absolute w-[600px] h-[600px] top-[-200px] left-1/2 -translate-x-1/2 z-[-1] pointer-events-none"
                style={{
                    background: 'radial-gradient(circle, rgba(255,255,255,0.03) 0%, rgba(5,5,5,0) 70%)'
                }}
            />

            <div className="max-w-[1200px] mx-auto text-center space-y-8">
                {badge && (
                    <RevealElement>
                        <span className="px-3 py-1 rounded-full bg-[#0f0f0f] text-xs text-gray-400 border border-white/5">{badge}</span>
                    </RevealElement>
                )}

                <RevealElement delay={100}>
                    <h1
                        className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.1]"
                        style={{
                            background: 'linear-gradient(180deg, #fff, #888)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text'
                        }}>
                        {titleLines.map((line, i) => (
                            <span key={i}>
                                {line}
                                {i < titleLines.length - 1 && <br />}
                            </span>
                        ))}
                    </h1>
                </RevealElement>

                <RevealElement delay={200}>
                    <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto font-light leading-relaxed">{subtitle}</p>
                </RevealElement>

                <RevealElement delay={300}>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                        <a href={ctaUrl} className="bg-white text-black px-8 py-3.5 rounded-full font-medium text-sm w-full sm:w-auto hover:bg-gray-200 transition-all hover:shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                            {ctaText}
                        </a>
                        {secondaryCtaText && (
                            <a href={secondaryCtaUrl} className="px-8 py-3.5 rounded-full font-medium text-sm text-gray-400 hover:text-white transition-colors w-full sm:w-auto">
                                {secondaryCtaText}
                            </a>
                        )}
                    </div>
                </RevealElement>
            </div>
        </header>
    );
}

/*
 * Definicion del bloque para el registro
 */
export const heroBlockDefinition: BlockDefinition<HeroBlockProps> = {
    type: 'hero',
    label: 'Hero Section',
    icon: 'Sparkles',
    component: HeroBlock,
    defaultProps: {
        badge: 'Nuevo',
        title: 'Titulo Principal\nSegunda linea',
        subtitle: 'Descripcion del producto o servicio que ofreces.',
        ctaText: 'Comenzar Ahora',
        ctaUrl: '#',
        secondaryCtaText: 'Saber mas',
        secondaryCtaUrl: '#features'
    },
    editableFields: [
        {key: 'badge', label: 'Badge', type: 'text', placeholder: 'ej: v2.0 Nuevo'},
        {key: 'title', label: 'Titulo', type: 'textarea', placeholder: 'Usa \\n para saltos de linea'},
        {key: 'subtitle', label: 'Subtitulo', type: 'textarea'},
        {key: 'ctaText', label: 'Texto del boton principal', type: 'text'},
        {key: 'ctaUrl', label: 'URL del boton principal', type: 'url'},
        {key: 'secondaryCtaText', label: 'Texto boton secundario', type: 'text'},
        {key: 'secondaryCtaUrl', label: 'URL boton secundario', type: 'url'}
    ]
};

export default HeroBlock;
