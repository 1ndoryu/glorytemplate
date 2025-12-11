import {LucideIcon} from 'lucide-react';

// --- TIPOS ---
interface BreakdownItem {
    icon: LucideIcon;
    title: string;
    desc: string;
}

interface PricingBreakdownProps {
    title?: string;
    subtitle?: string;
    items: BreakdownItem[];
}

// --- COMPONENTE ---
// Seccion que explica los factores que determinan el precio
// Reutilizable en cualquier pagina que necesite mostrar criterios de pricing
export function PricingBreakdown({title = 'Que determina el precio?', subtitle = 'No cobro por usuario ni por mensaje. Cobro por la complejidad de la solucion.', items}: PricingBreakdownProps): JSX.Element {
    return (
        <section id="pricing-breakdown" className="mx-auto w-full max-w-7xl">
            <div className="mb-8 md:text-center max-w-3xl mx-auto">
                <h2 className="text-2xl font-medium tracking-tight" style={{color: 'var(--color-text-primary)'}}>
                    {title}
                </h2>
                <p className="text-sm mt-2" style={{color: 'var(--color-text-muted)'}}>
                    {subtitle}
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {items.map((item, i) => (
                    <div key={i} className="p-6 border rounded-lg hover:shadow-sm transition-shadow" style={{backgroundColor: 'var(--color-bg-surface)', borderColor: 'var(--color-border-primary)'}}>
                        <div className="w-8 h-8 rounded-md flex items-center justify-center mb-4" style={{backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-secondary)'}}>
                            <item.icon className="w-4 h-4" />
                        </div>
                        <h3 className="text-sm font-bold mb-2" style={{color: 'var(--color-text-primary)'}}>
                            {item.title}
                        </h3>
                        <p className="text-xs leading-relaxed" style={{color: 'var(--color-text-muted)'}}>
                            {item.desc}
                        </p>
                    </div>
                ))}
            </div>
        </section>
    );
}
