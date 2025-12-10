// Componente GridCards
// Cuadricula de tarjetas con iconos para mostrar caracteristicas

import {type LucideIcon} from 'lucide-react';

interface CardItem {
    icon: LucideIcon;
    title: string;
    description: string;
}

interface GridCardsProps {
    title: string;
    subtitle?: string;
    cards: CardItem[];
}

export function GridCards({title, subtitle, cards}: GridCardsProps) {
    return (
        <section className="mx-auto w-full max-w-7xl pb-24">
            <div className="mb-12">
                <h2 className="text-2xl md:text-3xl font-medium tracking-tight text-[#292524]">{title}</h2>
                {subtitle && <p className="mt-2 text-[#79716b] max-w-3xl text-sm">{subtitle}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-10">
                {cards.map((card, i) => (
                    <div key={i} className="flex gap-4 items-start group">
                        <div className="h-12 w-12 rounded-lg bg-[#f0efeb] border border-[#e5e5e0] flex items-center justify-center flex-none text-[#79716b] group-hover:bg-[#e7e5e4] transition-colors">
                            <card.icon className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-[15px] font-medium text-[#292524]">{card.title}</h3>
                            <p className="mt-1 text-[13px] text-[#79716b] leading-relaxed">{card.description}</p>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}
