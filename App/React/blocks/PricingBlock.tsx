/**
 * PricingBlock - Seccion de precios
 *
 * Bloque editable que muestra planes de precio
 * con caracteristicas y botones de accion.
 */

import {RevealElement} from '../components/shared/RevealElement';
import {Check, CheckCircle, Zap, Server, Image, LifeBuoy} from 'lucide-react';
import type {BlockComponentProps, BlockDefinition} from '@/pageBuilder';

/*
 * Props del bloque Pricing
 */
export interface PlanFeature {
    text: string;
    isHighlight?: boolean;
    subtext?: string;
}

export interface PricingPlan {
    name: string;
    description: string;
    price: string;
    period: string;
    ctaText: string;
    ctaUrl: string;
    features: PlanFeature[];
    isRecommended?: boolean;
}

export interface PricingBlockProps {
    title: string;
    subtitle?: string;
    plans: PricingPlan[];
}

/*
 * Componente PricingBlock
 */
export function PricingBlock({data}: BlockComponentProps<PricingBlockProps>): JSX.Element {
    const {title = 'Elige tu velocidad.', subtitle = 'Comienza gratis o automatiza todo con Pro.', plans = []} = data;

    return (
        <section id="pricing" className="py-32">
            <div className="max-w-[1200px] mx-auto px-6">
                <div className="text-center mb-16">
                    <RevealElement>
                        <h2 className="text-3xl font-bold mb-4">{title}</h2>
                    </RevealElement>
                    {subtitle && (
                        <RevealElement delay={100}>
                            <p className="text-gray-400">{subtitle}</p>
                        </RevealElement>
                    )}
                </div>

                <div className="grid md:grid-cols-2 gap-8 items-start">
                    {plans.map((plan, index) => (
                        <RevealElement key={plan.name} delay={index * 100}>
                            <div className={`bg-[#090909] rounded-3xl p-8 relative overflow-hidden transition-all duration-300 hover:bg-[#0c0c0c] hover:-translate-y-0.5 ${plan.isRecommended ? 'border border-white/20 shadow-[0_0_50px_rgba(255,255,255,0.05)]' : 'border border-white/5'}`}>
                                {/* Highlight para plan recomendado */}
                                {plan.isRecommended && <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white to-transparent opacity-40" />}

                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="text-xl font-bold">{plan.name}</h3>
                                    {plan.isRecommended && <span className="bg-white text-black text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">Recomendado</span>}
                                </div>
                                <p className="text-sm text-gray-400 mb-6">{plan.description}</p>

                                <div className="flex items-baseline gap-2 mb-8">
                                    <span className="text-4xl font-bold text-white">{plan.price}</span>
                                    <span className="text-gray-500">{plan.period}</span>
                                </div>

                                <a href={plan.ctaUrl} className={`block w-full py-3 rounded-xl font-medium text-center mb-8 transition-all ${plan.isRecommended ? 'bg-white text-black hover:bg-gray-200 hover:shadow-[0_0_20px_rgba(255,255,255,0.2)]' : 'bg-[#1a1a1a] hover:bg-[#222] text-white border border-white/10'}`}>
                                    {plan.ctaText}
                                </a>

                                <ul className="space-y-4">
                                    {plan.features.map((feature, i) => (
                                        <li key={i} className={`flex items-start gap-3 text-sm ${feature.isHighlight ? 'text-white font-medium' : 'text-gray-300'}`}>
                                            {feature.isHighlight ? <CheckCircle className="text-white mt-0.5 flex-shrink-0" size={16} /> : <Check className="text-white mt-0.5 flex-shrink-0" size={16} />}
                                            <span>
                                                {feature.text}
                                                {feature.subtext && (
                                                    <>
                                                        <br />
                                                        <span className="text-xs text-gray-500">{feature.subtext}</span>
                                                    </>
                                                )}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </RevealElement>
                    ))}
                </div>
            </div>
        </section>
    );
}

/*
 * Definicion del bloque para el registro
 */
export const pricingBlockDefinition: BlockDefinition<PricingBlockProps> = {
    type: 'pricing',
    label: 'Precios',
    icon: 'CreditCard',
    component: PricingBlock,
    defaultProps: {
        title: 'Planes y precios',
        subtitle: 'Elige el plan que mejor se adapte a ti.',
        plans: [
            {
                name: 'Gratis',
                description: 'Para comenzar.',
                price: '$0',
                period: '/mes',
                ctaText: 'Comenzar gratis',
                ctaUrl: '#',
                features: [{text: 'Caracteristica 1'}, {text: 'Caracteristica 2'}],
                isRecommended: false
            },
            {
                name: 'Pro',
                description: 'Para profesionales.',
                price: '$20',
                period: '/mes',
                ctaText: 'Probar Pro',
                ctaUrl: '#',
                features: [{text: 'Todo lo del plan gratis', isHighlight: true}, {text: 'Caracteristica premium 1'}, {text: 'Caracteristica premium 2'}],
                isRecommended: true
            }
        ]
    },
    editableFields: [
        {key: 'title', label: 'Titulo', type: 'text'},
        {key: 'subtitle', label: 'Subtitulo', type: 'text'},
        {
            key: 'plans',
            label: 'Planes',
            type: 'array',
            itemFields: [
                {key: 'name', label: 'Nombre del plan', type: 'text'},
                {key: 'description', label: 'Descripcion', type: 'text'},
                {key: 'price', label: 'Precio', type: 'text'},
                {key: 'period', label: 'Periodo', type: 'text'},
                {key: 'ctaText', label: 'Texto del boton', type: 'text'},
                {key: 'ctaUrl', label: 'URL del boton', type: 'url'}
            ]
        }
    ]
};

export default PricingBlock;
