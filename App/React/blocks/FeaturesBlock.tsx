/**
 * FeaturesBlock - Seccion de caracteristicas
 *
 * Bloque editable que muestra un grid de caracteristicas
 * con iconos, titulos y descripciones.
 */

import {RevealElement} from '../components/shared/RevealElement';
import {Zap, ShieldCheck, Image, LucideIcon} from 'lucide-react';
import type {BlockComponentProps, BlockDefinition} from '@/pageBuilder';

/*
 * Iconos disponibles para features
 */
const iconMap: Record<string, LucideIcon> = {
    Zap,
    ShieldCheck,
    Image
};

/*
 * Props del bloque Features
 */
export interface FeatureItem {
    icon: string;
    title: string;
    description: string;
}

export interface FeaturesBlockProps {
    title: string;
    subtitle?: string;
    items: FeatureItem[];
}

/*
 * Componente FeaturesBlock
 */
export function FeaturesBlock({data}: BlockComponentProps<FeaturesBlockProps>): JSX.Element {
    const {title = 'Ingenieria compleja.', subtitle = 'Experiencia simple.', items = []} = data;

    return (
        <section id="features" className="py-32 relative">
            <div className="max-w-[1200px] mx-auto px-6">
                <div className="mb-20">
                    <RevealElement>
                        <h2 className="text-3xl font-bold mb-4">
                            {title}
                            {subtitle && (
                                <>
                                    <br />
                                    <span className="text-gray-500">{subtitle}</span>
                                </>
                            )}
                        </h2>
                    </RevealElement>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                    {items.map((feature, index) => {
                        const IconComponent = iconMap[feature.icon] || Zap;

                        return (
                            <RevealElement key={feature.title} delay={index * 100}>
                                <div className="bg-[#090909] p-8 rounded-2xl flex flex-col justify-between h-64 transition-all duration-300 hover:bg-[#0c0c0c] hover:-translate-y-0.5">
                                    <div>
                                        <div className="w-10 h-10 bg-[#111] rounded-full flex items-center justify-center mb-4 text-white">
                                            <IconComponent size={20} />
                                        </div>
                                        <h3 className="text-xl font-medium mb-2">{feature.title}</h3>
                                        <p className="text-sm text-gray-400 leading-relaxed">{feature.description}</p>
                                    </div>
                                </div>
                            </RevealElement>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}

/*
 * Definicion del bloque para el registro
 */
export const featuresBlockDefinition: BlockDefinition<FeaturesBlockProps> = {
    type: 'features',
    label: 'Caracteristicas',
    icon: 'LayoutGrid',
    component: FeaturesBlock,
    defaultProps: {
        title: 'Caracteristicas principales.',
        subtitle: 'Lo que nos hace diferentes.',
        items: [
            {
                icon: 'Zap',
                title: 'Rapido',
                description: 'Descripcion de la primera caracteristica.'
            },
            {
                icon: 'ShieldCheck',
                title: 'Seguro',
                description: 'Descripcion de la segunda caracteristica.'
            },
            {
                icon: 'Image',
                title: 'Visual',
                description: 'Descripcion de la tercera caracteristica.'
            }
        ]
    },
    editableFields: [
        {key: 'title', label: 'Titulo', type: 'text'},
        {key: 'subtitle', label: 'Subtitulo', type: 'text'},
        {
            key: 'items',
            label: 'Caracteristicas',
            type: 'array',
            itemFields: [
                {
                    key: 'icon',
                    label: 'Icono',
                    type: 'select',
                    options: [
                        {value: 'Zap', label: 'Rayo'},
                        {value: 'ShieldCheck', label: 'Escudo'},
                        {value: 'Image', label: 'Imagen'}
                    ]
                },
                {key: 'title', label: 'Titulo', type: 'text'},
                {key: 'description', label: 'Descripcion', type: 'textarea'}
            ]
        }
    ]
};

export default FeaturesBlock;
