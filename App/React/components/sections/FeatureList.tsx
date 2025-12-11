// Componente FeatureList
// Lista de caracteristicas con iconos, similar a feature cards

import {type ComponentType} from 'react';

// Tipo flexible para iconos: acepta LucideIcon y cualquier componente con className
export interface Feature {
    icon: ComponentType<{className?: string; style?: React.CSSProperties}>;
    title: string;
    description: string;
}

interface FeatureListProps {
    features: Feature[];
}

export function FeatureList({features}: FeatureListProps) {
    return (
        <ul className="space-y-6">
            {features.map((item, i) => (
                <li key={i} className="flex gap-4 group">
                    <div className="flex-none mt-0.5">
                        <item.icon className="w-5 h-5 transition-colors text-subtle" />
                    </div>
                    <div>
                        <h3 className="font-medium text-[13px] text-primary">{item.title}</h3>
                        <p className="text-[13px] mt-0.5 leading-relaxed text-muted">{item.description}</p>
                    </div>
                </li>
            ))}
        </ul>
    );
}
