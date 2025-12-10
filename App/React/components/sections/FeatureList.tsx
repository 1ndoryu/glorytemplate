// Componente FeatureList
// Lista de caracteristicas con iconos, similar a feature cards

import {type LucideIcon} from 'lucide-react';

interface Feature {
    icon: LucideIcon;
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
                        <item.icon className="w-5 h-5 text-[#a8a29e] group-hover:text-[#57534e] transition-colors" />
                    </div>
                    <div>
                        <h3 className="font-medium text-[#292524] text-[13px]">{item.title}</h3>
                        <p className="text-[#79716b] text-[13px] mt-0.5 leading-relaxed">{item.description}</p>
                    </div>
                </li>
            ))}
        </ul>
    );
}
